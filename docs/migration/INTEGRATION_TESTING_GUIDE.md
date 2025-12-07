# 🚀 Step-by-Step Integration Testing Guide

## ✅ Prerequisites Checklist

1. **Laravel Backend Running**
   ```bash
   cd /path/to/your/laravel-project
   php artisan serve
   ```
   Should be running on: `http://localhost:8000`

2. **Next.js Frontend Running**
   ```bash
   cd /Users/teyyyyyheng/course-audit
   pnpm run dev
   ```
   Should be running on: `http://localhost:3000`

## 🧪 Test Steps

### Step 1: Test Public Endpoints (No Auth Required)

Visit: **http://localhost:3000/test-api**

**What to expect:**
- ✅ You should see lists of Faculties, Departments, and Curricula
- ✅ Green success message at the bottom
- ❌ If you see an error, check:
  - Is Laravel running on port 8000?
  - Check browser console for CORS errors
  - Verify `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env`

**Browser Test:**
```javascript
// Open browser console on http://localhost:3000/test-api
// Run this:
fetch('http://localhost:8000/api/public-faculties')
  .then(r => r.json())
  .then(console.log)
```

---

### Step 2: Test Authentication

Visit: **http://localhost:3000/login-laravel**

**Test Credentials:**
1. Use credentials from your Laravel database (check `users` table)
2. Common test credentials:
   - Email: `admin@example.com`
   - Password: `password`

**What to expect:**
- ✅ Login form appears
- ✅ Enter credentials and click "Login"
- ✅ Should redirect to appropriate dashboard (admin/chairperson/student)
- ❌ If login fails:
  - Check Laravel logs: `storage/logs/laravel.log`
  - Check browser Network tab for errors
  - Verify CSRF cookie is being set

**Terminal Test (CURL):**
```bash
# Test login endpoint directly
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt -v

# If successful, test authenticated endpoint
curl http://localhost:8000/api/user \
  -b cookies.txt
```

---

### Step 3: Test Protected Endpoints (After Login)

After successful login, open browser console and test:

```javascript
// This should work if you're logged in
fetch('http://localhost:8000/api/dashboard-stats', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)

// Test getting faculties (protected)
fetch('http://localhost:8000/api/faculties', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```

**What to expect:**
- ✅ Returns data (not 401 Unauthorized)
- ❌ If you get 401:
  - Make sure you're logged in
  - Check that cookies are being sent
  - Verify Sanctum configuration

---

### Step 4: Test CRUD Operations

**Option 1: Use the Faculty Management Component**

1. Navigate to your admin dashboard
2. Go to Faculties tab
3. Try creating, editing, and deleting a faculty

**Option 2: Test via Browser Console**

```javascript
// Create a faculty
fetch('http://localhost:8000/api/faculties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name: 'Test Faculty', description: 'Testing' })
})
  .then(r => r.json())
  .then(console.log)

// Update faculty (replace {id} with actual ID)
fetch('http://localhost:8000/api/faculties/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name: 'Updated Faculty' })
})
  .then(r => r.json())
  .then(console.log)

// Delete faculty
fetch('http://localhost:8000/api/faculties/1', {
  method: 'DELETE',
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```

---

## 🔧 Common Issues & Solutions

### Issue 1: CORS Error

**Symptom:**
```
Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Solution:**
Your CORS config looks correct. Verify:
1. Laravel CORS middleware is enabled
2. Restart Laravel server after changing config

### Issue 2: 419 CSRF Token Mismatch

**Symptom:**
```
POST http://localhost:8000/api/login 419 (unknown status)
```

**Solution:**
1. Make sure `credentials: 'include'` is in all fetch calls
2. Clear browser cookies and try again
3. Check Sanctum stateful domains in `.env`:
   ```env
   SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
   ```

### Issue 3: 401 Unauthorized

**Symptom:**
Protected endpoints return 401 even after login

**Solution:**
1. Verify cookies are being sent (check Network tab > Headers > Cookie)
2. Make sure `credentials: 'include'` is used
3. Check session configuration in Laravel

### Issue 4: Session Not Persisting

**Symptom:**
Login works but subsequent requests act as if not logged in

**Solution:**
Check Laravel `.env`:
```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SESSION_SECURE_COOKIE=false  # Set to true only for HTTPS
SESSION_SAME_SITE=lax
```

---

## 📊 Integration Checklist

- [ ] Public endpoints working (test-api page)
- [ ] Login successful (login-laravel page)
- [ ] Dashboard stats loading
- [ ] Faculty CRUD working
- [ ] Department CRUD working
- [ ] User management working
- [ ] Curricula management working
- [ ] Course management working
- [ ] Logout working

---

## 🎯 Quick Verification Commands

**1. Check if Laravel is running:**
```bash
curl http://localhost:8000/api/public-faculties
```

**2. Check CORS headers:**
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/login -v
```

**3. Test complete login flow:**
```bash
# Get CSRF cookie
curl http://localhost:8000/sanctum/csrf-cookie -c cookies.txt -v

# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -b cookies.txt -c cookies.txt -v

# Get user
curl http://localhost:8000/api/user \
  -b cookies.txt
```

---

## 📝 What Files to Use

1. **Test Public API**: Visit `/test-api` page
2. **Test Login**: Visit `/login-laravel` page  
3. **Use in Components**: Import from `@/lib/api/laravel`

Example:
```typescript
import { getFaculties, createFaculty } from '@/lib/api/laravel';

// In your component
const faculties = await getFaculties();
await createFaculty({ name: 'New Faculty' });
```

---

## 🚀 Next Steps After Testing

1. ✅ Replace existing API calls in your components
2. ✅ Add the AuthContext to your layout
3. ✅ Update all management components to use Laravel API
4. ✅ Test all features thoroughly
5. ✅ Deploy both applications

---

**Need Help?**
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Check browser console for JavaScript errors
- Check Network tab for failed requests
- Review `docs/LARAVEL_NEXTJS_INTEGRATION.md` for detailed examples
