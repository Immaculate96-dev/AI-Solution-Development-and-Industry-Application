# Smart Patient Intake System

https://smart-patient-intake.onrender.com

A web-based clinic intake and patient queue management prototype designed to streamline the initial patient registration process, highlight potential warning signs, and direct patients to the appropriate clinic department.

Smart Patient Intake provides a central interface for collecting patient information and a staff dashboard for reviewing submissions, prioritising queues, and managing patient flow. The prototype demonstrates how web technologies and rule-based automation can support administrative workflows in a healthcare environment.

> **Project status:** Prototype / demonstration application. This system does not diagnose medical conditions or replace professional clinical assessment. Use fictional patient data only.

## Overview

Patient intake is an important part of the healthcare process. Collecting information consistently and directing patients to the right department can help clinic staff organise their workload and identify submissions that require prompt attention.

Smart Patient Intake explores a digital approach to this process through a patient-facing intake form and a staff-facing queue management dashboard.

The system collects basic patient information, applies predefined rules to identify potential warning signs, generates a queue ticket, and routes the submission to a suggested department. Authorised staff can then review the information and manage the patient's queue status.

## Key Features

- **Patient registration:** Capture a patient's name, age, reason for visiting, symptom duration, medications, and allergies.
- **Automated triage support:** Apply predefined keyword rules to highlight selected potential warning signs.
- **Department routing:** Assign submissions to a department based on predefined routing rules.
- **Ticket generation:** Generate a department-specific queue number for each submitted intake.
- **Priority indicators:** Display routine, soon, or urgent priority labels to support staff review.
- **Staff dashboard:** Review submitted tickets and filter the queue by department.
- **Queue management:** Call patients, mark consultations as complete, and reopen completed tickets.
- **Clinician summaries:** Display editable summaries and the information collected during intake.
- **Session-based staff access:** Protect staff dashboard operations behind a staff login.
- **Responsive interface:** Provide a clean interface designed to work across different screen sizes.

## How the System Works

1. **Patient intake:** The patient completes the registration form with their basic details and reason for visiting.
2. **Rule-based assessment:** The application evaluates selected text against predefined warning-sign patterns and routing rules.
3. **Ticket creation:** The system assigns a ticket number and records the intake.
4. **Department assignment:** The submission is routed to a suggested department, such as Emergency Triage, General Consultation, Chronic Care, or Maternal & Child Health.
5. **Queue review:** Clinic staff sign in to the staff dashboard to view tickets, review the submitted information, and manage queue status.
6. **Staff follow-up:** Staff can update the department, edit the clinician summary, and manage the ticket through the queue workflow.

**Important:** Automated flags and department assignments are administrative aids only. All clinical decisions must be made by qualified healthcare professionals.

## Staff Login Credentials


| Field | Demo value |
|---|---|
| Username | `clinical.admin` |
| Password | `administrator` |


## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js and Express
- **Authentication:** Session-based staff login
- **Data storage:** JSON-file storage for demonstration patient records and SQLite-based session storage
- **Development tools:** npm and Git
- **Deployment:** Node.js-compatible hosting platform with persistent storage

## Prerequisites and Requirements

Before running the application, ensure the following are installed:

- **Node.js:** Version 20 or newer
- **npm:** Included with Node.js
- **Git:** Required for version control and GitHub integration
- **Web browser:** A modern browser such as Chrome, Edge, or Firefox
- **Code editor:** Visual Studio Code is recommended

Check your installed versions:

```powershell
node --version
npm --version
git --version
```

## Installation and Local Setup

### 1. Clone the repository

Open PowerShell and navigate to the directory where you want to store the project.

```powershell
git clone YOUR-GITHUB-REPOSITORY-URL
cd smart-patient-intake
```

Replace `YOUR-GITHUB-REPOSITORY-URL` with the HTTPS or SSH URL of your GitHub repository.

If the project is already on your computer, open its existing folder instead.

### 2. Install dependencies

```powershell
npm install
```

This installs the packages specified in `package.json`.

### 3. Configure environment variables

Create a local environment file from the provided template:

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure the required settings. At minimum, ensure that the session secret is a long, random value.

For local demonstration mode, the default staff login is described in the Staff Login Credentials section below.

**Never commit `.env` to GitHub.** The `.env.example` file should contain placeholders rather than actual passwords, session secrets, or API keys.

### 4. Start the application

```powershell
npm start
```

### 5. Open the application

Visit the following address in your browser:

**http://localhost:3000**

For development with automatic server restarts, use:

```powershell
npm run dev
```

If the application fails to start, check the terminal output, verify that dependencies installed successfully, and confirm that your environment variables are configured correctly.


## API Routes

The application exposes the following HTTP endpoints.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Check service health | Health check |
| POST | `/api/patients` | Submit a patient intake and create a ticket | Public demo intake |
| POST | `/api/login` | Authenticate clinic staff | Login endpoint |
| POST | `/api/logout` | End the staff session | Staff session |
| GET | `/api/session` | Check the current session status | Session check |
| GET | `/api/patients` | Retrieve patient tickets | Authenticated staff |
| PATCH | `/api/patients/:id` | Update a ticket's status, department, or clinician summary | Authenticated staff |

The staff-only endpoints require a valid authenticated session. The health and session endpoints serve operational and session-checking purposes.

## Environment Configuration

These environment variables are configured through my local `.env` file and my hosting provider's environment settings.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Sets the runtime environment, such as `production` |
| `SESSION_SECRET` | Secret used to protect session data |
| `STAFF_USERNAME` | Configures the staff login username |
| `STAFF_PASSWORD_HASH` | Stores the bcrypt hash of the staff password |
| `DATA_FILE` | Optional path for the patient JSON data file |
| `PORT` | Port on which the server listens; hosting platforms commonly supply this value |

All secrets are kept out of source control and i use the hosting platform's environment-variable settings for production configuration.

## Deployment

The application has been deployed to a hosting platform that supports Node.js applications and persistent storage.

A deployment workflow using GitHub and Render is:

1. Push the latest project changes to GitHub repository.
2. Create a new web service on Render and connect the repository.
3. Configure the build command as `npm install`.
4. Configure the start command as `npm start`.
5. Add the required environment variables in the hosting dashboard.
6. Configure persistent storage and set `DATA_FILE` to a location on that persistent volume. (which is still to be completed)
7. Deploy the application and test the patient intake and staff dashboard workflows.

## Limitations

- **Rule-based triage:** The current prototype uses predefined rules and does not provide working AI-powered clinical summarisation.
- **Incomplete warning-sign coverage:** The keyword patterns cannot identify every emergency. The absence of a warning flag does not mean that a patient is safe.
- **No diagnosis:** The system is not a diagnostic tool and must not be used to make independent clinical decisions.
- **Demonstration storage:** JSON-file patient storage is intended for a small demo, not concurrent production workloads or multi-instance deployments.
- **Public intake endpoint:** Patient intake is publicly accessible in the demonstration. A real clinic implementation requires appropriate identity, consent, privacy, and access-control workflows.
- **Basic staff authentication:** The prototype's demonstration login is not suitable for production use without secure configuration and further authentication hardening.
- **Limited operational functionality:** Advanced clinic integrations, notifications, audit trails, reporting, and external electronic health record integrations are outside the current prototype scope.
- **Compliance and validation:** Clinical validation, privacy assessment, security testing, and applicable legal compliance must be completed before any real patient deployment.

## Security and Privacy

This project is intended for development, demonstration, and educational use.

- Use fictional patient information when testing.
- `.env`, passwords, API keys, session secrets, or real patient records are not commited
- Use strong staff credentials and secure session configuration.
- Enable HTTPS on deployed environments.
- Restrict access to staff-only functionality.
- Establish appropriate retention, backup, and access policies before storing sensitive information.
- Obtain qualified security, privacy, and clinical review before considering real-world use.

## Project Goals

Smart Patient Intake demonstrates practical software development concepts, including:

- Full-stack web application development
- REST API design
- Form handling and server-side processing
- Rule-based automation and department routing
- Session-based authentication
- Queue and ticket management
- Environment configuration and deployment preparation
- Version control and GitHub-based collaboration

## Future Improvements

Potential enhancements include:

- Integrating a properly configured AI service for structured summaries, with clinician review and validation.
- Introducing a production-grade database and persistent storage
- Implementing stronger staff authentication and role-based access control.
- Adding audit logging and operational reporting.
- Improving triage rules through appropriate clinical review and testing.
- Adding secure notifications and integrations with existing clinic systems.

## License

No license has been specified for this project.
