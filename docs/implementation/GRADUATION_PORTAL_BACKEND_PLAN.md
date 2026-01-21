# Graduation Portal - Laravel Backend Implementation Plan

> **Purpose**: This document provides a complete implementation guide for the Graduation Portal feature in the Laravel backend repository. It contains all specifications needed to implement with Claude Opus or any AI assistant.

---

## Table of Contents

1. [Overview & Context](#1-overview--context)
2. [Database Migrations](#2-database-migrations)
3. [Models & Relationships](#3-models--relationships)
4. [API Routes](#4-api-routes)
5. [Controllers](#5-controllers)
6. [Services](#6-services)
7. [Cache Configuration](#7-cache-configuration)
8. [WebSocket/Broadcasting](#8-websocketbroadcasting)
9. [Request Validation](#9-request-validation)
10. [File Format Specification](#10-file-format-specification)
11. [Testing](#11-testing)

---

## 1. Overview & Context

### 1.1 Feature Summary

The Graduation Portal allows Chairpersons (CP) and Advisors to create portals where students can submit their academic progress files (Excel/CSV) for graduation validation. **Critical PDPA requirement**: Student academic data must NOT be permanently stored in the database.

### 1.2 User Roles & Actions

| Role | Actions |
|------|---------|
| **Chairperson** | Create/manage portals, view all submissions, validate progress, approve/reject |
| **Advisor** | View portals in their department, process submissions for assigned students |
| **Student** | Browse portals, enter PIN, upload file, receive confirmation |

### 1.3 Data Flow Summary

```
Student uploads Excel → Frontend parses to JSON → Backend receives JSON → 
Stored in Redis/Cache (30 min TTL) → CP/Advisor notified via WebSocket → 
Validation runs → Results displayed → Data auto-expires
```

### 1.4 Existing Models Referenced

The following models already exist in your Laravel backend and will be used:

- `User` - Users with roles (student, advisor, chairperson, admin)
- `Department` - Academic departments
- `Curriculum` - Curriculum/program definitions
- `CurriculumCourse` - Courses in a curriculum
- `Course` - Course catalog
- `ElectiveRule` - Elective requirements per curriculum
- `CurriculumConstraint` - Credit requirements per category

---

## 2. Database Migrations

### 2.1 Create Graduation Portals Table

```php
<?php
// database/migrations/xxxx_xx_xx_create_graduation_portals_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graduation_portals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Relationships
            $table->foreignUuid('department_id')->constrained('departments')->onDelete('cascade');
            $table->foreignUuid('curriculum_id')->constrained('curricula')->onDelete('cascade');
            $table->foreignUuid('created_by')->constrained('users')->onDelete('cascade');
            
            // Portal Information
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('batch', 50)->nullable(); // e.g., "65x", "66x"
            
            // Security
            $table->string('pin_hash', 255); // bcrypt hash of PIN
            $table->string('pin_hint', 10)->nullable(); // e.g., "GR****"
            
            // Configuration
            $table->timestamp('deadline')->nullable();
            $table->enum('status', ['active', 'closed', 'archived'])->default('active');
            $table->json('accepted_formats')->default('["xlsx", "xls", "csv"]');
            $table->integer('max_file_size_mb')->default(5);
            
            // Timestamps
            $table->timestamps();
            $table->timestamp('closed_at')->nullable();
            
            // Indexes
            $table->index('department_id');
            $table->index('status');
            $table->index(['department_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('graduation_portals');
    }
};
```

### 2.2 Create Portal Activity Logs Table (Optional - for audit)

```php
<?php
// database/migrations/xxxx_xx_xx_create_graduation_portal_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graduation_portal_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('portal_id')->constrained('graduation_portals')->onDelete('cascade');
            $table->foreignUuid('performed_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->string('action', 50); // created, closed, pin_regenerated, submission_received, etc.
            $table->json('metadata')->nullable(); // Additional context
            
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('portal_id');
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('graduation_portal_logs');
    }
};
```

---

## 3. Models & Relationships

### 3.1 GraduationPortal Model

```php
<?php
// app/Models/GraduationPortal.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GraduationPortal extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'department_id',
        'curriculum_id',
        'created_by',
        'name',
        'description',
        'batch',
        'pin_hash',
        'pin_hint',
        'deadline',
        'status',
        'accepted_formats',
        'max_file_size_mb',
        'closed_at',
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'closed_at' => 'datetime',
        'accepted_formats' => 'array',
        'max_file_size_mb' => 'integer',
    ];

    protected $hidden = [
        'pin_hash',
    ];

    // ========================
    // Relationships
    // ========================

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(GraduationPortalLog::class, 'portal_id');
    }

    // ========================
    // PIN Methods
    // ========================

    /**
     * Set a new PIN and return the raw PIN for display
     */
    public function setPin(?string $rawPin = null): string
    {
        $rawPin = $rawPin ?? $this->generatePin();
        $this->pin_hash = Hash::make($rawPin);
        $this->pin_hint = substr($rawPin, 0, 2) . str_repeat('*', strlen($rawPin) - 2);
        return $rawPin;
    }

    /**
     * Verify a PIN against the hash
     */
    public function verifyPin(string $pin): bool
    {
        return Hash::check($pin, $this->pin_hash);
    }

    /**
     * Generate a random PIN
     */
    public static function generatePin(int $length = 6): string
    {
        return strtoupper(Str::random($length));
    }

    // ========================
    // Status Methods
    // ========================

    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->deadline && $this->deadline->isPast()) {
            return false;
        }

        return true;
    }

    public function close(): void
    {
        $this->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);
    }

    // ========================
    // Scopes
    // ========================

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where(function ($q) {
                         $q->whereNull('deadline')
                           ->orWhere('deadline', '>', now());
                     });
    }

    public function scopeForDepartment($query, string $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }
}
```

### 3.2 GraduationPortalLog Model

```php
<?php
// app/Models/GraduationPortalLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GraduationPortalLog extends Model
{
    use HasUuids;

    public $timestamps = false;
    
    protected $fillable = [
        'portal_id',
        'performed_by',
        'action',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function portal(): BelongsTo
    {
        return $this->belongsTo(GraduationPortal::class, 'portal_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // ========================
    // Factory Methods
    // ========================

    public static function log(
        string $portalId,
        string $action,
        ?string $performedBy = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'portal_id' => $portalId,
            'action' => $action,
            'performed_by' => $performedBy,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
```

---

## 4. API Routes

### 4.1 Route Definitions

```php
<?php
// routes/api.php (add to existing file)

use App\Http\Controllers\GraduationPortalController;
use App\Http\Controllers\GraduationSubmissionController;

// ============================================
// GRADUATION PORTAL ROUTES
// ============================================

// Public routes (for students to browse portals)
Route::prefix('public')->group(function () {
    Route::get('/graduation-portals', [GraduationPortalController::class, 'publicIndex']);
    Route::get('/graduation-portals/{portal}', [GraduationPortalController::class, 'publicShow']);
});

// PIN-authenticated routes (student submission)
Route::prefix('graduation-portals/{portal}')->group(function () {
    Route::post('/verify-pin', [GraduationPortalController::class, 'verifyPin']);
    Route::post('/submit', [GraduationSubmissionController::class, 'store'])
         ->middleware('graduation.session'); // Custom middleware
    Route::get('/curricula', [GraduationPortalController::class, 'getPortalCurricula']);
});

// Authenticated routes (CP/Advisor management)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Portal CRUD (CP only)
    Route::apiResource('graduation-portals', GraduationPortalController::class)
         ->except(['index']); // We have a custom index below
    
    Route::get('/graduation-portals', [GraduationPortalController::class, 'index']);
    Route::post('/graduation-portals/{portal}/close', [GraduationPortalController::class, 'close']);
    Route::post('/graduation-portals/{portal}/regenerate-pin', [GraduationPortalController::class, 'regeneratePin']);
    
    // Submission management (CP/Advisor)
    Route::prefix('graduation-portals/{portal}/submissions')->group(function () {
        Route::get('/', [GraduationSubmissionController::class, 'index']);
        Route::get('/{submissionId}', [GraduationSubmissionController::class, 'show']);
        Route::post('/{submissionId}/validate', [GraduationSubmissionController::class, 'validate']);
        Route::post('/{submissionId}/approve', [GraduationSubmissionController::class, 'approve']);
        Route::post('/{submissionId}/reject', [GraduationSubmissionController::class, 'reject']);
        Route::get('/{submissionId}/report', [GraduationSubmissionController::class, 'downloadReport']);
    });
    
    // Batch operations
    Route::post('/graduation-submissions/batch-validate', [GraduationSubmissionController::class, 'batchValidate']);
});
```

### 4.2 Custom Middleware for Session Validation

```php
<?php
// app/Http/Middleware/ValidateGraduationSession.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ValidateGraduationSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Graduation-Session-Token') 
                 ?? $request->input('session_token');

        if (!$token) {
            return response()->json([
                'error' => 'Session token required',
                'code' => 'SESSION_MISSING'
            ], 401);
        }

        $session = Cache::get("graduation_session:{$token}");

        if (!$session) {
            return response()->json([
                'error' => 'Session expired or invalid',
                'code' => 'SESSION_EXPIRED'
            ], 401);
        }

        // Validate IP matches (optional security)
        if (config('graduation.validate_ip', true) && $session['ip'] !== $request->ip()) {
            return response()->json([
                'error' => 'Session IP mismatch',
                'code' => 'SESSION_IP_MISMATCH'
            ], 401);
        }

        // Validate portal matches route
        $portal = $request->route('portal');
        if ($portal && $session['portal_id'] !== $portal->id) {
            return response()->json([
                'error' => 'Session portal mismatch',
                'code' => 'SESSION_PORTAL_MISMATCH'
            ], 401);
        }

        // Attach session to request for later use
        $request->merge(['graduation_session' => $session]);

        return $next($request);
    }
}

// Register in app/Http/Kernel.php:
// protected $middlewareAliases = [
//     ...
//     'graduation.session' => \App\Http\Middleware\ValidateGraduationSession::class,
// ];
```

---

## 5. Controllers

### 5.1 GraduationPortalController

```php
<?php
// app/Http/Controllers/GraduationPortalController.php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGraduationPortalRequest;
use App\Http\Requests\UpdateGraduationPortalRequest;
use App\Models\GraduationPortal;
use App\Models\GraduationPortalLog;
use App\Services\GraduationPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class GraduationPortalController extends Controller
{
    public function __construct(
        private GraduationPortalService $portalService
    ) {}

    // ============================================
    // PUBLIC ENDPOINTS (No Auth Required)
    // ============================================

    /**
     * List active portals (for students)
     * GET /api/public/graduation-portals
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $portals = GraduationPortal::active()
            ->when($request->department_id, fn($q, $id) => $q->forDepartment($id))
            ->when($request->batch, fn($q, $batch) => $q->where('batch', $batch))
            ->with(['department:id,name', 'curriculum:id,name'])
            ->select(['id', 'name', 'description', 'batch', 'deadline', 'department_id', 'curriculum_id'])
            ->orderBy('deadline')
            ->get();

        return response()->json([
            'portals' => $portals
        ]);
    }

    /**
     * Show single portal (public info only)
     * GET /api/public/graduation-portals/{portal}
     */
    public function publicShow(GraduationPortal $portal): JsonResponse
    {
        if (!$portal->isActive()) {
            return response()->json([
                'error' => 'Portal is not active',
                'code' => 'PORTAL_INACTIVE'
            ], 404);
        }

        return response()->json([
            'portal' => [
                'id' => $portal->id,
                'name' => $portal->name,
                'description' => $portal->description,
                'batch' => $portal->batch,
                'deadline' => $portal->deadline,
                'accepted_formats' => $portal->accepted_formats,
                'max_file_size_mb' => $portal->max_file_size_mb,
                'department' => $portal->department->only(['id', 'name']),
                'curriculum' => $portal->curriculum->only(['id', 'name']),
            ]
        ]);
    }

    /**
     * Verify PIN and create session token
     * POST /api/graduation-portals/{portal}/verify-pin
     */
    public function verifyPin(Request $request, GraduationPortal $portal): JsonResponse
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:20'
        ]);

        // Rate limiting: 5 attempts per portal per IP per 15 minutes
        $key = "portal_pin:{$portal->id}:{$request->ip()}";
        
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'error' => 'Too many attempts. Try again later.',
                'code' => 'RATE_LIMITED',
                'retry_after' => $seconds
            ], 429);
        }

        if (!$portal->isActive()) {
            return response()->json([
                'error' => 'Portal is no longer active',
                'code' => 'PORTAL_INACTIVE'
            ], 403);
        }

        if (!$portal->verifyPin($request->pin)) {
            RateLimiter::hit($key, 900); // 15 minutes
            return response()->json([
                'error' => 'Invalid PIN',
                'code' => 'INVALID_PIN'
            ], 401);
        }

        // Clear rate limiter on success
        RateLimiter::clear($key);

        // Generate session token
        $sessionToken = Str::random(64);
        $ttl = config('graduation.session_ttl_minutes', 15);

        Cache::put(
            "graduation_session:{$sessionToken}",
            [
                'portal_id' => $portal->id,
                'curriculum_id' => $portal->curriculum_id,
                'ip' => $request->ip(),
                'created_at' => now()->toISOString(),
            ],
            now()->addMinutes($ttl)
        );

        // Log the access
        GraduationPortalLog::log($portal->id, 'pin_verified', null, [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'session_token' => $sessionToken,
            'expires_in' => $ttl * 60, // seconds
            'curriculum' => $portal->curriculum->only(['id', 'name', 'totalCredits']),
        ]);
    }

    /**
     * Get available curricula for portal (for curriculum selection)
     * GET /api/graduation-portals/{portal}/curricula
     */
    public function getPortalCurricula(GraduationPortal $portal): JsonResponse
    {
        // The portal is already associated with a curriculum,
        // but we can show related curricula from the same department
        $curricula = $portal->department
            ->curricula()
            ->where('is_active', true)
            ->select(['id', 'name', 'totalCredits', 'batch'])
            ->get();

        return response()->json([
            'curricula' => $curricula,
            'default_curriculum_id' => $portal->curriculum_id,
        ]);
    }

    // ============================================
    // AUTHENTICATED ENDPOINTS (CP/Advisor)
    // ============================================

    /**
     * List portals for authenticated user's department
     * GET /api/graduation-portals
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check authorization
        if (!in_array($user->role, ['chairperson', 'advisor', 'admin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = GraduationPortal::query()
            ->with(['department:id,name', 'curriculum:id,name', 'creator:id,name']);

        // Filter by department unless admin
        if ($user->role !== 'admin') {
            $query->forDepartment($user->department_id);
        }

        // Apply filters
        $query->when($request->status, fn($q, $s) => $q->where('status', $s))
              ->when($request->curriculum_id, fn($q, $id) => $q->where('curriculum_id', $id));

        $portals = $query->orderByDesc('created_at')->paginate(20);

        // Add submission counts from cache
        $portals->getCollection()->transform(function ($portal) {
            $submissionIds = Cache::get("portal_submissions:{$portal->id}", []);
            $portal->pending_submissions_count = count($submissionIds);
            return $portal;
        });

        return response()->json($portals);
    }

    /**
     * Create new portal
     * POST /api/graduation-portals
     */
    public function store(StoreGraduationPortalRequest $request): JsonResponse
    {
        $user = $request->user();

        // Only CP can create portals
        if (!in_array($user->role, ['chairperson', 'admin'])) {
            return response()->json(['error' => 'Only chairpersons can create portals'], 403);
        }

        $portal = new GraduationPortal($request->validated());
        $portal->created_by = $user->id;
        $portal->department_id = $user->department_id; // Use user's department
        
        // Generate PIN
        $rawPin = $request->custom_pin ?? GraduationPortal::generatePin();
        $portal->setPin($rawPin);
        $portal->save();

        // Log creation
        GraduationPortalLog::log($portal->id, 'created', $user->id);

        return response()->json([
            'portal' => $portal->fresh(['department', 'curriculum']),
            'pin' => $rawPin, // Return raw PIN only once!
            'message' => 'Portal created successfully. Save the PIN - it will not be shown again.'
        ], 201);
    }

    /**
     * Show portal details
     * GET /api/graduation-portals/{portal}
     */
    public function show(Request $request, GraduationPortal $portal): JsonResponse
    {
        $this->authorizePortalAccess($request->user(), $portal);

        $portal->load(['department', 'curriculum', 'creator:id,name', 'logs' => fn($q) => $q->latest()->limit(10)]);

        // Get submission count from cache
        $submissionIds = Cache::get("portal_submissions:{$portal->id}", []);

        return response()->json([
            'portal' => $portal,
            'pending_submissions_count' => count($submissionIds),
        ]);
    }

    /**
     * Update portal
     * PUT /api/graduation-portals/{portal}
     */
    public function update(UpdateGraduationPortalRequest $request, GraduationPortal $portal): JsonResponse
    {
        $this->authorizePortalAccess($request->user(), $portal, true);

        $portal->update($request->validated());

        GraduationPortalLog::log($portal->id, 'updated', $request->user()->id, [
            'changes' => $request->validated()
        ]);

        return response()->json([
            'portal' => $portal->fresh(['department', 'curriculum']),
            'message' => 'Portal updated successfully'
        ]);
    }

    /**
     * Delete portal
     * DELETE /api/graduation-portals/{portal}
     */
    public function destroy(Request $request, GraduationPortal $portal): JsonResponse
    {
        $this->authorizePortalAccess($request->user(), $portal, true);

        // Clear any cached submissions
        Cache::forget("portal_submissions:{$portal->id}");

        $portal->delete();

        return response()->json([
            'message' => 'Portal deleted successfully'
        ]);
    }

    /**
     * Close portal
     * POST /api/graduation-portals/{portal}/close
     */
    public function close(Request $request, GraduationPortal $portal): JsonResponse
    {
        $this->authorizePortalAccess($request->user(), $portal, true);

        $portal->close();

        GraduationPortalLog::log($portal->id, 'closed', $request->user()->id);

        return response()->json([
            'portal' => $portal->fresh(),
            'message' => 'Portal closed successfully'
        ]);
    }

    /**
     * Regenerate portal PIN
     * POST /api/graduation-portals/{portal}/regenerate-pin
     */
    public function regeneratePin(Request $request, GraduationPortal $portal): JsonResponse
    {
        $this->authorizePortalAccess($request->user(), $portal, true);

        $newPin = $portal->setPin();
        $portal->save();

        GraduationPortalLog::log($portal->id, 'pin_regenerated', $request->user()->id);

        return response()->json([
            'pin' => $newPin,
            'pin_hint' => $portal->pin_hint,
            'message' => 'New PIN generated. Save it - it will not be shown again.'
        ]);
    }

    // ============================================
    // AUTHORIZATION HELPERS
    // ============================================

    private function authorizePortalAccess($user, GraduationPortal $portal, bool $requireOwner = false): void
    {
        if ($user->role === 'admin') {
            return;
        }

        if ($user->department_id !== $portal->department_id) {
            abort(403, 'You can only access portals in your department');
        }

        if ($requireOwner && $user->role !== 'chairperson') {
            abort(403, 'Only chairpersons can modify portals');
        }
    }
}
```

### 5.2 GraduationSubmissionController

```php
<?php
// app/Http/Controllers/GraduationSubmissionController.php

namespace App\Http\Controllers;

use App\Events\NewGraduationSubmission;
use App\Events\SubmissionValidated;
use App\Http\Requests\StoreGraduationSubmissionRequest;
use App\Models\GraduationPortal;
use App\Models\GraduationPortalLog;
use App\Services\GraduationValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GraduationSubmissionController extends Controller
{
    public function __construct(
        private GraduationValidationService $validationService
    ) {}

    /**
     * Submit course data for validation
     * POST /api/graduation-portals/{portal}/submit
     */
    public function store(StoreGraduationSubmissionRequest $request, GraduationPortal $portal): JsonResponse
    {
        $session = $request->input('graduation_session');
        $ttl = config('graduation.submission_ttl_minutes', 30);

        // Generate submission ID
        $submissionId = (string) Str::uuid();

        // Prepare submission data
        $submissionData = [
            'id' => $submissionId,
            'portal_id' => $portal->id,
            'curriculum_id' => $request->curriculum_id ?? $portal->curriculum_id,
            'student_identifier' => $this->sanitizeIdentifier($request->student_identifier),
            'courses' => $this->sanitizeCourses($request->courses),
            'submitted_at' => now()->toISOString(),
            'validated' => false,
            'validation_result' => null,
            'expires_at' => now()->addMinutes($ttl)->toISOString(),
            'ip' => $request->ip(),
        ];

        // Store in cache
        Cache::put(
            "graduation_submission:{$submissionId}",
            $submissionData,
            now()->addMinutes($ttl)
        );

        // Add to portal's submission list
        $portalSubmissions = Cache::get("portal_submissions:{$portal->id}", []);
        $portalSubmissions[] = $submissionId;
        Cache::put("portal_submissions:{$portal->id}", $portalSubmissions, now()->addMinutes($ttl));

        // Log submission
        GraduationPortalLog::log($portal->id, 'submission_received', null, [
            'submission_id' => $submissionId,
            'course_count' => count($request->courses),
        ]);

        // Broadcast to CP/Advisor dashboard
        event(new NewGraduationSubmission($portal, $submissionId, $submissionData));

        return response()->json([
            'submission_id' => $submissionId,
            'message' => 'Submission received successfully',
            'expires_at' => $submissionData['expires_at'],
            'expires_in_minutes' => $ttl,
        ], 201);
    }

    /**
     * List submissions for a portal
     * GET /api/graduation-portals/{portal}/submissions
     */
    public function index(Request $request, GraduationPortal $portal): JsonResponse
    {
        $this->authorizeAccess($request->user(), $portal);

        $submissionIds = Cache::get("portal_submissions:{$portal->id}", []);
        $submissions = [];

        foreach ($submissionIds as $submissionId) {
            $submission = Cache::get("graduation_submission:{$submissionId}");
            if ($submission) {
                // Add time remaining
                $expiresAt = \Carbon\Carbon::parse($submission['expires_at']);
                $submission['time_remaining_minutes'] = max(0, now()->diffInMinutes($expiresAt, false));
                $submissions[] = $submission;
            }
        }

        // Sort by submitted_at descending
        usort($submissions, fn($a, $b) => 
            strtotime($b['submitted_at']) - strtotime($a['submitted_at'])
        );

        return response()->json([
            'submissions' => $submissions,
            'total' => count($submissions),
        ]);
    }

    /**
     * Get single submission details
     * GET /api/graduation-portals/{portal}/submissions/{submissionId}
     */
    public function show(Request $request, GraduationPortal $portal, string $submissionId): JsonResponse
    {
        $this->authorizeAccess($request->user(), $portal);

        $submission = Cache::get("graduation_submission:{$submissionId}");

        if (!$submission || $submission['portal_id'] !== $portal->id) {
            return response()->json([
                'error' => 'Submission not found or expired',
                'code' => 'SUBMISSION_NOT_FOUND'
            ], 404);
        }

        // Add time remaining
        $expiresAt = \Carbon\Carbon::parse($submission['expires_at']);
        $submission['time_remaining_minutes'] = max(0, now()->diffInMinutes($expiresAt, false));

        return response()->json([
            'submission' => $submission,
        ]);
    }

    /**
     * Validate a submission against curriculum
     * POST /api/graduation-portals/{portal}/submissions/{submissionId}/validate
     */
    public function validate(Request $request, GraduationPortal $portal, string $submissionId): JsonResponse
    {
        $this->authorizeAccess($request->user(), $portal);

        $submission = Cache::get("graduation_submission:{$submissionId}");

        if (!$submission || $submission['portal_id'] !== $portal->id) {
            return response()->json([
                'error' => 'Submission not found or expired',
                'code' => 'SUBMISSION_NOT_FOUND'
            ], 404);
        }

        // Run validation
        $validationResult = $this->validationService->validate(
            $submission['courses'],
            $submission['curriculum_id']
        );

        // Update submission with validation result
        $submission['validated'] = true;
        $submission['validated_at'] = now()->toISOString();
        $submission['validated_by'] = $request->user()->id;
        $submission['validation_result'] = $validationResult;

        // Re-cache with remaining TTL
        $expiresAt = \Carbon\Carbon::parse($submission['expires_at']);
        $remainingMinutes = max(1, now()->diffInMinutes($expiresAt, false));
        Cache::put("graduation_submission:{$submissionId}", $submission, now()->addMinutes($remainingMinutes));

        // Broadcast validation complete
        event(new SubmissionValidated($portal, $submissionId, $validationResult));

        return response()->json([
            'submission_id' => $submissionId,
            'validation_result' => $validationResult,
            'message' => 'Validation completed'
        ]);
    }

    /**
     * Batch validate multiple submissions
     * POST /api/graduation-submissions/batch-validate
     */
    public function batchValidate(Request $request): JsonResponse
    {
        $request->validate([
            'submission_ids' => 'required|array|max:50',
            'submission_ids.*' => 'required|uuid',
        ]);

        $results = [];

        foreach ($request->submission_ids as $submissionId) {
            $submission = Cache::get("graduation_submission:{$submissionId}");

            if (!$submission) {
                $results[$submissionId] = [
                    'success' => false,
                    'error' => 'Submission not found or expired'
                ];
                continue;
            }

            // Authorize access
            $portal = GraduationPortal::find($submission['portal_id']);
            if (!$portal || $request->user()->department_id !== $portal->department_id) {
                $results[$submissionId] = [
                    'success' => false,
                    'error' => 'Access denied'
                ];
                continue;
            }

            // Validate
            $validationResult = $this->validationService->validate(
                $submission['courses'],
                $submission['curriculum_id']
            );

            // Update cache
            $submission['validated'] = true;
            $submission['validated_at'] = now()->toISOString();
            $submission['validated_by'] = $request->user()->id;
            $submission['validation_result'] = $validationResult;

            $expiresAt = \Carbon\Carbon::parse($submission['expires_at']);
            $remainingMinutes = max(1, now()->diffInMinutes($expiresAt, false));
            Cache::put("graduation_submission:{$submissionId}", $submission, now()->addMinutes($remainingMinutes));

            $results[$submissionId] = [
                'success' => true,
                'can_graduate' => $validationResult['can_graduate'] ?? false,
                'total_credits' => $validationResult['total_credits'] ?? 0,
            ];
        }

        return response()->json([
            'results' => $results,
            'processed' => count($results),
        ]);
    }

    /**
     * Approve a submission (mark as graduation-ready)
     * POST /api/graduation-portals/{portal}/submissions/{submissionId}/approve
     */
    public function approve(Request $request, GraduationPortal $portal, string $submissionId): JsonResponse
    {
        $this->authorizeAccess($request->user(), $portal);

        $submission = Cache::get("graduation_submission:{$submissionId}");

        if (!$submission || $submission['portal_id'] !== $portal->id) {
            return response()->json(['error' => 'Submission not found'], 404);
        }

        $submission['status'] = 'approved';
        $submission['approved_at'] = now()->toISOString();
        $submission['approved_by'] = $request->user()->id;
        $submission['approval_note'] = $request->input('note');

        // Re-cache
        $expiresAt = \Carbon\Carbon::parse($submission['expires_at']);
        $remainingMinutes = max(1, now()->diffInMinutes($expiresAt, false));
        Cache::put("graduation_submission:{$submissionId}", $submission, now()->addMinutes($remainingMinutes));

        GraduationPortalLog::log($portal->id, 'submission_approved', $request->user()->id, [
            'submission_id' => $submissionId,
            'student_identifier' => $submission['student_identifier'],
        ]);

        return response()->json([
            'message' => 'Submission approved',
            'submission' => $submission,
        ]);
    }

    /**
     * Reject a submission
     * POST /api/graduation-portals/{portal}/submissions/{submissionId}/reject
     */
    public function reject(Request $request, GraduationPortal $portal, string $submissionId): JsonResponse
    {
        $this->authorizeAccess($request->user(), $portal);

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $submission = Cache::get("graduation_submission:{$submissionId}");

        if (!$submission || $submission['portal_id'] !== $portal->id) {
            return response()->json(['error' => 'Submission not found'], 404);
        }

        $submission['status'] = 'rejected';
        $submission['rejected_at'] = now()->toISOString();
        $submission['rejected_by'] = $request->user()->id;
        $submission['rejection_reason'] = $request->reason;

        // Re-cache
        $expiresAt = \Carbon\Carbon::parse($submission['expires_at']);
        $remainingMinutes = max(1, now()->diffInMinutes($expiresAt, false));
        Cache::put("graduation_submission:{$submissionId}", $submission, now()->addMinutes($remainingMinutes));

        GraduationPortalLog::log($portal->id, 'submission_rejected', $request->user()->id, [
            'submission_id' => $submissionId,
            'reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Submission rejected',
            'submission' => $submission,
        ]);
    }

    /**
     * Download validation report as PDF
     * GET /api/graduation-portals/{portal}/submissions/{submissionId}/report
     */
    public function downloadReport(Request $request, GraduationPortal $portal, string $submissionId): JsonResponse
    {
        $this->authorizeAccess($request->user(), $portal);

        $submission = Cache::get("graduation_submission:{$submissionId}");

        if (!$submission || $submission['portal_id'] !== $portal->id) {
            return response()->json(['error' => 'Submission not found'], 404);
        }

        if (!$submission['validated']) {
            return response()->json(['error' => 'Submission has not been validated yet'], 400);
        }

        // Generate PDF report (you can use packages like barryvdh/laravel-dompdf)
        // For now, return the data as JSON for the frontend to render
        return response()->json([
            'report' => [
                'student_identifier' => $submission['student_identifier'],
                'curriculum' => $portal->curriculum->name,
                'submitted_at' => $submission['submitted_at'],
                'validated_at' => $submission['validated_at'] ?? null,
                'validation_result' => $submission['validation_result'],
                'courses' => $submission['courses'],
            ]
        ]);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private function authorizeAccess($user, GraduationPortal $portal): void
    {
        if ($user->role === 'admin') {
            return;
        }

        if (!in_array($user->role, ['chairperson', 'advisor'])) {
            abort(403, 'Unauthorized');
        }

        if ($user->department_id !== $portal->department_id) {
            abort(403, 'You can only access submissions in your department');
        }
    }

    private function sanitizeIdentifier(string $identifier): string
    {
        return \Illuminate\Support\Str::limit(
            strip_tags(trim($identifier)),
            100
        );
    }

    private function sanitizeCourses(array $courses): array
    {
        return collect($courses)->map(function ($course) {
            return [
                'code' => strtoupper(preg_replace('/[^A-Za-z0-9 ]/', '', $course['code'] ?? '')),
                'name' => \Illuminate\Support\Str::limit(strip_tags($course['name'] ?? ''), 100),
                'credits' => min(max((int) ($course['credits'] ?? 3), 0), 12),
                'grade' => strtoupper(preg_replace('/[^A-Za-z0-9+-]/', '', $course['grade'] ?? '')),
                'status' => in_array($course['status'] ?? '', ['completed', 'in_progress', 'planned', 'failed', 'withdrawn'])
                    ? $course['status']
                    : 'completed',
                'category' => \Illuminate\Support\Str::limit(strip_tags($course['category'] ?? ''), 50),
                'semester' => \Illuminate\Support\Str::limit(strip_tags($course['semester'] ?? ''), 20),
            ];
        })->toArray();
    }
}
```

---

## 6. Services

### 6.1 GraduationValidationService

This is the core service that validates student courses against curriculum requirements. It mirrors the logic from the frontend's `courseValidation.ts`.

```php
<?php
// app/Services/GraduationValidationService.php

namespace App\Services;

use App\Models\Curriculum;
use App\Models\Course;
use App\Models\CurriculumCourse;
use App\Models\CurriculumConstraint;
use App\Models\ElectiveRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GraduationValidationService
{
    /**
     * Main validation entry point
     */
    public function validate(array $courses, string $curriculumId): array
    {
        $curriculum = Curriculum::with([
            'curriculumConstraints',
            'electiveRules',
            'curriculumCourses.course',
        ])->findOrFail($curriculumId);

        $parsedCourses = collect($courses);
        $completedCourses = $parsedCourses->where('status', 'completed');
        $inProgressCourses = $parsedCourses->where('status', 'in_progress');
        $plannedCourses = $parsedCourses->where('status', 'planned');

        // Calculate credits
        $totalCreditsCompleted = $completedCourses->sum('credits');
        $totalCreditsInProgress = $inProgressCourses->sum('credits');
        $totalCreditsPlanned = $plannedCourses->sum('credits');
        $totalCreditsRequired = $curriculum->totalCredits ?? 120;

        // Run validation checks
        $errors = [];
        $warnings = [];

        // 1. Validate courses exist in curriculum
        $courseMatching = $this->matchCoursesToCurriculum($parsedCourses, $curriculum);
        $warnings = array_merge($warnings, $courseMatching['warnings']);

        // 2. Validate constraints (category requirements)
        $constraintValidation = $this->validateConstraints($completedCourses, $curriculum->curriculumConstraints);
        $errors = array_merge($errors, $constraintValidation['errors']);
        $warnings = array_merge($warnings, $constraintValidation['warnings']);

        // 3. Validate elective rules
        $electiveValidation = $this->validateElectiveRules($completedCourses, $curriculum->electiveRules);
        $errors = array_merge($errors, $electiveValidation['errors']);
        $warnings = array_merge($warnings, $electiveValidation['warnings']);

        // 4. Validate blacklists
        $blacklistValidation = $this->validateBlacklists($completedCourses, $curriculumId);
        $errors = array_merge($errors, $blacklistValidation['errors']);

        // 5. Calculate category progress
        $categoryProgress = $this->calculateCategoryProgress($parsedCourses, $curriculum);

        // 6. Calculate GPA
        $gpa = $this->calculateGPA($completedCourses);

        // 7. Determine graduation eligibility
        $graduationRequirements = $this->evaluateGraduationRequirements(
            $totalCreditsCompleted,
            $totalCreditsRequired,
            $categoryProgress,
            $gpa,
            $errors
        );

        $canGraduate = collect($graduationRequirements)->every(fn($req) => $req['satisfied']);

        return [
            'can_graduate' => $canGraduate,
            'total_credits_required' => $totalCreditsRequired,
            'total_credits_completed' => $totalCreditsCompleted,
            'total_credits_in_progress' => $totalCreditsInProgress,
            'total_credits_planned' => $totalCreditsPlanned,
            'gpa' => round($gpa, 2),
            'category_progress' => $categoryProgress,
            'graduation_requirements' => $graduationRequirements,
            'errors' => $errors,
            'warnings' => $warnings,
            'course_matching' => $courseMatching['matched_courses'],
        ];
    }

    /**
     * Match submitted courses to curriculum courses
     */
    private function matchCoursesToCurriculum(Collection $courses, Curriculum $curriculum): array
    {
        $warnings = [];
        $matchedCourses = [];

        $curriculumCourseCodes = $curriculum->curriculumCourses
            ->pluck('course.code')
            ->map(fn($code) => strtoupper(trim($code)))
            ->toArray();

        foreach ($courses as $course) {
            $code = strtoupper(trim($course['code']));
            $matched = in_array($code, $curriculumCourseCodes);

            if (!$matched) {
                // Check if it's a valid course at all
                $existsInSystem = Course::where('code', $code)->exists();
                
                if ($existsInSystem) {
                    $warnings[] = "Course {$code} exists but is not in this curriculum (may count as elective)";
                } else {
                    $warnings[] = "Course {$code} not found in system";
                }
            }

            $matchedCourses[] = [
                'code' => $code,
                'matched' => $matched,
                'status' => $course['status'],
            ];
        }

        return [
            'warnings' => $warnings,
            'matched_courses' => $matchedCourses,
        ];
    }

    /**
     * Validate against curriculum constraints (category requirements)
     */
    private function validateConstraints(Collection $completedCourses, $constraints): array
    {
        $errors = [];
        $warnings = [];

        foreach ($constraints as $constraint) {
            $categoryName = $constraint->courseType ?? 'General';
            $requiredCredits = $constraint->minCredits ?? 0;
            $constraintCourses = $constraint->courses ?? [];

            // Find completed courses that match this constraint
            $matchingCourses = $completedCourses->filter(function ($course) use ($constraintCourses, $categoryName) {
                $courseCode = strtoupper(trim($course['code']));
                $courseCategory = strtoupper(trim($course['category'] ?? ''));
                
                return in_array($courseCode, array_map('strtoupper', $constraintCourses))
                    || $courseCategory === strtoupper($categoryName);
            });

            $completedCredits = $matchingCourses->sum('credits');

            if ($completedCredits < $requiredCredits) {
                $deficit = $requiredCredits - $completedCredits;
                $errors[] = "Insufficient credits in {$categoryName}: {$completedCredits}/{$requiredCredits} (need {$deficit} more)";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Validate elective rules
     */
    private function validateElectiveRules(Collection $completedCourses, $electiveRules): array
    {
        $errors = [];
        $warnings = [];

        foreach ($electiveRules as $rule) {
            if (!$rule->requiredCourses || !$rule->courseList) {
                continue;
            }

            $courseList = is_array($rule->courseList) ? $rule->courseList : json_decode($rule->courseList, true);
            
            $takenFromRule = $completedCourses->filter(function ($course) use ($courseList) {
                return in_array(strtoupper(trim($course['code'])), array_map('strtoupper', $courseList ?? []));
            })->count();

            if ($takenFromRule < $rule->requiredCourses) {
                $warnings[] = "Elective rule not satisfied: {$takenFromRule}/{$rule->requiredCourses} courses from {$rule->description}";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Validate against blacklisted course combinations
     */
    private function validateBlacklists(Collection $completedCourses, string $curriculumId): array
    {
        $errors = [];

        // Fetch blacklists for this curriculum
        $blacklists = DB::table('curriculum_blacklists')
            ->where('curriculum_id', $curriculumId)
            ->get();

        $completedCodes = $completedCourses->pluck('code')
            ->map(fn($code) => strtoupper(trim($code)))
            ->toArray();

        foreach ($blacklists as $blacklist) {
            $blacklistCourses = is_array($blacklist->courses) 
                ? $blacklist->courses 
                : json_decode($blacklist->courses, true);

            if (!$blacklistCourses || count($blacklistCourses) < 2) {
                continue;
            }

            $takenFromBlacklist = array_filter($blacklistCourses, fn($code) => 
                in_array(strtoupper($code), $completedCodes)
            );

            if (count($takenFromBlacklist) > 1) {
                $reason = $blacklist->reason ?? 'Conflicting courses';
                $errors[] = "Blacklist violation: Cannot take both " . implode(' and ', $takenFromBlacklist) . " - {$reason}";
            }
        }

        return ['errors' => $errors];
    }

    /**
     * Calculate progress by category
     */
    private function calculateCategoryProgress(Collection $courses, Curriculum $curriculum): array
    {
        $progress = [];
        $completedCourses = $courses->where('status', 'completed');
        $inProgressCourses = $courses->where('status', 'in_progress');

        foreach ($curriculum->curriculumConstraints as $constraint) {
            $categoryName = $constraint->courseType ?? 'General';
            $requiredCredits = $constraint->minCredits ?? 0;
            $constraintCourses = $constraint->courses ?? [];

            $matchCompleted = $completedCourses->filter(function ($course) use ($constraintCourses, $categoryName) {
                return in_array(strtoupper(trim($course['code'])), array_map('strtoupper', $constraintCourses))
                    || strtoupper(trim($course['category'] ?? '')) === strtoupper($categoryName);
            });

            $matchInProgress = $inProgressCourses->filter(function ($course) use ($constraintCourses, $categoryName) {
                return in_array(strtoupper(trim($course['code'])), array_map('strtoupper', $constraintCourses))
                    || strtoupper(trim($course['category'] ?? '')) === strtoupper($categoryName);
            });

            $completed = $matchCompleted->sum('credits');
            $inProgress = $matchInProgress->sum('credits');

            $progress[$categoryName] = [
                'required' => $requiredCredits,
                'completed' => $completed,
                'in_progress' => $inProgress,
                'remaining' => max(0, $requiredCredits - $completed - $inProgress),
                'percentage' => $requiredCredits > 0 ? round(($completed / $requiredCredits) * 100, 1) : 100,
                'courses' => $matchCompleted->pluck('code')->toArray(),
            ];
        }

        return $progress;
    }

    /**
     * Calculate GPA from completed courses
     */
    private function calculateGPA(Collection $courses): float
    {
        $gradePoints = [
            'A+' => 4.0, 'A' => 4.0, 'A-' => 3.7,
            'B+' => 3.3, 'B' => 3.0, 'B-' => 2.7,
            'C+' => 2.3, 'C' => 2.0, 'C-' => 1.7,
            'D+' => 1.3, 'D' => 1.0, 'D-' => 0.7,
            'F' => 0.0,
        ];

        $totalPoints = 0;
        $totalCredits = 0;

        foreach ($courses as $course) {
            $grade = strtoupper(trim($course['grade'] ?? ''));
            
            if (isset($gradePoints[$grade])) {
                $credits = (float) ($course['credits'] ?? 0);
                $totalPoints += $gradePoints[$grade] * $credits;
                $totalCredits += $credits;
            }
        }

        return $totalCredits > 0 ? $totalPoints / $totalCredits : 0;
    }

    /**
     * Evaluate graduation requirements
     */
    private function evaluateGraduationRequirements(
        float $creditsCompleted,
        float $creditsRequired,
        array $categoryProgress,
        float $gpa,
        array $errors
    ): array {
        $requirements = [
            [
                'name' => 'Minimum Credit Hours',
                'satisfied' => $creditsCompleted >= $creditsRequired,
                'details' => "{$creditsCompleted}/{$creditsRequired} credits completed",
            ],
            [
                'name' => 'Core Course Requirements',
                'satisfied' => ($categoryProgress['Core']['remaining'] ?? 0) === 0,
                'details' => ($categoryProgress['Core']['completed'] ?? 0) . "/" . ($categoryProgress['Core']['required'] ?? 0) . " core credits",
            ],
            [
                'name' => 'GPA Requirement (Min 2.0)',
                'satisfied' => $gpa >= 2.0,
                'details' => "Current GPA: " . number_format($gpa, 2),
            ],
            [
                'name' => 'No Blacklist Violations',
                'satisfied' => count(array_filter($errors, fn($e) => str_contains($e, 'Blacklist'))) === 0,
                'details' => 'No conflicting course combinations',
            ],
        ];

        // Check all category requirements
        foreach ($categoryProgress as $category => $progress) {
            if ($progress['remaining'] > 0 && $category !== 'Core') {
                $requirements[] = [
                    'name' => "{$category} Requirements",
                    'satisfied' => false,
                    'details' => "{$progress['completed']}/{$progress['required']} credits (need {$progress['remaining']} more)",
                ];
            }
        }

        return $requirements;
    }
}
```

---

## 7. Cache Configuration

### 7.1 Config File

```php
<?php
// config/graduation.php

return [
    /*
    |--------------------------------------------------------------------------
    | Session TTL (Time To Live)
    |--------------------------------------------------------------------------
    | How long a student's session token is valid after PIN verification.
    | In minutes.
    */
    'session_ttl_minutes' => env('GRADUATION_SESSION_TTL', 15),

    /*
    |--------------------------------------------------------------------------
    | Submission TTL
    |--------------------------------------------------------------------------
    | How long submission data is kept in cache before automatic deletion.
    | This is for PDPA compliance - data must not persist permanently.
    | In minutes.
    */
    'submission_ttl_minutes' => env('GRADUATION_SUBMISSION_TTL', 30),

    /*
    |--------------------------------------------------------------------------
    | IP Validation
    |--------------------------------------------------------------------------
    | Whether to validate that requests come from the same IP as session creation.
    | Disable for development or if students use VPNs.
    */
    'validate_ip' => env('GRADUATION_VALIDATE_IP', true),

    /*
    |--------------------------------------------------------------------------
    | Max File Size
    |--------------------------------------------------------------------------
    | Maximum file size in MB that students can upload.
    */
    'max_file_size_mb' => env('GRADUATION_MAX_FILE_SIZE', 5),

    /*
    |--------------------------------------------------------------------------
    | Cache Store
    |--------------------------------------------------------------------------
    | Which cache store to use for graduation data.
    | Recommended: redis for production, file for development.
    */
    'cache_store' => env('GRADUATION_CACHE_STORE', 'redis'),
];
```

### 7.2 Add to .env

```env
# Graduation Portal Configuration
GRADUATION_SESSION_TTL=15
GRADUATION_SUBMISSION_TTL=30
GRADUATION_VALIDATE_IP=true
GRADUATION_MAX_FILE_SIZE=5
GRADUATION_CACHE_STORE=redis
```

### 7.3 Redis Configuration (if using Redis)

```php
// config/database.php - add to 'redis' connections array

'graduation' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_GRADUATION_DB', '2'), // Use separate DB
],
```

---

## 8. WebSocket/Broadcasting

### 8.1 Event Classes

```php
<?php
// app/Events/NewGraduationSubmission.php

namespace App\Events;

use App\Models\GraduationPortal;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewGraduationSubmission implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GraduationPortal $portal,
        public string $submissionId,
        public array $submissionData
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("graduation-portal.{$this->portal->id}"),
            new PrivateChannel("department.{$this->portal->department_id}.graduation"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'submission.new';
    }

    public function broadcastWith(): array
    {
        return [
            'submission_id' => $this->submissionId,
            'portal_id' => $this->portal->id,
            'portal_name' => $this->portal->name,
            'student_identifier' => $this->submissionData['student_identifier'],
            'course_count' => count($this->submissionData['courses']),
            'submitted_at' => $this->submissionData['submitted_at'],
            'expires_at' => $this->submissionData['expires_at'],
        ];
    }
}
```

```php
<?php
// app/Events/SubmissionValidated.php

namespace App\Events;

use App\Models\GraduationPortal;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubmissionValidated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GraduationPortal $portal,
        public string $submissionId,
        public array $validationResult
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("graduation-portal.{$this->portal->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'submission.validated';
    }

    public function broadcastWith(): array
    {
        return [
            'submission_id' => $this->submissionId,
            'can_graduate' => $this->validationResult['can_graduate'] ?? false,
            'total_credits' => $this->validationResult['total_credits_completed'] ?? 0,
            'gpa' => $this->validationResult['gpa'] ?? 0,
            'errors_count' => count($this->validationResult['errors'] ?? []),
            'warnings_count' => count($this->validationResult['warnings'] ?? []),
        ];
    }
}
```

### 8.2 Channel Authorization

```php
<?php
// routes/channels.php

use App\Models\GraduationPortal;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('graduation-portal.{portalId}', function ($user, $portalId) {
    $portal = GraduationPortal::find($portalId);
    
    if (!$portal) {
        return false;
    }

    // Admin can access all
    if ($user->role === 'admin') {
        return true;
    }

    // CP/Advisor in same department
    if (in_array($user->role, ['chairperson', 'advisor'])) {
        return $user->department_id === $portal->department_id;
    }

    return false;
});

Broadcast::channel('department.{departmentId}.graduation', function ($user, $departmentId) {
    if ($user->role === 'admin') {
        return true;
    }

    return in_array($user->role, ['chairperson', 'advisor']) 
        && $user->department_id === $departmentId;
});
```

---

## 9. Request Validation

### 9.1 StoreGraduationPortalRequest

```php
<?php
// app/Http/Requests/StoreGraduationPortalRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGraduationPortalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['chairperson', 'admin']);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'curriculum_id' => 'required|uuid|exists:curricula,id',
            'batch' => 'nullable|string|max:50',
            'deadline' => 'nullable|date|after:now',
            'accepted_formats' => 'nullable|array',
            'accepted_formats.*' => 'string|in:xlsx,xls,csv',
            'max_file_size_mb' => 'nullable|integer|min:1|max:20',
            'custom_pin' => 'nullable|string|min:4|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'curriculum_id.exists' => 'The selected curriculum does not exist.',
            'deadline.after' => 'The deadline must be a future date.',
        ];
    }
}
```

### 9.2 StoreGraduationSubmissionRequest

```php
<?php
// app/Http/Requests/StoreGraduationSubmissionRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGraduationSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'student_identifier' => 'required|string|max:100',
            'curriculum_id' => 'nullable|uuid|exists:curricula,id',
            'courses' => 'required|array|min:1|max:200',
            'courses.*.code' => 'required|string|max:20',
            'courses.*.name' => 'nullable|string|max:100',
            'courses.*.credits' => 'required|numeric|min:0|max:12',
            'courses.*.grade' => 'required|string|max:10',
            'courses.*.status' => 'required|in:completed,in_progress,planned,failed,withdrawn',
            'courses.*.category' => 'nullable|string|max:50',
            'courses.*.semester' => 'nullable|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'courses.required' => 'At least one course must be submitted.',
            'courses.max' => 'Maximum 200 courses can be submitted at once.',
            'courses.*.code.required' => 'Each course must have a code.',
            'courses.*.credits.required' => 'Each course must have credits.',
            'courses.*.grade.required' => 'Each course must have a grade.',
            'courses.*.status.in' => 'Course status must be: completed, in_progress, planned, failed, or withdrawn.',
        ];
    }
}
```

---

## 10. File Format Specification

### 10.1 Expected CSV/Excel Format from Frontend

The frontend parses the student's exported file and sends JSON. Here's the expected format based on the existing export functionality:

**CSV Structure (grouped by category):**
```csv
"Core Courses (30 Credits)"
"Active Credits","24"
"Course Title","Course Code","Credits","Grade","Status","Semester"
"Introduction to Computing","CS 101","3","A","Completed","1/2023"
"Data Structures","CS 201","3","B+","Completed","2/2023"
...

"Major Electives (12 Credits)"
"Active Credits","9"
"Course Title","Course Code","Credits","Grade","Status","Semester"
...
```

### 10.2 JSON Payload Format (sent to backend)

```json
{
  "student_identifier": "John Doe - 6512345",
  "curriculum_id": "uuid-of-selected-curriculum",
  "courses": [
    {
      "code": "CS 101",
      "name": "Introduction to Computing",
      "credits": 3,
      "grade": "A",
      "status": "completed",
      "category": "Core Courses",
      "semester": "1/2023"
    },
    {
      "code": "CS 201",
      "name": "Data Structures",
      "credits": 3,
      "grade": "B+",
      "status": "completed",
      "category": "Core Courses",
      "semester": "2/2023"
    },
    {
      "code": "CS 401",
      "name": "Senior Project I",
      "credits": 3,
      "grade": "IP",
      "status": "in_progress",
      "category": "Core Courses",
      "semester": "1/2025"
    }
  ]
}
```

### 10.3 Status Mapping

| Raw Value | Mapped Status |
|-----------|---------------|
| A, B, C, D (letter grades) | `completed` |
| S, PASS | `completed` |
| F, FAIL | `failed` |
| W, WITHDRAWN, DROPPED | `withdrawn` |
| IP, IN_PROGRESS, TAKING, CURRENT | `in_progress` |
| P, PLANNED, FUTURE, - | `planned` |

---

## 11. Testing

### 11.1 Feature Tests

```php
<?php
// tests/Feature/GraduationPortalTest.php

namespace Tests\Feature;

use App\Models\Curriculum;
use App\Models\Department;
use App\Models\GraduationPortal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class GraduationPortalTest extends TestCase
{
    use RefreshDatabase;

    private User $chairperson;
    private Department $department;
    private Curriculum $curriculum;

    protected function setUp(): void
    {
        parent::setUp();

        $this->department = Department::factory()->create();
        $this->curriculum = Curriculum::factory()->create([
            'department_id' => $this->department->id,
        ]);
        $this->chairperson = User::factory()->create([
            'role' => 'chairperson',
            'department_id' => $this->department->id,
        ]);
    }

    public function test_chairperson_can_create_portal(): void
    {
        $response = $this->actingAs($this->chairperson)
            ->postJson('/api/graduation-portals', [
                'name' => 'Graduation Check 2025',
                'description' => 'Submit your progress for graduation review',
                'curriculum_id' => $this->curriculum->id,
                'deadline' => now()->addDays(30)->toDateTimeString(),
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'portal' => ['id', 'name', 'pin_hint'],
                'pin',
                'message',
            ]);

        $this->assertDatabaseHas('graduation_portals', [
            'name' => 'Graduation Check 2025',
            'created_by' => $this->chairperson->id,
        ]);
    }

    public function test_student_can_verify_pin(): void
    {
        $portal = GraduationPortal::factory()->create([
            'department_id' => $this->department->id,
            'curriculum_id' => $this->curriculum->id,
            'created_by' => $this->chairperson->id,
        ]);
        
        $rawPin = $portal->setPin('TEST123');
        $portal->save();

        $response = $this->postJson("/api/graduation-portals/{$portal->id}/verify-pin", [
            'pin' => 'TEST123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'session_token',
                'expires_in',
                'curriculum',
            ]);
    }

    public function test_invalid_pin_is_rejected(): void
    {
        $portal = GraduationPortal::factory()->create([
            'department_id' => $this->department->id,
            'curriculum_id' => $this->curriculum->id,
            'created_by' => $this->chairperson->id,
        ]);
        
        $portal->setPin('CORRECT123');
        $portal->save();

        $response = $this->postJson("/api/graduation-portals/{$portal->id}/verify-pin", [
            'pin' => 'WRONG',
        ]);

        $response->assertStatus(401)
            ->assertJson(['code' => 'INVALID_PIN']);
    }

    public function test_submission_is_stored_in_cache(): void
    {
        $portal = GraduationPortal::factory()->create([
            'department_id' => $this->department->id,
            'curriculum_id' => $this->curriculum->id,
            'created_by' => $this->chairperson->id,
        ]);

        // Create session
        $sessionToken = 'test-session-token';
        Cache::put("graduation_session:{$sessionToken}", [
            'portal_id' => $portal->id,
            'curriculum_id' => $portal->curriculum_id,
            'ip' => '127.0.0.1',
            'created_at' => now()->toISOString(),
        ], now()->addMinutes(15));

        $response = $this->postJson("/api/graduation-portals/{$portal->id}/submit", [
            'student_identifier' => 'Test Student',
            'courses' => [
                ['code' => 'CS101', 'credits' => 3, 'grade' => 'A', 'status' => 'completed'],
                ['code' => 'CS201', 'credits' => 3, 'grade' => 'B', 'status' => 'completed'],
            ],
        ], [
            'X-Graduation-Session-Token' => $sessionToken,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'submission_id',
                'message',
                'expires_at',
            ]);

        // Verify submission is in cache
        $submissionId = $response->json('submission_id');
        $submission = Cache::get("graduation_submission:{$submissionId}");
        
        $this->assertNotNull($submission);
        $this->assertEquals('Test Student', $submission['student_identifier']);
        $this->assertCount(2, $submission['courses']);
    }

    public function test_submission_auto_expires(): void
    {
        // This would be tested with a shorter TTL in test environment
        $this->markTestIncomplete('Implement with time-travel testing');
    }
}
```

---

## Summary

This backend implementation plan provides:

1. **Database Migrations** - Only stores portal metadata, not student data (PDPA compliant)
2. **Models** - GraduationPortal with PIN handling and status management
3. **API Routes** - Complete route structure for public, session-authenticated, and user-authenticated endpoints
4. **Controllers** - Full implementation of portal CRUD and submission handling
5. **Validation Service** - Port of frontend validation logic to PHP
6. **Cache Configuration** - Redis/Cache setup with TTL for temporary data
7. **WebSocket Events** - Real-time notifications for CP/Advisor dashboard
8. **Request Validation** - Form request classes for input validation
9. **File Format Spec** - Expected JSON payload format from frontend
10. **Tests** - Feature tests for main functionality

### Implementation Order

1. Run migrations
2. Create models
3. Create config file
4. Register middleware
5. Add routes
6. Create request classes
7. Create GraduationValidationService
8. Create controllers
9. Set up broadcasting events
10. Write and run tests

---

*Document Version: 1.0*  
*Created: January 2025*  
*For: Laravel Backend Repository*
