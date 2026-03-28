<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&pause=1000&color=4F8EF7&center=true&vCenter=true&width=600&lines=Aariva+%F0%9F%A9%BA;Disability+Management+System;Built+by+Siddharth+Kumar" alt="Typing SVG" />

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

<br/>

> **Aariva** is a full-stack web application that manages the end-to-end lifecycle of disability cases — from submission and medical evaluation to admin decisions and live status tracking.

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Aariva-4F8EF7?style=for-the-badge)](https://aariva.onrender.com)

</div>

---

## 🗂️ Project Structure

```
aariva/
├── client/
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── auth.js          ← Login, OTP flow, register
│   │       ├── case.js          ← Case submission, tracking, print
│   │       ├── dashboard.js     ← Case worker dashboard
│   │       ├── chatbot.js       ← Floating AI assistant widget
│   │       └── utils.js         ← API helper, auth guard, notifications
│   └── pages/
│       ├── intro.html           ← Animated splash screen
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html
│       ├── submit-case.html
│       ├── track-case.html
│       ├── evaluation.html
│       └── admin.html
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── app.js
├── uploads/
├── .env
└── package.json
```

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Role-Based Access** | Applicant · Case Worker · Doctor · Admin |
| 2 | **OTP Two-Factor Auth** | Email OTP via EmailJS, 5-min expiry |
| 3 | **Case Submission Wizard** | 4-step form with drag & drop upload |
| 4 | **Live Status Tracking** | Timeline: Submitted → Verified → Evaluated → Decision |
| 5 | **Medical Evaluations** | Doctors submit diagnosis reports per case |
| 6 | **Admin Dashboard** | Filter, approve, reject, clarify cases |
| 7 | **AI Chat Assistant** | Floating Aari bot powered by Groq LLaMA |
| 8 | **Audit Logs** | Every action timestamped and logged |
| 9 | **Auto Escalation** | Cases pending 7+ days are auto-flagged |
| 10 | **Animated Intro Screen** | Cinematic splash with particles on load |

---

## 🔄 System Flow

```mermaid
flowchart TD
    A([User Visits Site]) --> B[Animated Intro Screen]
    B --> C[Login or Register]
    C --> D{OTP Verified?}
    D -- No --> C
    D -- Yes --> E{User Role}
    E -- Applicant --> F[View Case Status]
    E -- CaseWorker --> G[Submit New Case]
    E -- Doctor --> H[Submit Evaluation]
    E -- Admin --> I[Admin Dashboard]
    G --> J[4-Step Wizard]
    J --> K[(MongoDB)]
    H --> L[Medical Report]
    L --> K
    I --> M{Admin Action}
    M -- Approve --> N[Case Approved]
    M -- Reject --> O[Case Rejected]
    M -- Clarify --> P[Back to Worker]
    K --> Q[Notifications]
    Q --> F

    style A fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style B fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style C fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style D fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style E fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style F fill:#0e0f14,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style G fill:#0e0f14,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style H fill:#0e0f14,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style I fill:#0e0f14,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style J fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style K fill:#166534,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style L fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style M fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style N fill:#166534,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style O fill:#7f1d1d,color:#ffffff,stroke:#ef4444,stroke-width:2px
    style P fill:#1e3a5f,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style Q fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
```

---

## 👥 Role Access Map

```mermaid
flowchart LR
    A([Applicant]) --> A1[View Case Status]
    A --> A2[Receive Notifications]
    B([Case Worker]) --> B1[Submit Cases]
    B --> B2[Upload Documents]
    B --> B3[View Own Cases]
    C([Doctor]) --> C1[View Assigned Cases]
    C --> C2[Submit Evaluations]
    D([Admin]) --> D1[Approve or Reject]
    D --> D2[Request Clarification]
    D --> D3[View Audit Logs]
    D --> D4[Full Dashboard]

    style A fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style B fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style C fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style D fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style A1 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style A2 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style B1 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style B2 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style B3 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style C1 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style C2 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style D1 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style D2 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style D3 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style D4 fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS {
        ObjectId _id
        string name
        string email
        string password
        string role
        array notifications
    }
    CASES {
        ObjectId _id
        ObjectId submittedBy
        object applicant
        object disability
        array documents
        string caseStatus
        boolean resolvedFlag
        date createdAt
    }
    EVALUATIONS {
        ObjectId _id
        ObjectId caseId
        ObjectId doctorId
        string diagnosis
        string report
        date submittedAt
    }
    DECISIONS {
        ObjectId _id
        ObjectId caseId
        ObjectId adminId
        string decision
        string remarks
        date decidedAt
    }
    LOGS {
        ObjectId _id
        ObjectId caseId
        ObjectId userId
        string action
        date timestamp
    }

    USERS ||--o{ CASES : submits
    CASES ||--o| EVALUATIONS : has
    CASES ||--o| DECISIONS : receives
    CASES ||--o{ LOGS : generates
    USERS ||--o{ LOGS : performs
```

---

## 🔌 API Reference

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Validate credentials, send OTP |
| POST | `/api/auth/verify-otp` | Public | Finalize session |
| GET | `/api/auth/me` | Protected | Get current user |
| POST | `/api/auth/logout` | Protected | Destroy session |
| POST | `/api/cases/submit` | Case Worker | Submit new case |
| GET | `/api/cases/my-cases` | Case Worker | List own cases |
| GET | `/api/cases/:id` | Protected | Get case detail |
| GET | `/api/cases/track/:id` | Public | Track case status |
| GET | `/api/admin/cases` | Admin | All cases with filters |
| POST | `/api/admin/cases/:id/approve` | Admin | Approve with remarks |
| POST | `/api/admin/cases/:id/reject` | Admin | Reject with remarks |
| POST | `/api/admin/cases/:id/clarify` | Admin | Request clarification |
| GET | `/api/admin/logs` | Admin | Full audit log |
| POST | `/api/evaluation/:id/submit` | Doctor | Submit evaluation |
| GET | `/api/evaluation/pending` | Doctor | Pending evaluations |
| POST | `/api/chat` | Protected | AI chat via Groq |

---

## 🔁 Login Sequence

```mermaid
sequenceDiagram
    actor U as User
    participant B as Browser
    participant S as Express Server
    participant DB as MongoDB
    participant E as EmailJS

    U->>B: Enter email and password
    B->>S: POST /api/auth/login
    S->>DB: findOne by email
    DB-->>S: User document
    S->>S: bcrypt.compare password
    S-->>B: 200 Credentials OK
    B->>E: Trigger OTP email
    E-->>U: OTP code in inbox
    U->>B: Enter OTP
    B->>S: POST /api/auth/verify-otp
    S->>S: Validate session match
    S->>DB: findById pendingUserId
    DB-->>S: User confirmed
    S-->>B: 200 Session created
    B-->>U: Redirect to Dashboard
```

---

## 📋 Case Lifecycle Sequence

```mermaid
sequenceDiagram
    actor CW as Case Worker
    actor DR as Doctor
    actor AD as Admin
    participant S as Server
    participant DB as MongoDB

    CW->>S: POST /api/cases/submit
    S->>DB: Save case status Submitted
    DB-->>S: Case ID created
    S-->>CW: 201 Case created

    AD->>S: GET /api/admin/cases
    S->>DB: Fetch all cases
    DB-->>S: Cases list
    S-->>AD: Cases with filters

    AD->>S: Update status Under Review
    S->>DB: findByIdAndUpdate
    DB-->>S: Updated

    DR->>S: GET /api/evaluation/pending
    S->>DB: Fetch pending cases
    DB-->>S: Case list
    S-->>DR: Assigned cases

    DR->>S: POST /api/evaluation/:id/submit
    S->>DB: Save evaluation report
    DB-->>S: Saved
    S-->>DR: 201 Evaluation submitted

    AD->>S: POST /api/admin/cases/:id/approve
    S->>DB: Update status Approved
    DB-->>S: Updated
    S->>DB: Create Decision record
    S->>DB: Create Log entry
    S->>DB: Push notification to user
    S-->>AD: 200 Approved

    CW->>S: GET /api/cases/:id
    S->>DB: findById with decision
    DB-->>S: Full case document
    S-->>CW: Case details and status
```

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph CLIENT["Client Layer"]
        UI[HTML Pages]
        JS[JS Modules]
        CB[Chatbot Widget]
    end

    subgraph SERVER["Server Layer - Express.js"]
        MW[Auth Middleware]
        AR[Auth Routes]
        CR[Case Routes]
        ER[Eval Routes]
        ADR[Admin Routes]
        CHR[Chat Routes]
    end

    subgraph CTRL["Controller Layer"]
        AC[authController]
        CC[caseController]
        EC[evalController]
        ADC[adminController]
        CHC[chatController]
    end

    subgraph MODELS["Model Layer - Mongoose"]
        UM[User]
        CM[Case]
        EVM[Evaluation]
        DM[Decision]
        LM[Log]
    end

    subgraph EXT["External Services"]
        DB[(MongoDB Atlas)]
        GROQ[Groq LLaMA API]
        EJS[EmailJS OTP]
        MU[Multer Uploads]
    end

    CLIENT --> SERVER
    MW --> AR & CR & ER & ADR & CHR
    AR --> AC
    CR --> CC
    ER --> EC
    ADR --> ADC
    CHR --> CHC
    AC & CC & EC & ADC --> MODELS
    MODELS --> DB
    CHC --> GROQ
    AC --> EJS
    CC --> MU

    style CLIENT fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style SERVER fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CTRL fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style MODELS fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style EXT fill:#0e0f14,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style UI fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style JS fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CB fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style MW fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style AR fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CR fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style ER fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style ADR fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CHR fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style AC fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CC fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style EC fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style ADC fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CHC fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style UM fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style CM fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style EVM fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style DM fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style LM fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style DB fill:#166534,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style GROQ fill:#7f1d1d,color:#ffffff,stroke:#ef4444,stroke-width:2px
    style EJS fill:#1e3a5f,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style MU fill:#22243a,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- EmailJS account (free — 200 emails/month)
- Groq API key (free)

### Installation

```bash
git clone https://github.com/your-username/aariva.git
cd aariva
npm install
```

### Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

### EmailJS Setup

Create `client/assets/js/config.js` and add to `.gitignore`:

```javascript
const EMAILJS_CONFIG = {
  publicKey:  'your_public_key',
  serviceId:  'your_service_id',
  templateId: 'your_template_id'
};
```

### Run

```bash
npm start
# Visit http://localhost:5000
```

---

## 🚀 Deploy to Render

```mermaid
flowchart LR
    A([Local Code]) -->|git push| B[GitHub Repo]
    B -->|Auto Deploy| C[Render Service]
    C --> D[(MongoDB Atlas)]
    C --> E[Groq API]
    C --> F[EmailJS]

    style A fill:#0e0f14,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style B fill:#1a1b23,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
    style C fill:#166534,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style D fill:#166534,color:#ffffff,stroke:#22c55e,stroke-width:2px
    style E fill:#7f1d1d,color:#ffffff,stroke:#ef4444,stroke-width:2px
    style F fill:#1e3a5f,color:#ffffff,stroke:#4f8ef7,stroke-width:2px
```

| Setting | Value |
|---------|-------|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server/app.js` |
| Plan | Free |

Add in Render Environment tab: `MONGO_URI` · `SESSION_SECRET` · `GROQ_API_KEY` · `NODE_ENV=production`

---

<div align="center">

**Developed by [Siddharth Kumar](https://siddharthkumar.tech)**

*VIT Vellore · Full Stack Developer · MERN Stack*

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=your-username.aariva)

</div>
