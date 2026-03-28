# Aariva — Disability Management & Tracking System

A full-stack web application to manage the end-to-end lifecycle of disability cases — from submission and medical evaluation to admin decisions and status tracking.

> **Stack:** Node.js · Express · MongoDB · Vanilla JavaScript · HTML/CSS

---

## 📁 Project Structure

```
aariva/
├── client/
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── auth.js          # Login, OTP flow, register
│   │       ├── case.js          # Case submission, tracking, print summary
│   │       ├── dashboard.js     # Case worker dashboard
│   │       ├── utils.js         # API helper, auth guard, notifications, badges
│   │       └── config.js        # EmailJS credentials (add to .gitignore)
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html
│       ├── submit-case.html     # 4-step wizard with drag & drop upload
│       ├── track-case.html
│       ├── evaluation.html
│       └── admin.html
├── server/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── caseController.js
│   │   ├── evaluationController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js              # protect + requireRole middleware
│   │   └── upload.js            # Multer config
│   ├── models/
│   │   ├── User.js
│   │   ├── Case.js              # DisabilitySchema extracted (see schema notes)
│   │   ├── Evaluation.js
│   │   ├── Decision.js
│   │   └── Log.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── caseRoutes.js
│   │   ├── evaluationRoutes.js
│   │   └── adminRoutes.js
│   └── app.js
├── uploads/
├── .env
├── package.json
└── README.md
```

---

## ✅ Features

1. **User Registration & Login** — Role-based access (Applicant, Case Worker, Doctor, Admin)
2. **Two-Factor Login (OTP)** — Email OTP via EmailJS on every login, with 5-min expiry and resend cooldown
3. **Disability Case Submission** — 4-step wizard (Personal → Disability → Documents → Review)
4. **Document Upload** — Drag & drop or click-to-browse; PDF/JPG/PNG up to 10MB each via Multer
5. **Form Validation** — Client-side step validation with error summary panel + server-side field checks
6. **Case Status Tracking** — Timeline progress bar (Submitted → Verified → Evaluated → Decision)
7. **Medical Evaluation Submission** — Doctors review cases, add diagnosis and evaluation reports
8. **Admin Review Dashboard** — Admins filter cases by status/severity and take decisions
9. **Approve / Reject with Remarks** — Written justification required for all decisions
10. **Clarification Requests** — Admins can flag a case and request more information from the case worker
11. **Notifications Panel** — Users receive status update alerts on their dashboard
12. **Role-Based Dashboards** — Separate views per role with auth-guarded routes
13. **Audit Logs** — All actions (create, approve, reject, clarify, eval, note, escalate) logged with timestamps
14. **Case Summary Report** — Printable full case history with evaluation and decision details
15. **Escalation for Delays** — Cases pending beyond 7 days are auto-flagged
16. **Session Management** — Secure sessions with logout and 2-hour timeout

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- EmailJS account (free tier — 200 emails/month)

### Installation

```bash
git clone https://github.com/your-username/aariva.git
cd aariva
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aariva
SESSION_SECRET=your_secret_key
```

### EmailJS Setup

Create `client/assets/js/config.js` and add it to `.gitignore`:

```javascript
const EMAILJS_CONFIG = {
  publicKey:  'your_public_key',
  serviceId:  'your_service_id',
  templateId: 'your_template_id'
};
```

OTP email template variables: `{{to_email}}`, `{{to_name}}`, `{{otp_code}}`, `{{expiry_minutes}}`

> **Note:** EmailJS is loaded only on the login page. It is not a dependency of the dashboard or any other page — do not add the unpkg CDN script tag to other pages as browser Tracking Prevention will block it.

### Run the App

```bash
npm start
```

Visit `http://localhost:5000`

---

## 👥 User Roles

| Role        | Access                                                        |
|-------------|---------------------------------------------------------------|
| Applicant   | View case status, receive notifications                       |
| Case Worker | Submit cases, upload documents, view own submitted cases      |
| Doctor      | Review assigned cases, submit medical evaluations             |
| Admin       | Approve/reject/clarify cases, view audit logs, full dashboard |

---

## 🗄️ Database Collections

| Collection    | Purpose                                        |
|---------------|------------------------------------------------|
| `users`       | Auth credentials, roles, notifications array   |
| `cases`       | Disability case records                        |
| `evaluations` | Medical evaluation reports                     |
| `decisions`   | Admin approve/reject records                   |
| `logs`        | System activity and audit trail                |

---

## 🔌 API Routes

### Auth — `/api/auth`
| Method | Path                        | Access     | Description                        |
|--------|-----------------------------|------------|------------------------------------|
| POST   | `/register`                 | Public     | Register new user                  |
| POST   | `/login`                    | Public     | Validate credentials, trigger OTP  |
| POST   | `/verify-otp`               | Public     | Finalize session after OTP         |
| GET    | `/me`                       | Protected  | Return current session user        |
| POST   | `/logout`                   | Protected  | Destroy session                    |
| GET    | `/notifications`            | Protected  | Fetch user notifications           |
| PATCH  | `/notifications/read`       | Protected  | Mark all notifications as read     |

### Cases — `/api/cases`
| Method | Path                        | Access          | Description                        |
|--------|-----------------------------|-----------------|------------------------------------|
| POST   | `/submit`                   | Case Worker     | Submit new case (multipart/form)   |
| GET    | `/my-cases`                 | Case Worker     | Cases submitted by current user    |
| GET    | `/:id`                      | Protected       | Get single case detail             |
| GET    | `/track/:id`                | Public/Protected| Track case status                  |
| POST   | `/:id/notes`                | Protected       | Add inline note to case            |

### Admin — `/api/admin`
| Method | Path                        | Access | Description                             |
|--------|-----------------------------|--------|-----------------------------------------|
| GET    | `/cases`                    | Admin  | All cases with filter (status/severity) |
| POST   | `/cases/:id/approve`        | Admin  | Approve case with remarks               |
| POST   | `/cases/:id/reject`         | Admin  | Reject case with remarks                |
| POST   | `/cases/:id/clarify`        | Admin  | Request clarification from case worker  |
| GET    | `/cases/:id/summary`        | Admin  | Full printable case summary             |
| GET    | `/logs`                     | Admin  | Audit log with optional filters         |

### Evaluation — `/api/evaluation`
| Method | Path                        | Access | Description                        |
|--------|-----------------------------|--------|------------------------------------|
| POST   | `/:id/submit`               | Doctor | Submit medical evaluation          |
| GET    | `/pending`                  | Doctor | Cases awaiting evaluation          |

---

## 📌 Schema Notes

### `Case.js` — `disability` field
The `disability` sub-document uses a **named sub-schema** (`DisabilitySchema`) to avoid a Mongoose reserved-word conflict. Do **not** inline `disability: { type: String, ... }` — Mongoose interprets `type` as a schema type declaration, not a field name, and will cast the entire object as a String.

```javascript
// ✅ Correct — uses named sub-schema
const DisabilitySchema = new mongoose.Schema({
  disabilityType: String,   // named disabilityType, NOT type
  severity:       String,
  onsetDate:      String,
  affectedAreas:  String,
  description:    String,
  treatment:      String,
}, { _id: false });
```

The controller maps the frontend field `disability.type` → `disability.disabilityType` on save:

```javascript
disability: {
  disabilityType: disability.type,  // frontend sends .type, schema stores .disabilityType
  ...
}
```

### Admin controller — `c.save()` vs `findByIdAndUpdate`
All admin status-change operations (`approve`, `reject`, `clarify`) use `findByIdAndUpdate` with `{ runValidators: false }` instead of `c.save()`. This prevents full-document revalidation from failing on legacy records that predate required-field schema additions.

---

## 🛠️ Bug Fixes Log (March 2026)

### Round 1 — Dashboard infinite redirect loop

**Problem:** Clicking dashboard caused the browser to hang indefinitely.

**Root cause:** `requireAuth()` in `utils.js` redirected unauthenticated users to `/login.html` and wrong-role users to `/dashboard.html`. Express has no routes for `.html` paths — only alias routes (`/login`, `/dashboard`). This caused a redirect loop: the page reloaded, re-ran `requireAuth`, failed again, redirected to the same missing route, and repeated until the browser gave up.

**Files fixed:**
- `client/assets/js/utils.js` — changed all redirects from `.html` paths to alias routes (`/login`, `/dashboard`, `/admin`, `/evaluation`, `/track-case`)
- `client/assets/js/utils.js` — wrong-role redirect now sends users to their own role's route instead of looping back to `/dashboard`
- `client/assets/js/dashboard.js` — removed `requireAuth(['caseworker'])` role restriction that was looping all non-caseworker roles
- `client/assets/js/dashboard.js` — `viewSummary()` changed from `/track-case.html?id=` to `/track-case?id=`
- `client/assets/js/auth.js` — register success redirect changed from `/login.html` to `/login`

---

### Round 2 — File browse dialog not opening

**Problem:** Clicking the upload zone on Step 3 of case submission did nothing — no file picker appeared.

**Root cause:** The original pattern placed `<input type="file">` inside the dropzone div with `position:absolute; inset:0; opacity:0`. Child elements (`<div class="icon">`, `<p>`) rendered on top of the input in the stacking order, intercepting all click events before they reached the input.

**Fix in `submit-case.html`:**
- Moved `<input type="file" id="fileInput">` **outside** the dropzone div entirely, with `display:none`
- Added `dropzone.addEventListener('click', () => fileInput.click())` to trigger it programmatically
- Added `fileInput.value = ''` reset after each selection so the same file can be removed and re-added
- Fixed success page links from `/dashboard.html` and `/track-case.html` to `/dashboard` and `/track-case`

---

### Round 3 — Case submission 500 error

**Problem:** `POST /api/cases/submit` returned 500. Terminal showed: `Cast to string failed for value "{type: 'Physical Disability', ...}" at path "disability"`.

**Root cause:** The `Case.js` schema had:
```javascript
disability: {
  type: String,   // Mongoose reads this as: disability IS a String field
  severity: ...   // all other keys ignored
}
```
Mongoose's schema DSL treats `{ type: X }` as a type declaration, not a nested object with a field named `type`. So `disability` was registered as a `String`, and saving an object to it threw a cast error.

**Files fixed:**
- `server/models/Case.js` — extracted a `DisabilitySchema` with field renamed to `disabilityType`
- `server/controllers/caseController.js` — maps `disability.type` (frontend) → `disability.disabilityType` (schema)
- `client/assets/js/dashboard.js` — table column reads `c.disability?.disabilityType` instead of `c.disability?.type`

---

### Round 4 — Admin clarify/approve/reject 500 error

**Problem:** `POST /api/admin/cases/:id/clarify` returned 500. Terminal showed: `Case validation failed: applicant.lastName: required, applicant.firstName: required`.

**Root cause:** Admin handlers retrieved a case with `Case.findById()` then called `c.save()` to update the status. `c.save()` triggers full Mongoose document validation. Cases submitted before the schema fix (Round 3) were stored without `applicant.firstName`/`lastName` and failed revalidation when any admin action was attempted.

**Fix in `server/controllers/adminController.js`:**

All three handlers replaced `c.save()` with `Case.findByIdAndUpdate(..., { runValidators: false })`:

```javascript
// approveCase
await Case.findByIdAndUpdate(
  req.params.id,
  { $set: { caseStatus: 'Approved', resolvedFlag: true } },
  { runValidators: false }
);

// rejectCase
await Case.findByIdAndUpdate(
  req.params.id,
  { $set: { caseStatus: 'Rejected', resolvedFlag: true } },
  { runValidators: false }
);

// requestClarification
await Case.findByIdAndUpdate(
  req.params.id,
  { $set: {
    caseStatus: 'Clarification Requested',
    'clarificationRequest.requestedBy': ...,
    'clarificationRequest.details': ...,
    'clarificationRequest.requestedAt': new Date(),
    'clarificationRequest.resolved': false,
  }},
  { runValidators: false }
);
```

Also switched `requestClarification` to use `.lean()` on the initial `findById` since the document is no longer mutated directly.

---

## ⚠️ Known Caveats

- **Legacy case records** — Cases submitted before the `DisabilitySchema` fix will have `disability` stored as a plain string (or missing sub-fields). These can be read but not cleanly displayed in the disability type column. A one-time migration or re-submission is needed for affected records.
- **Legacy user passwords** — Users registered during a double-hash regression window may fail login. They should re-register or have their password reset.
- **EmailJS tracking block** — Some browsers (Edge, Firefox with Tracking Prevention enabled) block the EmailJS unpkg CDN script. The script is only loaded on the login page. If OTP sending fails silently, check the browser console for `Tracking Prevention blocked access to storage` warnings and disable tracking prevention for `localhost` during development.
- **`punycode` deprecation warning** — This is a Node.js v24 warning from a transitive dependency. It does not affect functionality and will resolve when the dependency updates.