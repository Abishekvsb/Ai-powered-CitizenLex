# CitizenLex API Reference

**Version:** 1.0.0  
**Base URL (Production):** `https://citizenlex-backend.onrender.com/api`  
**Base URL (Local):** `http://localhost:8080/api`  
**Auth:** `Authorization: Bearer <JWT_TOKEN>` on all protected endpoints

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile](#2-user-profile)
3. [AI Legal Copilot](#3-ai-legal-copilot)
4. [Lawyer Marketplace](#4-lawyer-marketplace)
5. [Appointments](#5-appointments)
6. [Documents](#6-documents)
7. [Rights & Schemes](#7-rights--schemes)
8. [Notifications](#8-notifications)
9. [Admin](#9-admin)
10. [Error Codes](#10-error-codes)

---

## 1. Authentication

### POST /auth/register
Create a new user account. Sends email verification OTP automatically.

**Request**
```json
{
  "firstName": "Abishek",
  "lastName": "Kumar",
  "email": "abishek@example.com",
  "password": "SecurePass@123",
  "mobile": "9876543210"
}
```
**Response** `201 Created`
```json
{
  "id": 42,
  "email": "abishek@example.com",
  "firstName": "Abishek",
  "lastName": "Kumar",
  "roles": ["ROLE_USER"],
  "createdAt": "2026-07-06T14:00:00"
}
```

### POST /auth/login
```json
{ "email": "user@example.com", "password": "Pass@123" }
```
**Response** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": { "id": 1, "email": "...", "roles": ["ROLE_USER"] }
}
```

### POST /auth/verify-email
```json
{ "token": "email_verification_token" }
```
**Response** `200 OK` → `{ "message": "Email verified successfully." }`

---

## 2. User Profile

### GET /profile
Returns authenticated user's profile.

**Response** `200 OK`
```json
{
  "id": 1,
  "firstName": "Abishek",
  "lastName": "Kumar",
  "email": "abishek@example.com",
  "mobile": "9876543210",
  "district": "Chennai",
  "state": "Tamil Nadu",
  "profileImageUrl": "https://res.cloudinary.com/...",
  "emailVerified": true,
  "createdAt": "2026-07-06T14:00:00"
}
```

### PUT /profile/update
Update profile fields (multipart/form-data).

| Field | Type | Description |
|---|---|---|
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `mobile` | string | Mobile number |
| `district` | string | District of residence |
| `state` | string | State |
| `profileImage` | file | New profile photo (optional) |

---

## 3. AI Legal Copilot

### POST /chat
```json
{
  "message": "What are my rights if arrested without a warrant?",
  "language": "en"
}
```
**Response** `200 OK`
```json
{
  "id": 10,
  "message": "What are my rights if arrested without a warrant?",
  "response": "Under Article 22 of the Indian Constitution...",
  "language": "en",
  "createdAt": "2026-07-06T14:00:00"
}
```

### GET /chat/history
Returns full conversation history for authenticated user.
**Response** `200 OK` → Array of `ChatHistory` objects.

### POST /copilot/recommend
AI-powered lawyer recommendation by case description.
```json
{ "query": "My employer did not pay salary for 3 months" }
```
**Response** `200 OK` → Array of `Lawyer` objects ranked by AI-matched specialization.

---

## 4. Lawyer Marketplace

### GET /lawyers
Filter and search verified advocates.

**Query Parameters:**
```
district=Chennai&specializationId=1&maxFee=2000&minRating=4.0&sortBy=rating_desc
```

### GET /lawyers/{id}
Returns single lawyer profile with full details.

### POST /lawyers/register
Register current user as an advocate (Auth: `ROLE_USER`).

### GET /lawyers/specializations
Returns all practice area categories.
**Response** → `[{ "id": 1, "name": "Civil Litigation" }, ...]`

### GET /lawyers/{id}/reviews
Get all reviews for a lawyer.

### POST /lawyers/{id}/review
Submit a review after a completed appointment.
```json
{ "rating": 5, "comment": "Very helpful and professional." }
```

---

## 5. Appointments

### POST /appointments/book
```json
{
  "lawyerId": 1,
  "appointmentDate": "2026-07-15",
  "timeSlot": "10:00 AM - 10:30 AM",
  "notes": "Rental dispute case."
}
```
**Response** → `Appointment` object with `status: "PENDING"`

### GET /appointments/user
Get all appointments for the authenticated user.

### GET /appointments/lawyer
Get all appointments for the authenticated lawyer.

### POST /appointments/{id}/payment/initiate
Create Razorpay order.
**Response** → `{ orderId, amount, currency }`

### POST /appointments/{id}/payment/verify
Verify Razorpay payment signature.
```json
{
  "razorpayOrderId": "order_xxxx",
  "razorpayPaymentId": "pay_xxxx",
  "razorpaySignature": "signature_xxxx"
}
```

### PUT /appointments/{id}/status
Update appointment status (Auth: `ROLE_LAWYER` or `ROLE_ADMIN`).
```json
{ "status": "CONFIRMED" }
```

---

## 6. Documents

### POST /documents/upload
Upload a legal document for AI analysis.  
**Request** — `multipart/form-data` with `file` key.  
**Accepted:** PDF, DOCX, JPG, PNG — max 10MB

**Response** → `UserDocument` with `summary` field containing AI-generated analysis.

### GET /documents/history
Get all uploaded documents for authenticated user.

### POST /documents/{id}/reanalyze
Re-run AI analysis on an existing document.

### POST /drafts/generate
Generate an AI-drafted legal document.
```json
{
  "documentType": "RENTAL_AGREEMENT",
  "details": "Landlord: John Doe, Tenant: Jane Doe, Period: 11 months, Rent: ₹15000/month"
}
```
**Response** → `{ "draft": "RENTAL AGREEMENT\n\nThis agreement..." }`

---

## 7. Rights & Schemes

### GET /rights/categories
Returns all rights category list.

### GET /rights/categories/{id}/content
Returns all content articles for a category.

### GET /schemes
Returns all government schemes.

### GET /schemes/{id}
Returns single scheme with eligibility criteria.

---

## 8. Notifications

### GET /notifications
Returns all notifications for authenticated user.

### PUT /notifications/{id}/read
Mark a notification as read.

### PUT /notifications/read-all
Mark all notifications as read.

---

## 9. Admin

All endpoints require `ROLE_ADMIN`.

### GET /admin/analytics
Platform statistics — user count, lawyer count, appointments, revenue.

### GET /admin/lawyers/pending
List lawyers awaiting KYC verification.

### PUT /admin/lawyers/{id}/verify
```json
{ "status": "APPROVED" }
```

### DELETE /admin/lawyers/{id}
Remove a lawyer from the platform.

### POST /admin/notifications/broadcast
```json
{
  "title": "Platform Update",
  "message": "We've launched new features in the Lawyer Marketplace."
}
```

---

## 10. Error Codes

| HTTP Code | Meaning |
|---|---|
| `200` | OK — Request successful |
| `201` | Created — Resource created |
| `400` | Bad Request — Validation error |
| `401` | Unauthorized — Missing or invalid JWT |
| `403` | Forbidden — Insufficient role |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate entry (e.g. email already registered) |
| `500` | Internal Server Error — Contact maintainer |

**Error Response Format:**
```json
{
  "timestamp": "2026-07-06T14:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: email must be a valid email address"
}
```
