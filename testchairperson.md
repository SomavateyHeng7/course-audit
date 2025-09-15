# Chairperson API Testing with Postman

This guide helps you test curriculum access for a chairperson using Postman.

## 1. Get Chairperson Access Token

**Request:**
- Method: `POST`
- URL: `https://course-audit.vercel.app/api/auth/login`
- Body (JSON):
  ```json
  {
    "email": "chairperson@example.com",
    "password": "your_password"
  }
  ```

**Response:**
- Copy the `accessToken` from the response.

---

## 2. Get Curriculum Details

**Request:**
- Method: `GET`
- URL: `https://course-audit.vercel.app/api/curricula/cmf29k17g0019udi063e6u3i3`
- Headers:
  - `Authorization: Bearer <accessToken>`

**Expected:**
- 200 OK with curriculum data if access is allowed.
- 404 Not Found or 403 Forbidden if not allowed.

---

## 3. Test Elective Rules Endpoint

**Request:**
- Method: `GET`
- URL: `https://course-audit.vercel.app/api/curricula/cmf29k17g0019udi063e6u3i3/elective-rules`
- Headers:
  - `Authorization: Bearer <accessToken>`

**Expected:**
- 200 OK with elective rules if access is allowed.
- 404 Not Found or 403 Forbidden if not allowed.

---

## 4. Test Concentrations Endpoint

**Request:**
- Method: `GET`
- URL: `https://course-audit.vercel.app/api/curricula/cmf29k17g0019udi063e6u3i3/concentrations`
- Headers:
  - `Authorization: Bearer <accessToken>`

**Expected:**
- 200 OK with concentrations data if access is allowed.
- 404 Not Found or 403 Forbidden if not allowed.

---

## 5. Troubleshooting

- If you get a 404 or 403, check:
  - The curriculum ID exists in the database.
  - The chairperson’s department and faculty match the curriculum’s.
  - The access token is valid.

---

## Notes

- Replace `chairperson@example.com` and `your_password` with actual credentials.
- Replace `<accessToken>` with the token from the login response.
- You can use Postman’s “Authorization” tab to set the Bearer token.


# Chairperson API Local Testing with Postman

This guide helps you test curriculum access for a chairperson using Postman **against your local server**.

## 1. Start Your Local Server

Make sure your local backend is running, e.g.:
```bash
npm run dev
```
or
```bash
yarn dev
```
Your local API should be available at `http://localhost:3000`.

---

## 2. Get Chairperson Access Token

**Request:**
- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body (JSON):
  ```json
  {
    "email": "chairperson@example.com",
    "password": "your_password"
  }
  ```

**Response:**
- Copy the `accessToken` from the response.

---

## 3. Get Curriculum Details

**Request:**
- Method: `GET`
- URL: `http://localhost:3000/api/curricula/cmf29k17g0019udi063e6u3i3`
- Headers:
  - `Authorization: Bearer <accessToken>`

**Expected:**
- 200 OK with curriculum data if access is allowed.
- 404 Not Found or 403 Forbidden if not allowed.

---

## 4. Test Elective Rules Endpoint

**Request:**
- Method: `GET`
- URL: `http://localhost:3000/api/curricula/cmf29k17g0019udi063e6u3i3/elective-rules`
- Headers:
  - `Authorization: Bearer <accessToken>`

**Expected:**
- 200 OK with elective rules if access is allowed.
- 404 Not Found or 403 Forbidden if not allowed.

---

## 5. Test Concentrations Endpoint

**Request:**
- Method: `GET`
- URL: `http://localhost:3000/api/curricula/cmf29k17g0019udi063e6u3i3/concentrations`
- Headers:
  - `Authorization: Bearer <accessToken>`

**Expected:**
- 200 OK with concentrations data if access is allowed.
- 404 Not Found or 403 Forbidden if not allowed.

---

## 6. Troubleshooting

- If you get a 404 or 403, check:
  - The curriculum ID exists in your local database.
  - The chairperson’s department and faculty match the curriculum’s.
  - The access token is valid.

---

## Notes

- Replace `chairperson@example.com` and `your_password` with actual credentials.
- Replace `<accessToken>` with the token from the login response.
- You can use Postman’s “Authorization” tab to set the Bearer token.