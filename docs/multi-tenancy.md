# Multi-Tenancy Architecture & Tenant Isolation

This document outlines the multi-tenant design principles established in the Smart School Management System foundation.

## 1. Architectural Model

The platform uses a **shared-database, isolated-document multi-tenancy model** using Mongoose / MongoDB Community Edition:
- Every school is represented by a `School` document with an immutable `_id` and unique `slug` (e.g., `springfield-academy`).
- School-level entities (`User`, and in future phases `Student`, `Teacher`, `Course`, `Attendance`, `Grade`) reference `schoolId: ObjectId`.
- All database collections maintain compound indexes on `{ schoolId: 1, ... }` to ensure query performance and data segregation.

## 2. Server-Side Tenant Resolution

**Fundamental Rule: Never trust a client-supplied `schoolId` as proof of authority.**

### The Authentication & Resolution Flow
1. **User Authentication**:
   - The user authenticates at `POST /api/auth/login`.
   - The server verifies password and extracts the verified `schoolId` assigned to the user document in MongoDB.
   - The verified `schoolId` is signed into the cryptographic JWT token payload (`JWTPayload.schoolId`).
2. **Request Interception (`authenticate` middleware)**:
   - When receiving requests, the server decodes and cryptographically verifies the token.
   - The user's verified identity and assigned `schoolId` are bound to `req.user` and `req.tenantId`.
3. **Tenant Boundary Enforcement (`resolveTenant` middleware)**:
   - If a request is received from a school-level user (`school_admin`, `teacher`, `staff`), the middleware checks if the client attempted to pass a conflicting `schoolId` in the URL query, body, or headers.
   - Any attempt to access or modify records belonging to a different school is immediately blocked with `403 Forbidden` (`TENANT_MISMATCH`).

### Query Scoping Helper (`getTenantFilter`)
Future modules must never query collections without tenant scoping. Controllers utilize the standard helper:

```typescript
import { getTenantFilter } from '../../middleware/tenant.js';

export async function listStudents(req: Request, res: Response) {
  const tenantFilter = getTenantFilter(req); // -> { schoolId: req.tenantId }
  const students = await Student.find({ ...tenantFilter, isActive: true });
  res.json({ success: true, data: students });
}
```

## 3. Role-Based Permissions Matrix

| Role | Tenant Scope | Cross-Tenant Access | School Creation | User Management |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | Platform Wide | Yes (Explicit `x-school-id` scope) | Yes (`POST /api/schools`) | Global |
| **`school_admin`** | Assigned School Only | Strictly Forbidden | No | Assigned School Only |
| **`teacher`** | Assigned School Only | Strictly Forbidden | No | Assigned Classes Only |
| **`staff`** | Assigned School Only | Strictly Forbidden | No | Assigned Department Only |

## 4. Custom School Domains & White-Labeling (Future Roadmap)

In upcoming phases, white-labeling will operate via:
- DNS CNAME mapping (e.g. `portal.springfield.edu` -> `app.smartschool.com`).
- Reverse-proxy header `X-Forwarded-Host` mapped to the `domain` field on the `School` document.
- Client dynamic theme injection (school logo, crest, primary colors) loaded via `GET /api/schools/public/:slug`.
