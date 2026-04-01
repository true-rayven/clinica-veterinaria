# Clinica Veterinaria de Figura
## Appointment & Scheduling System — Full Stack Prototype

> **Software Engineering I · BSCS 2B**  
> Bantug, Rayven · Bencito, Keith Janseen · Jauculan, Vince Ian · Orian, Chelsea · Sangcap, Alburj Benedict

---

## Tech Stack

| Layer     | Technology               |
|-----------|--------------------------|
| Frontend  | React 18 + React Router  |
| Backend   | Node.js + Express        |
| Database  | MySQL                    |
| Auth      | JWT + bcryptjs           |
| Styling   | Custom CSS (crimson brand)|

---

## Project Structure

```
clinica-veterinaria/
├── client/                  # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── logo.jpg         ← paste clinic logo here
│   └── src/
│       ├── components/
│       │   └── Topbar.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx     (Register + Verify)
│       │   ├── ForgotPassword.jsx
│       │   ├── Dashboard.jsx    (admin)
│       │   └── Pages.jsx        (Calendar, Book, Clients, Notifications, Profile, Report, ClientHome)
│       ├── App.jsx
│       ├── index.js
│       └── index.css
├── server/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── appointments.js
│   │   └── api.js
│   ├── index.js
│   └── package.json
├── database/
│   └── schema.sql           ← run this first
├── .env.example
├── package.json
└── README.md
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js v18+
- MySQL 8.0+
- Git

### 2. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/clinica-veterinaria.git
cd clinica-veterinaria
```

### 3. Set up the database
```bash
# Open MySQL and run the schema
mysql -u root -p < database/schema.sql
```
This creates the `clinica_veterinaria` database, all tables, and seeds:
- 1 admin account (`admin@clinica.com` / `password`)
- 6 services (Vaccination, Grooming, Check-up, Deworming, Dental, X-Ray)
- 3 blackout dates (Holy Week)

### 4. Configure environment
```bash
# Copy the example env file
cp .env.example .env
cp .env.example server/.env

# Edit server/.env with your MySQL credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=clinica_veterinaria
JWT_SECRET=any_random_secret_string
```

### 5. Install all dependencies
```bash
npm run install:all
```

### 6. Add the clinic logo
Copy the clinic logo image to:
```
client/public/logo.jpg
```

### 7. Run the development server
```bash
npm run dev
```
This starts both:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

---

## Default Login Credentials

### Admin
| Field    | Value               |
|----------|---------------------|
| Email    | admin@clinica.com   |
| Password | password            |

### Client
Register a new account at `/register` — you'll get a 6-digit verification code (check the backend console in dev mode).

---

## Pages & Features

| Page                  | Role   | SRS Ref        |
|-----------------------|--------|----------------|
| Login                 | Both   | R8, R9         |
| Register              | Client | R6, R14        |
| Email Verification    | Client | R10            |
| Forgot Password       | Client | R13            |
| Dashboard             | Admin  | R2, R3, R16    |
| Calendar              | Both   | R23, R24       |
| Book Appointment      | Client | R19, R20, R21  |
| My Appointments       | Client | R5, R21        |
| Client Records        | Admin  | R3, R4, R27    |
| Notifications         | Both   | R15–R18        |
| Profile               | Client | R6, R27        |
| Schedule Report       | Admin  | R4, R25        |
| Settings              | Admin  | R2             |

---

## API Endpoints

### Auth
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | /api/auth/register        | Register new client       |
| POST   | /api/auth/verify          | Verify account (R10)      |
| POST   | /api/auth/login           | Client login              |
| POST   | /api/auth/admin/login     | Admin login               |
| POST   | /api/auth/forgot-password | Password reset (R13)      |

### Appointments
| Method | Endpoint                         | Description                |
|--------|----------------------------------|----------------------------|
| GET    | /api/appointments                | List appointments          |
| GET    | /api/appointments/available      | Check slot availability    |
| POST   | /api/appointments                | Book appointment (R19,R20) |
| PATCH  | /api/appointments/:id/status     | Update status (admin)      |
| PATCH  | /api/appointments/:id/cancel     | Cancel with 24hr check     |
| PATCH  | /api/appointments/:id/reschedule | Reschedule (R21)           |

### Admin
| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /api/clients      | All clients (R27)    |
| GET    | /api/report       | Schedule report      |
| GET    | /api/dashboard    | Dashboard stats      |
| POST   | /api/blackouts    | Add blackout (R2)    |
| DELETE | /api/blackouts/:id| Remove blackout      |

---

## Collaboration Guide (for teammates)

```bash
# Each teammate works on their own branch
git checkout -b feature/your-name-feature

# After changes
git add .
git commit -m "feat: describe what you did"
git push origin feature/your-name-feature

# Create a Pull Request on GitHub
```

### Suggested task split:
| Member   | Module                              |
|----------|-------------------------------------|
| Member 1 | Login, Register, Verify pages       |
| Member 2 | Dashboard, Admin controls           |
| Member 3 | Calendar, Book Appointment          |
| Member 4 | Client Records, Report              |
| Member 5 | Notifications, Profile, Settings    |

---

## Security Notes
- Passwords are hashed with **bcryptjs** (R11)
- All protected routes require a **JWT token** (R8)
- Account lockout after 3 failed attempts — implement in frontend counter (R12)
- 24-hour cancellation policy enforced on backend (R21)
- Email/SMS verification required on registration (R10)

---

*Built for Software Engineering I — BSCS 2B, AY 2024–2025*
