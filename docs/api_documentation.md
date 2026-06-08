# Vaccination Drive API Documentation

Base URL: `/api`

Authentication uses `Authorization: Bearer <accessToken>` for protected routes. Refresh tokens are stored in HTTP-only cookies.

## Authentication

### Register

`POST /auth/register`

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "strong-password",
  "phone": "9876543210",
  "age": 25,
  "gender": "Male",
  "address": "Hyderabad"
}
```

### Login

`POST /auth/login`

```json
{
  "email": "john@example.com",
  "password": "strong-password"
}
```

### Logout

`POST /auth/logout`

### Refresh Token

`POST /auth/refresh-token`

### Current User

`GET /auth/me`

### Update Profile

`PUT /auth/profile`

### Google OAuth

- `GET /auth/google`
- `GET /auth/google/callback`

Google OAuth requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a frontend `CLIENT_URL` registered as an authorized redirect URI.

## Configuration

### Campaign Config

`GET /config`

Returns vaccine metadata used by the frontend registration flow.

## Registrations

### Create Registration

`POST /registrations`

```json
{
  "fullName": "John Doe",
  "age": 25,
  "gender": "Male",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "Hyderabad",
  "vaccineId": "ceravac-hpv",
  "dose": "Dose 1",
  "appointmentDate": "2026-06-15",
  "appointmentSlot": "10:00 AM - 12:00 PM"
}
```

### List Visible Registrations

`GET /registrations`

Users receive only their own registrations. Admin/staff users receive the full queue.

### Current User Registrations

`GET /registrations/me`

## Razorpay Payments

### Create Order

`POST /payments/create-order`

```json
{
  "registrationId": "REG-2026-0001"
}
```

### Verify Payment

`POST /payment/verify-payment`

```json
{
  "registrationId": "REG-2026-0001",
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature"
}
```

Successful verification stores the payment and sets the registration to pending admin approval. PDF receipts are generated only after admin approval.

## Receipts

### Download Approved Receipt

`GET /receipt/:registrationId`

Receipt download is allowed only for the owner or an admin after payment approval.

## Admin

### Users

`GET /admin/users`

### Registrations

`GET /admin/registrations`

### Payments

`GET /admin/payments`

### Confirm Payment

`POST /admin/confirm-payment/:registrationId`

Approves the payment, generates the PDF receipt, updates payment records, and makes the receipt visible to the user.

### Reject Payment

`POST /admin/reject-payment/:registrationId`

### Export Registration Excel

`POST /admin/excel`

Downloads a formatted `.xlsx` payment queue report.

### Export User Excel

`POST /admin/users/excel`

Downloads a formatted `.xlsx` user management report with sensitive fields excluded.

## Verification

### Mark Participant Verified

`POST /verify/:registrationId`

Requires admin or staff role and a confirmed payment.
