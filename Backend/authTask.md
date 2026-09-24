# 🔐 Security & Authorization — TASK.md

> Master checklist for implementing security and authorization in the AI Voice Cloning Backend.
>
> Rule: Complete → Test → Verify → Mark `[x]` → Move to next task.

---

# Phase 1 — User Registration

## 1.1 Inspect Existing User System

- [X] Inspect `User` SQLAlchemy model
- [X] Inspect `UserRepository`
- [X] Inspect existing `users` database table
- [X] Inspect existing user-related tests
- [X] Identify existing fields
- [X] Avoid duplicating existing functionality

## 1.2 Update User Model

Current:

```text
users
├── id
├── name
└── created_at
```

Required:

```text
users
├── id
├── name
├── email
├── password_hash
└── created_at
```

Tasks:

- [X] Add `email`
- [X] Add `password_hash`
- [X] Make email unique
- [X] Create Alembic migration
- [X] Run migration
- [X] Verify database schema

## 1.3 Password Security

```text
Password
   ↓
Password Hashing
   ↓
password_hash
   ↓
PostgreSQL
```

Tasks:

- [X] Choose password hashing library
- [X] Implement password hashing
- [X] Implement password verification
- [X] Never log passwords
- [X] Never return password hash through API

## 1.4 Registration Schema

Request:

```json
{
    "name": "Aniket",
    "email": "aniket@example.com",
    "password": "secure-password"
}
```

Tasks:

- [X] Create `UserRegistrationRequest`
- [X] Validate name
- [X] Validate email
- [X] Validate password
- [X] Define minimum password length
- [X] Reject invalid email
- [X] Reject empty fields

## 1.5 Registration Service

Create:

```text
UserRegistrationService
```

Flow:

```text
Registration Request
        ↓
Validate Input
        ↓
Check Existing Email
        ↓
Hash Password
        ↓
Create User
        ↓
Store User
        ↓
Return Safe User Data
```

Tasks:

- [X] Create registration service
- [X] Check duplicate email
- [X] Hash password
- [X] Create user
- [X] Commit transaction
- [X] Return user
- [X] Never return `password_hash`

## 1.6 Registration API

Endpoint:

```text
POST /api/auth/register
```

Tasks:

- [X] Create auth router
- [X] Create registration endpoint
- [X] Inject database session
- [X] Call registration service
- [X] Handle duplicate email
- [X] Return appropriate HTTP status
- [X] Add response schema

Response must not contain:

```text
password
password_hash
```

---

# Phase 2 — Registration Testing

## Unit Tests

- [X] Valid registration
- [X] Password is hashed
- [X] Password is never stored as plaintext
- [X] Duplicate email rejected
- [X] Invalid email rejected
- [X] Empty name rejected
- [X] Empty password rejected
- [X] Short password rejected

## API Tests

- [X] `POST /api/auth/register` returns success
- [X] User appears in database
- [X] Response does not contain password
- [X] Response does not contain password hash
- [X] Duplicate registration returns correct error
- [X] Invalid request returns validation error

## Security Tests

- [X] Password cannot be recovered from API response
- [X] Password is not written to logs
- [X] Email uniqueness works

---

# Phase 3 — Login

Only start after Registration is complete and tested.

## Login Flow

```text
Email + Password
       ↓
Find User
       ↓
Verify Password
       ↓
Generate JWT
       ↓
Return Access Token
```

Tasks:

- [X] Create login schema
- [X] Find user by email
- [X] Verify password
- [X] Implement JWT generation
- [X] Add token expiration
- [X] Create login endpoint
- [X] Add login tests
- [X] Handle invalid credentials

Endpoint:

```text
POST /api/auth/login
```

---

# Phase 4 — Authentication

After login works:

```text
JWT Bearer Token
       ↓
FastAPI
       ↓
Validate JWT
       ↓
Extract user ID
       ↓
Load User
       ↓
Current User
```

Tasks:

- [X] Create JWT configuration
- [X] Create JWT decoder
- [X] Create `get_current_user()`
- [X] Handle missing token
- [X] Handle invalid token
- [X] Handle expired token
- [X] Handle deleted user
- [X] Create `/api/auth/me`
- [X] Add authentication tests

---

# Phase 5 — Protect Voice APIs

Once authentication works:

- [X] Protect voice upload
- [X] Protect voice registration
- [X] Protect voice listing
- [X] Protect voice details
- [X] Protect voice generation
- [X] Protect voice deletion
- [X] Protect audio access

Do not trust client-controlled identity:

```text
JWT
 ↓
current_user.id
```

Remove patterns such as:

```text
?user_id=user_a
```

---

# Phase 6 — Voice Ownership

Every voice operation must verify:

```text
voice.user_id == current_user.id
```

Tasks:

- [X] Owner can access own voice
- [X] User A cannot access User B voice
- [X] User A cannot generate using User B voice
- [X] User A cannot delete User B voice
- [X] User A cannot access User B audio
- [X] Add cross-user authorization tests

---

# Phase 7 — Path & Filename Security

## Path Traversal

Examples:

```text
../../secret.wav
..\..\secret.wav
/etc/passwd
C:\secret.wav
```

Tasks:

- [X] Prevent `../`
- [X] Prevent `..\`
- [X] Prevent absolute paths
- [X] Resolve paths safely
- [X] Ensure path remains inside storage root
- [X] Add traversal tests

## Filename Security

- [X] Never trust uploaded filename
- [X] Generate UUID temporary filenames
- [X] Use fixed permanent filenames
- [X] Use generated voice IDs
- [X] Use generated generation IDs
- [X] Add malicious filename tests

Storage:

```text
storage/
└── users/
    └── {user_id}/
        └── voices/
            └── {voice_id}/
                ├── processed.wav
                └── reference_codes.pt
```

---

# Phase 8 — Audio Security

## Audio Content Validation

```text
File Extension
      ↓
Content-Type
      ↓
Actual Audio Decode
      ↓
Audio Properties
      ↓
Duration
      ↓
Channels
      ↓
Signal Quality
      ↓
Process Audio
```

Tasks:

- [X] Validate extension
- [X] Validate MIME type
- [X] Attempt actual audio decoding
- [X] Reject corrupt audio
- [X] Validate duration
- [X] Validate channels
- [X] Validate sample rate
- [X] Validate signal quality
- [X] Test renamed non-audio files

---

# Phase 9 — Text & Request Limits

## Text

Maximum:

```text
5000 characters
```

Tasks:

- [ ] Minimum length
- [ ] Maximum length
- [ ] Strip whitespace
- [ ] Reject empty text
- [ ] Test 5000 characters
- [ ] Test 5001 characters

## Request Limits

Existing:

```text
Maximum upload size: 25 MB
Maximum generation text: 5000 characters
```

Tasks:

- [ ] Verify 25 MB upload limit
- [ ] Verify 5000-character text limit
- [ ] Add login rate limiting
- [ ] Add registration rate limiting
- [ ] Add generation rate limiting
- [ ] Add upload rate limiting
- [ ] Consider generation concurrency limit

---

# Phase 10 — Protected Audio

Stored audio must never be publicly accessible.

Tasks:

- [ ] Do not expose storage directory publicly
- [ ] Create authenticated audio endpoint
- [ ] Verify current user
- [ ] Verify voice ownership
- [ ] Verify generation ownership
- [ ] Verify file exists
- [ ] Return audio only after authorization
- [ ] Test unauthorized audio access

Secure flow:

```text
GET Audio
   ↓
JWT
   ↓
Current User
   ↓
Ownership Check
   ↓
File Exists?
   ↓
Return Audio
```

---

# Phase 11 — Temporary File Security

Raw uploaded files are temporary only.

Flow:

```text
Upload
  ↓
Temporary File
  ↓
Process
  ↓
Store Processed Audio
  ↓
Encode Reference
  ↓
Store Reference Codes
  ↓
Delete Raw File
```

Tasks:

- [ ] Cleanup after success
- [ ] Cleanup after processing failure
- [ ] Cleanup after NeuTTS failure
- [ ] Cleanup after database failure
- [ ] Verify `finally` cleanup
- [ ] Add cleanup tests

---

# Phase 12 — Secure Logging

Never log:

- [ ] Passwords
- [ ] Password hashes
- [ ] JWT tokens
- [ ] Authorization headers
- [ ] Audio bytes
- [ ] Reference codes
- [ ] API keys
- [ ] Database credentials
- [ ] Sensitive filesystem paths
- [ ] Full sensitive user text

Safe logging:

```text
Voice registration started
user_id=<uuid>
voice_id=<uuid>
status=PROCESSING
```

Tasks:

- [ ] Review existing logs
- [ ] Remove sensitive values
- [ ] Verify authentication logs
- [ ] Verify voice logs
- [ ] Verify generation logs

---

# Phase 13 — Final Security Testing

## Authentication

- [ ] Registration works
- [ ] Login works
- [ ] JWT works
- [ ] Invalid JWT rejected
- [ ] Expired JWT rejected
- [ ] Missing JWT rejected

## Authorization

- [ ] User can access own voice
- [ ] User cannot access another user's voice
- [ ] User can generate own voice
- [ ] User cannot generate another user's voice
- [ ] User can delete own voice
- [ ] User cannot delete another user's voice
- [ ] User cannot access another user's audio

## File Security

- [ ] Path traversal blocked
- [ ] Malicious filenames handled
- [ ] Generated IDs used
- [ ] Temporary files deleted
- [ ] Stored audio protected

## Input Security

- [ ] Invalid audio rejected
- [ ] Corrupt audio rejected
- [ ] Oversized upload rejected
- [ ] Empty text rejected
- [ ] Oversized text rejected

## Logging

- [ ] No passwords logged
- [ ] No JWTs logged
- [ ] No audio data logged
- [ ] No sensitive filesystem paths logged

---
