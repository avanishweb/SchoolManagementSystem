# Smart School Management System (ERP)

A commercial-grade, multi-tenant academic management platform built for modern educational institutions. Engineered for cloud hosting, campus on-premises deployment, and native Windows desktop packaging.

---

## 1. System Architecture & Tech Stack

- **Monorepo Architecture**: npm workspaces (`apps/web`, `apps/api`, `apps/desktop`, `packages/*`).
- **Frontend (`apps/web`)**: React 18, TypeScript, Vite, React Router 6, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide Icons.
- **Backend API (`apps/api`)**: Node.js, Express, TypeScript, MongoDB Community Edition, Mongoose ODM, JWT, bcryptjs, Helmet, rate-limiting, centralized error handling.
- **Desktop Shell (`apps/desktop`)**: Electron 33, Electron Builder, `contextIsolation: true`, restricted preload IPC bridge.
- **Testing**: Vitest, Supertest, MongoDB Memory Server, React Testing Library.

---

## 2. Prerequisites

- **Operating System**: Windows 10/11 (64-bit), macOS, or Linux.
- **Node.js**: Version **v20.x** or **v24.x** (Tested on Node.js `v24.11.1`).
- **Package Manager**: npm **v10.x** or **v11.x** (Bundled with Node.js).
- **MongoDB**: MongoDB Community Server **v7.0+** or **v8.0+** (or MongoDB Atlas cloud cluster).

---

## 3. MongoDB Community Edition Setup on Windows

### Step 1: Install MongoDB Server
1. Download MongoDB Community Server MSI from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Run the MSI installer and choose **Complete Setup**.
3. Check the box to **"Install MongoDB as a Service"** (Service Name: `MongoDB`).

### Step 2: Manage the Windows Service
You can verify and start the MongoDB Windows service anytime via PowerShell:
```powershell
# Check service status
Get-Service -Name MongoDB

# Start the service (Run PowerShell as Administrator if prompted)
Start-Service -Name MongoDB

# Or using standard net command:
net start MongoDB
```

*Note: For integration tests (`npm run test:api`), an automated in-memory MongoDB server is used, so tests run out of the box without requiring the local Windows service.*

---

## 4. Environment Configuration

Copy the example environment template in the project root:

```powershell
Copy-Item .env.example .env
```

Review and adjust variables in `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_school_erp
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=dev_jwt_access_secret_smart_school_min_32_chars_ok!
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_smart_school_min_32_chars_ok!
VITE_API_URL=http://localhost:5000/api
```

---

## 5. Dependency Installation

Install all monorepo dependencies and link local workspaces:

```powershell
npm install
```

---

## 6. Development Seeding (Optional)

To seed a sample demo school (`Springfield Academy`) and test administrative accounts in development:

```powershell
npm run seed
```

### Pre-Configured Development Accounts:
| Role | Email | Password | Tenant / Scope |
| :--- | :--- | :--- | :--- |
| **School Admin** | `admin@springfield.edu` | `Admin@123456` | `springfield-academy` |
| **Teacher** | `teacher@springfield.edu` | `Teacher@123456` | `springfield-academy` |
| **Super Admin** | `superadmin@platform.local` | `SuperAdmin@123456` | Platform Wide (Global) |

*(Quick-fill buttons for these accounts are also provided directly on the Login page).*

---

## 7. Starting the Applications

### Option A: Run Both Backend & Web Frontend Concurrently
```powershell
npm run dev
```
- Web Application: **http://localhost:5173**
- Backend API: **http://localhost:5000**
- Health Probe: **http://localhost:5000/api/health**

### Option B: Run Services Individually
```powershell
# In Terminal 1: Run Express API Server
npm run dev:api

# In Terminal 2: Run Vite React Frontend
npm run dev:web
```

### Option C: Launch Electron Desktop Shell
Ensure the Vite dev server is running, then run:
```powershell
npm run dev:desktop
```

---

## 8. Running Tests, Builds, and Typechecks

```powershell
# Run all automated tests (Backend API + Frontend Unit Tests)
npm test

# Run backend API tests only (Vitest + Supertest + In-Memory Mongo)
npm run test:api

# Run frontend tests only (Vitest + React Testing Library)
npm run test:web

# Run TypeScript typechecks across all monorepo packages
npm run typecheck

# Build all packages, frontend, and backend for production
npm run build

# Package Electron Desktop application into a Windows installer
npm run package:desktop
```

---

## 9. Web vs. Desktop vs. Local Database: Key Distinctions

| Feature | Web Application (`apps/web`) | Desktop Application (`apps/desktop`) |
| :--- | :--- | :--- |
| **Runtime** | Standard web browsers (Chrome, Edge, Firefox, Safari) | Chromium + Electron desktop shell |
| **Database** | Communicates with Backend API via HTTP REST | Communicates with Backend API via HTTP REST |
| **Embedded DB?** | ❌ No database embedded | ❌ MongoDB is NOT embedded inside the `.exe` |
| **Offline Mode** | Connected mode (reconnection resilience) | Connected mode (reconnection resilience) |
| **Native APIs** | Standard Web APIs | Restricted IPC bridge (`window.electronAPI`) |

*For deep architectural details on true offline synchronization and multi-campus deployment options, see [docs/desktop-and-offline.md](file:///d:/Smart%20School%20Management%20System/docs/desktop-and-offline.md).*

---

## 10. Common Errors & Troubleshooting

1. **`MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017`**:
   - Cause: The MongoDB service is stopped on your machine.
   - Solution: Run `Start-Service -Name MongoDB` in an administrative PowerShell terminal or configure a remote MongoDB Atlas URI in `.env`.
   - Notice: The API server will still start and `/api/health` will report database `disconnected` with actionable steps.

2. **CORS Errors in Browser (`Origin not permitted`)**:
   - Cause: Frontend origin mismatch.
   - Solution: Verify `CLIENT_URL=http://localhost:5173` in your `.env` file matches your Vite server address.

3. **Electron window displays blank or fallback screen**:
   - Cause: Electron started before the Vite dev server was listening on `http://localhost:5173`.
   - Solution: Start the web server with `npm run dev:web` first, or run `npm run dev` to start both concurrently.
# SchoolManagementSystem
