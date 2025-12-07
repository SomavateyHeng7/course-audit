# Laravel Backend + Next.js Frontend Integration

This guide explains how to integrate your Laravel backend with your Next.js frontend for the Course Audit System.

## 🚀 Quick Start

### 1. Configure Environment Variables

Update your `.env` file (or `.env.local`):

```env
# Laravel Backend API URL (without /api suffix)
NEXT_PUBLIC_API_URL=http://localhost:8000

# NextAuth Secret
NEXTAUTH_SECRET=8KQzT9#mP2$vL5nX7jR4hF1cB3wE6yA0dG8

# NextAuth URL (your Next.js app URL)
NEXTAUTH_URL=http://localhost:3000
```

### 2. Laravel Backend Setup (CORS & Sanctum)

Make sure your Laravel backend has:

1. **CORS enabled** (`config/cors.php`):
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:3000'],
'supports_credentials' => true,
```

2. **Sanctum configured** (`config/sanctum.php`):
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000')),
```

3. **Session configuration** (`.env`):
```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

## 📁 Project Structure

```
src/
├── lib/
│   └── api/
│       ├── laravel.ts          # Main Laravel API integration
│       └── examples.ts         # Usage examples
├── app/
│   ├── auth/
│   │   ├── page.tsx            # Your existing auth page
│   │   └── login-laravel-example.tsx  # Laravel login example
│   └── admin/
│       └── page.tsx            # Updated to use Laravel API
```

## 🔧 Available API Functions

### Authentication

```typescript
import { login, logout, getUser } from '@/lib/api/laravel';

// Login
const user = await login({ email: 'user@example.com', password: 'password' });

// Logout
await logout();

// Get current user
const currentUser = await getUser();
```

### Public Endpoints (No Auth Required)

```typescript
import { 
  getPublicFaculties,
  getPublicDepartments,
  getPublicCurricula,
  getPublicCurriculum,
  getPublicConcentrations
} from '@/lib/api/laravel';

const faculties = await getPublicFaculties();
const curriculum = await getPublicCurriculum(1);
```

### Protected Endpoints (Auth Required)

```typescript
import { 
  getDashboardStats,
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  // ... and many more
} from '@/lib/api/laravel';

// Get dashboard stats
const stats = await getDashboardStats();

// CRUD operations
const faculties = await getFaculties();
const newFaculty = await createFaculty({ name: 'Engineering' });
await updateFaculty(1, { name: 'Updated Engineering' });
await deleteFaculty(1);
```

### All Available Endpoints

- **Dashboard**: `getDashboardStats()`
- **Faculties**: `getFaculties()`, `createFaculty()`, `updateFaculty()`, `deleteFaculty()`
- **Departments**: `getDepartments()`, `createDepartment()`, `updateDepartment()`, `deleteDepartment()`
- **Users**: `getUsers()`, `getUserById()`, `createUser()`, `updateUser()`, `deleteUser()`
- **Curricula**: `getCurricula()`, `getCurriculum()`, `createCurriculum()`, `updateCurriculum()`, `deleteCurriculum()`
- **Courses**: `getCourses()`, `getCourse()`, `createCourse()`, `updateCourse()`, `deleteCourse()`
- **Course Types**: `getCourseTypes()`, `createCourseType()`, `updateCourseType()`, `deleteCourseType()`
- **Concentration Courses**: `getConcentrationCourses()`, etc.
- **Blacklists**: `getBlacklists()`, etc.
- **Completed Courses**: `getCompletedCourses()`
- **System Settings**: `getSystemSettings()`
- **Downloads**: `downloadSampleXlsx()`, `downloadSampleCsv()`

## 💡 Usage Examples

### Example 1: Simple Component with API Call

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getFaculties } from '@/lib/api/laravel';

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFaculties() {
      try {
        const data = await getFaculties();
        setFaculties(data);
      } catch (error) {
        console.error('Failed to load faculties:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFaculties();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {faculties.map(faculty => (
        <li key={faculty.id}>{faculty.name}</li>
      ))}
    </ul>
  );
}
```

### Example 2: Form with Create Operation

```tsx
'use client';

import { useState } from 'react';
import { createFaculty } from '@/lib/api/laravel';

export default function CreateFacultyForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createFaculty({ name });
      alert('Faculty created!');
      setName('');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Faculty name"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### Example 3: Server Component (Next.js 13+)

```tsx
import { getPublicFaculties } from '@/lib/api/laravel';

export default async function FacultiesPage() {
  const faculties = await getPublicFaculties();

  return (
    <ul>
      {faculties.map(faculty => (
        <li key={faculty.id}>{faculty.name}</li>
      ))}
    </ul>
  );
}
```

### Example 4: Login Page

See the complete example in: `src/app/auth/login-laravel-example.tsx`

```tsx
import { login } from '@/lib/api/laravel';

async function handleLogin(email, password) {
  try {
    const user = await login({ email, password });
    // Redirect based on user role
    if (user.role === 'admin') {
      router.push('/admin');
    }
  } catch (error) {
    setError(error.message);
  }
}
```

## 🔒 Authentication Flow

1. **Login**: Call `login()` with credentials
   - Automatically handles CSRF token
   - Stores session cookie
   
2. **Make authenticated requests**: All protected endpoints automatically send cookies
   
3. **Check auth status**: Call `getUser()` to verify authentication

4. **Logout**: Call `logout()` to end session

## 🛠️ Error Handling

All API functions throw errors on failure. Always wrap in try-catch:

```typescript
try {
  const data = await getFaculties();
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
}
```

## 📝 Testing

### Test Public Endpoints

```bash
curl http://localhost:8000/api/public-faculties
```

### Test Authentication

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt

# Get user (with cookies)
curl http://localhost:8000/api/user \
  -b cookies.txt
```

## 🚨 Common Issues

### Issue 1: CORS Error

**Solution**: Make sure Laravel CORS is configured properly and `supports_credentials` is `true`.

### Issue 2: 419 CSRF Token Mismatch

**Solution**: Ensure `credentials: 'include'` is set in all fetch requests.

### Issue 3: Authentication Not Persisting

**Solution**: Check that:
- Sanctum stateful domains are configured
- Session driver is set to `cookie`
- `credentials: 'include'` is used in requests

## 📚 Additional Resources

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- See `src/lib/api/examples.ts` for more usage examples

## 🎯 Next Steps

1. ✅ Environment variables configured
2. ✅ Laravel API integration file created
3. ✅ Example usage created
4. ✅ Admin dashboard updated to use Laravel API
5. 🔲 Test login functionality
6. 🔲 Update other components to use Laravel API
7. 🔲 Deploy both Laravel and Next.js apps

---

**Need Help?** Check the examples in `src/lib/api/examples.ts` or review the login example in `src/app/auth/login-laravel-example.tsx`.
