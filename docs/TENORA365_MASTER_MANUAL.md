# TENORA365 — ULTIMATE MASTER ARCHITECTURAL & OPERATIONAL MANUAL

**Commercial Multi-Tenant School ERP, School Website Builder, Parent Portal, Teacher Portal & Administration Suite**

---

## 1. Executive Summary & Architecture Overview

**TENORA365** is an enterprise-grade, multi-tenant School Enterprise Resource Planning (ERP) platform designed specifically for the needs of Indian educational institutions (CBSE, ICSE, and State Boards). It delivers end-to-end academic, administrative, and financial automation within a single unified codebase while maintaining strict tenant isolation.

### Key Architectural Pillars:
- **Shared-Codebase, Multi-Tenant Isolation:** Dynamic tenant scoping via HTTP host header, subdomain routing, or authenticated tenant context. No cross-tenant data leakage is permitted at the database, repository, service, or controller layers.
- **Strict Server-Side Validation:** All operational inputs are validated using Zod schemas on the backend and client before persistence.
- **Transactional Consistency:** Financial collections, journal vouchers, and student status transitions execute inside ACID-compliant operations.
- **Auditing & Compliance:** All sensitive tenant mutations (branding updates, support sessions, status changes) write immutable audit logs with actor identity, timestamp, and target resource IDs.
- **Honest Integration Adapters:** External communication (SMS, WhatsApp, Email) and payment gateways (Cash, UPI, Cards, Bank Transfers) operate with authentic adapter contracts, state verification, and verifiable test modes.

---

## 2. Technology Stack & Workspace Structure

```
├── apps/
│   ├── api/             # Node.js, Express, TypeScript, Mongoose/MongoDB, Jest/Vitest
│   └── web/             # React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide
├── packages/
│   ├── shared-types/    # Monorepo TypeScript interfaces & enum models
│   ├── shared-utils/    # Security helpers, JWT signing, role hierarchies, audit logging
│   └── validation/      # Monorepo Zod validation schemas
└── docs/                # Architectural, deployment, and operational guides
```

---

## 3. Implemented ERP Modules & Technical Capabilities

### 3.1. Super Admin Platform & Vendor Console
- **Multi-School Lifecycle:** Onboard new schools with license types (`trial`, `monthly`, `annual`, `lifetime`), max student limits, and status (`active`, `suspended`, `pending`).
- **Emergency Support Access:** Time-bounded, auditable vendor support tokens with mandatory session revocation.
- **Subscription Billing:** Automated invoice generation, payment reconciliation, and license enforcement.

### 3.2. White-Label Branding & Custom Domains
- **Theming:** Custom school logos, primary/accent colors, login banners, and official receipt headers.
- **Domain Verification:** Real DNS challenge verification (`_smartschool-challenge.<domain>` TXT record check) supporting custom domains and automatic subdomain routing.

### 3.3. Student Information System (SIS)
- **Student Profile Management:** Full demographic records, blood groups, addresses, parent details, and document attachments.
- **Unique Admission Numbering:** Automated serial generation per school (`ADM-<Year>-<Seq>`) enforcing strict unique constraints within the tenant while permitting identical numbering across different schools.

### 3.4. Admissions CRM & Pipeline Board
- **Stages:** `New Inquiries` → `Counseling` → `Campus Visit` → `Application Submitted` → `Approved` → `Enrolled`.
- **1-Click SIS Conversion:** Automatically admits approved leads into the active student directory, generates official admission numbers, and updates inquiry state to `ENROLLED`.

### 3.5. Academic Configuration & Curricula
- **Academic Sessions:** Start/end dates and current session indicator.
- **Classrooms & Sections:** Numeric ordering, section capacities, class teacher allocations, and room numbering.
- **Subject Curriculum:** Theory, practical, pass marks, and maximum mark allocations.

### 3.6. Faculty & Employee Directory
- **Staff Profiles:** Teachers, administrative staff, accountants, principals, librarians with employee IDs.
- **Workload Management:** Department assignments, designations, salary structures, assigned classes, and subjects.

### 3.7. Attendance Roll Call Engine
- **Daily Roll Call:** Present, Absent, Late, Half Day, and Approved Leave status tracking per class and section.
- **Monthly Attendance Summaries:** Automated attendance percentage calculations and defaulter detection.

### 3.8. Collision-Free Timetable Scheduler
- **Collision Engine:** Real-time conflict detection preventing:
  1. Teacher double-booking across different classes.
  2. Room collisions at identical time intervals.
  3. Class period overlaps.
- **Printable Schedule:** Clean 6-day (Monday to Saturday) timetable view.

### 3.9. Homework & Digital LMS
- **Assignment Dispatch:** Class, section, subject, instructions, attachments, and due date management.
- **Turn-In & Late Detection:** Student digital submissions with timestamp verification against assignment due dates.
- **Teacher Evaluation:** Mark allocation, feedback remarks, and evaluation status tracking.

### 3.10. Examination & Board Report Cards
- **Exam Scheduling:** Exam terms, dates, subject timing, and passing thresholds.
- **Marks Sheet Entry:** Theory and practical score recording with automated A+, A, B, C, D, F grade computation.
- **Progress Report Card:** Formal printable report card displaying total score, percentage, grade, and result status.

### 3.11. Fee Lifecycle & Payment Counter
- **Fee Configuration:** Recurring and one-time fee heads (Tuition, Annual, Lab, Transport).
- **Auto-Allocation:** Class-wise fee structures with installments and due dates.
- **Cashier Counter:** Collection via Cash, UPI, Card, or Bank Transfer with automated receipts and outstanding balance tracking.

### 3.12. Double-Entry Accounting & General Ledger
- **Chart of Accounts:** Assets, Liabilities, Equity, Income, and Expenses with real-time balance computation.
- **Balanced Journal Vouchers:** Enforces strict mathematical balance (`Total Debits == Total Credits`) before voucher posting.
- **Trial Balance Report:** Live trial balance report verifying ledger equilibrium.

### 3.13. School Website Builder (CMS)
- **Page CMS:** Customizable public pages (Home, About, Admissions, Facilities, Contact) with SEO metadata.
- **Public Notice Board:** Circular publishing with priority levels (`Low`, `Medium`, `High`) and categories.
- **Live Preview:** Instant browser preview of the public school website.

---

## 4. Verification & Automated Test Results

The platform has been rigorously tested using automated test suites across both backend API and frontend React application.

### Test Execution Summary:
- **Backend API Integration Tests:** **52 / 52 Passed (100%)**
  - `tests/commercial-tenant.test.ts` (13 tests)
  - `tests/student.test.ts` (16 tests)
  - `tests/tenora365-erp-workflows.test.ts` (13 tests)
  - `tests/auth.test.ts` (8 tests)
  - `tests/health.test.ts` (2 tests)
- **Frontend Web Unit & UI Tests:** **15 / 15 Passed (100%)**
  - `src/test/tenora365-erp-pages.test.tsx` (8 tests)
  - `src/test/commercial-portal.test.tsx` (2 tests)
  - `src/test/student-pages.test.tsx` (2 tests)
  - `src/test/common-components.test.tsx` (3 tests)
- **Total Passing Automated Tests:** **67 / 67 Passed**

---

## 5. Deployment & Execution Instructions

### Prerequisites:
- Node.js >= 18.x
- MongoDB >= 6.0
- npm >= 9.x

### 1. Build All Packages and Applications:
```bash
# Build monorepo shared packages
npm run build:packages

# Build backend API
npm run build:api

# Build frontend production bundle
npm run build:web
```

### 2. Run Automated Verification Tests:
```bash
# Run backend test suite
npm run test:api

# Run frontend test suite
npm run test:web
```

### 3. Start Development Servers:
```bash
# Concurrently start API and Web dev servers
npm run dev
```
- **Backend API:** `http://localhost:5000/api`
- **Frontend Portal:** `http://localhost:5173`

### 4. Production Deployment with Docker Compose:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: smartadmin
      MONGO_INITDB_ROOT_PASSWORD: securepassword
    volumes:
      - mongo_data:/data/db

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    environment:
      PORT: 5000
      MONGODB_URI: mongodb://smartadmin:securepassword@mongodb:27017/tenora365?authSource=admin
      JWT_SECRET: your-super-secret-production-jwt-key
    depends_on:
      - mongodb

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  mongo_data:
```

---

## 6. Security & Tenant Boundary Matrix

| User Role | Platform Console | SIS Admissions | Attendance & Homework | Fees & Payments | Accounting Ledger | School CMS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full | Emergency Support | Read-only Support | Audit only | Platform Invoices | Read-only |
| **School Admin** | Denied | Full | Full | Full | Full | Full |
| **Teacher** | Denied | View Only | Create & Grade | View Only | Denied | Post Notices |
| **Accountant** | Denied | View Only | View Only | Full Collection | Full Ledger | Denied |
| **Parent / Student** | Denied | View Own | View Own | Pay Own Fees | Denied | View Public |
