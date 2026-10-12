# Smart Patient Intake

A small full-stack prototype for clinic intake, rule-based red-flag highlighting, department routing, ticket generation, and a staff queue dashboard.

> **Important:** This is an educational/demo prototype, not a clinical decision system. It does not diagnose or provide medical advice. Use fictional data only. Do not use it for real patient care or real patient information without a qualified security/privacy review, clinical validation, appropriate hosting, and applicable legal compliance.

## Requirements

- Node.js 20 or newer
- npm

## Run locally (Windows PowerShell)

1. Open this folder in VS Code.
2. Install dependencies:

   ```powershell
   npm install
   ```

3. Copy the example environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Open `.env`. Set `SESSION_SECRET` to a long random value (at least 32 characters). For local demo mode, the default staff login is `clinical.admin` / `administrator`; change it before sharing the project. Production requires `STAFF_PASSWORD_HASH` and will not accept the demo password.
5. Start the server:

   ```powershell
   npm start
   ```

6. Open **http://localhost:3000**. Patient submissions are saved to `data/patients.json`; staff sessions are stored in a local SQLite file in the `data` directory.

For development with automatic server restarts, run `npm run dev`.

## Staff login for local demo

- Username: `clinical.admin`
- Password: `administrator`

This fallback is enabled only when `NODE_ENV` is not `production`. Change the local credentials by setting `STAFF_USERNAME` and a `STAFF_PASSWORD_HASH` in `.env` (see below). Never commit `.env` or real credentials.

### Create a password hash

After `npm install`, run this command and replace `YOUR-STRONG-PASSWORD` with your chosen password:

```powershell
node -e "require('bcryptjs').hash('YOUR-STRONG-PASSWORD', 12).then(console.log)"
```

Copy the resulting hash into `.env` as `STAFF_PASSWORD_HASH=...`, and set `STAFF_USERNAME` to the desired username. Do not commit `.env`.

## Deploy

This project writes patient-demo data and session SQLite files to disk. Deploy it on a Node.js host that supports a persistent disk/volume. If the host has an ephemeral filesystem, data may be lost on redeploy/restart. For a public demo, use fictional records only.

Set these environment variables in the host dashboard:

- `NODE_ENV=production`
- `SESSION_SECRET` (long random secret, at least 32 characters)
- `STAFF_USERNAME`
- `STAFF_PASSWORD_HASH` (bcrypt hash; never plain-text password)
- `DATA_FILE` (optional path on the persistent disk, e.g. `/var/data/patients.json`)
- `PORT` is normally supplied by the hosting platform

Build/start command: `npm install` / `npm start`. Add a persistent disk and point `DATA_FILE` to that mounted path. Configure HTTPS at the host. Before using a real deployment, replace the JSON-file data layer with a production database and add backups, audit logging, access policies, monitoring, and security/clinical review.

## Push to GitHub

Create an empty repository on GitHub (do not add a README there if this folder already has one). From this folder:

```powershell
git init
git add .
git commit -m "Initial Smart Patient Intake prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your own repository URL. Check `git status` and make sure `.env`, `node_modules`, database files, and real patient data are not being committed.

## API routes

- `GET /api/health` — service health check
- `POST /api/patients` — create an intake and ticket
- `POST /api/login` — staff login
- `POST /api/logout` — staff logout
- `GET /api/session` — session status
- `GET /api/patients` — list tickets (staff session required)
- `PATCH /api/patients/:id` — update status, department, or clinician summary (staff session required)

## Current limitations

- Triage is rule-based, not AI-powered; it is only a demo routing aid.
- The red-flag patterns are not exhaustive. A missing flag never means a patient is safe.
- Data is stored as a JSON file and is suitable only for a single-instance demo, not concurrent production workloads.
- Patient intake is public by design for the demo; do not publish this as a real clinic service without adding the correct patient identity, consent, access, privacy, and clinical workflows.
