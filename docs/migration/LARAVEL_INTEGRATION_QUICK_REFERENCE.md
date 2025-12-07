# 🚀 Quick Reference: Laravel + Next.js Integration

## ⚙️ Setup Checklist

- [x] Environment variables in `.env`
- [x] Laravel CORS configured
- [x] Laravel Sanctum configured
- [ ] Test Laravel API endpoints
- [ ] Test authentication flow

## 📦 Files Created

1. **`src/lib/api/laravel.ts`** - Main API integration (all endpoints)
2. **`src/lib/api/examples.ts`** - Usage examples
3. **`src/lib/auth/AuthContext.tsx`** - React authentication context
4. **`src/app/auth/login-laravel-example.tsx`** - Login page example
5. **`docs/LARAVEL_NEXTJS_INTEGRATION.md`** - Full documentation

## 🔑 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

## 📞 Common API Calls

### Authentication
```typescript
import { login, logout, getUser } from '@/lib/api/laravel';

await login({ email: 'user@example.com', password: 'password' });
await logout();
const user = await getUser();
```

### Public Data
```typescript
import { getPublicFaculties } from '@/lib/api/laravel';

const faculties = await getPublicFaculties();
```

### Protected Data
```typescript
import { getDashboardStats, getFaculties } from '@/lib/api/laravel';

const stats = await getDashboardStats();
const faculties = await getFaculties();
```

### CRUD Operations
```typescript
import { createFaculty, updateFaculty, deleteFaculty } from '@/lib/api/laravel';

const newFaculty = await createFaculty({ name: 'Engineering' });
await updateFaculty(1, { name: 'Updated Name' });
await deleteFaculty(1);
```

## 🎯 Quick Start Examples

### Example 1: Fetch and Display Data
```tsx
'use client';
import { useState, useEffect } from 'react';
import { getFaculties } from '@/lib/api/laravel';

export default function Page() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    getFaculties().then(setData);
  }, []);
  
  return <div>{data.map(item => <div key={item.id}>{item.name}</div>)}</div>;
}
```

### Example 2: Form Submission
```tsx
'use client';
import { useState } from 'react';
import { createFaculty } from '@/lib/api/laravel';

export default function Form() {
  const [name, setName] = useState('');
  
  const submit = async (e) => {
    e.preventDefault();
    await createFaculty({ name });
    alert('Created!');
  };
  
  return (
    <form onSubmit={submit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button>Submit</button>
    </form>
  );
}
```

### Example 3: Using Auth Context
```tsx
'use client';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🧪 Testing Commands

```bash
# Test public endpoint
curl http://localhost:8000/api/public-faculties

# Test login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt

# Test authenticated endpoint
curl http://localhost:8000/api/user -b cookies.txt
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Check `config/cors.php` - ensure `supports_credentials: true` |
| 419 CSRF error | Use `credentials: 'include'` in fetch |
| Auth not persisting | Check Sanctum stateful domains configuration |
| Can't connect to API | Verify `NEXT_PUBLIC_API_URL` in `.env` |

## 📚 All Available Functions

### Auth
- `login({ email, password })`
- `logout()`
- `getUser()`

### Public
- `getPublicFaculties()`
- `getPublicDepartments()`
- `getPublicCurricula()`
- `getPublicCurriculum(id)`
- `getPublicConcentrations()`

### Protected
- `getDashboardStats()`
- `getFaculties()`, `createFaculty(data)`, `updateFaculty(id, data)`, `deleteFaculty(id)`
- `getDepartments()`, `createDepartment(data)`, `updateDepartment(id, data)`, `deleteDepartment(id)`
- `getUsers()`, `getUserById(id)`, `createUser(data)`, `updateUser(id, data)`, `deleteUser(id)`
- `getCurricula()`, `getCurriculum(id)`, `createCurriculum(data)`, `updateCurriculum(id, data)`, `deleteCurriculum(id)`
- `getCourses()`, `getCourse(id)`, `createCourse(data)`, `updateCourse(id, data)`, `deleteCourse(id)`
- `getCourseTypes()`, `createCourseType(data)`, `updateCourseType(id, data)`, `deleteCourseType(id)`
- `getConcentrationCourses()`, etc.
- `getBlacklists()`, etc.
- `getAvailableCourses()`
- `getCompletedCourses()`
- `getSystemSettings()`
- `downloadSampleXlsx()`, `downloadSampleCsv()`

## 🎨 Integration Pattern

```
Next.js Frontend          Laravel Backend
     ↓                           ↑
User Interaction          API Request
     ↓                           ↑
React Component           Route Handler
     ↓                           ↑
API Function              Controller
     ↓                           ↑
fetch() with cookies      Sanctum Auth
     ↓                           ↑
Response                  JSON Response
```

## 🚀 Next Steps

1. Update your existing components to use Laravel API
2. Test authentication flow thoroughly
3. Implement error handling in your components
4. Add loading states for better UX
5. Deploy both applications

---

**Full Documentation**: See `docs/LARAVEL_NEXTJS_INTEGRATION.md`
