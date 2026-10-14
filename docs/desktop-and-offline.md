# Electron Desktop Application & Offline Architecture Guide

This document clarifies the desktop deployment model, MongoDB database requirements, and offline capabilities of the Smart School Management System.

## 1. Electron Desktop Shell Overview

The desktop application (`apps/desktop`) is an Electron wrapper designed to provide a native Windows application shell around the React application (`apps/web`).

### Key Security Safeguards
- **`contextIsolation: true`**: Isolates Electron internal APIs from the renderer's JavaScript execution context.
- **`nodeIntegration: false`**: Prevents the web frontend from accessing Node.js runtime APIs directly (`fs`, `child_process`, `net`).
- **Restricted Preload Bridge**: Communication occurs exclusively through `window.electronAPI` via `contextBridge.exposeInMainWorld()`.
- **Navigation Lockdown**: Arbitrary hyperlinks and window popups are blocked and routed safely to Windows' default browser via `shell.openExternal()`.

## 2. Database & Hosting Model: Important Clarifications

### ⚠️ MongoDB is NOT Embedded in Electron
- Electron packages Chromium and Node.js. It does **not** automatically package, embed, or run MongoDB Community Edition inside the `.exe` installer.
- In both web and desktop modes, the backend API (`apps/api`) requires access to a running MongoDB database instance specified by `MONGODB_URI`.

### Supported Deployment Models

1. **Cloud-Hosted Multi-Tenant Model (Standard Commercial Architecture)**:
   - The Backend API and MongoDB instance run in a secure cloud environment (e.g. AWS, GCP, Azure, or MongoDB Atlas).
   - Both the Web Browser and Desktop Electron clients connect over HTTPS to the central API.
   - Requires active internet connection; benefits from automated central backups, live multi-campus syncing, and zero on-prem server maintenance for client schools.

2. **On-Premises Campus Server Model**:
   - The school installs MongoDB Community Edition on a local Windows Server / Linux server on the campus LAN.
   - The Backend API runs on the campus server (`http://192.168.1.100:5000/api`).
   - Desktop and web clients within the campus network communicate with the local server without needing internet access.

3. **Standalone Single-Machine Workstation Model**:
   - The school installs MongoDB Community Server as a Windows Service directly on the administrative PC.
   - The API server runs locally at `http://127.0.0.1:5000`.
   - The Electron app connects to `127.0.0.1`.

## 3. Offline Synchronization Reality & Roadmap

> [!IMPORTANT]
> **No hosted web app or standard Electron wrapper works offline without an explicit local storage engine and conflict-resolution synchronization protocol.**

Claims that a client-server ERP "works offline out of the box" are false. To deliver true offline-first functionality in subsequent development phases, the following architecture must be implemented:
- **Local Storage Engine**: Embedded SQLite or IndexedDB via WatermelonDB or RxDB on the client machine.
- **Optimistic Local Mutations**: Creating attendance records or student logs writes immediately to the local cache.
- **Sync Protocol**: An operational-transform (OT) or vector-clock conflict resolution engine that transmits batches of changes to the central MongoDB API when connectivity is restored.

In the current initial foundation phase, the system operates in Connected Mode with resilient reconnection handling.

## 4. Building and Launching Desktop on Windows

### Prerequisites
- Node.js 20+ / 24+
- Windows 10/11 64-bit

### Running in Development
```powershell
# In terminal 1: Start the API server
npm run dev:api

# In terminal 2: Start the Web frontend
npm run dev:web

# In terminal 3: Launch Electron connected to the dev server
npm run dev:desktop
```

### Building the Production Windows Installer
```powershell
# 1. Build packages and frontend bundle
npm run build

# 2. Package into a Windows NSIS installer
npm run package:desktop
```
The resulting installer is generated inside `apps/desktop/release/`.
