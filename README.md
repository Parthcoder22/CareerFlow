# CareerFlow 🚀
**AI-Powered Placement Management System**

Stop juggling Excel sheets, WhatsApp groups, scattered notes, and missing deadlines. CareerFlow centralizes your entire placement journey into one powerful, AI-driven platform.

![CareerFlow Dashboard](https://via.placeholder.com/1000x500?text=CareerFlow+Dashboard)

## ✨ Features

- **Smart Dashboard:** Track your applications, OAs, and interviews in one beautiful interface with real-time charts and success rate analytics.
- **AI Job Description Analyzer:** Powered by Google Gemini. Paste any JD and instantly get the required skills, missing skills tips, resume improvement suggestions, likely interview questions, and a customized learning roadmap.
- **Resume Manager:** Upload and manage multiple tailored versions of your PDF resumes via Cloudinary. Link specific resumes to specific applications.
- **Interview Journal:** A personal diary to record questions asked, your experience, mistakes, and topics to revise for future interviews.
- **Experience Portal:** An anonymous community feed where students can share placement experiences, and others can like or bookmark them.
- **Automated Smart Reminders:** A built-in cron scheduler automatically sends email reminders for upcoming Online Assessments (OAs), Interviews, and deadlines so you never miss an opportunity.
- **Admin Panel:** For placement cell coordinators to view overarching statistics, track selected students, and manage the verified company database.
- **Premium UI:** Designed with Tailwind v4, Framer Motion, and Glassmorphism for a sleek, responsive, and dark-mode native experience.

## 💻 Tech Stack

### Frontend
- **Framework:** React.js (via Vite)
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router DOM
- **Forms & Validation:** React Hook Form
- **API Client:** Axios
- **Animations:** Framer Motion
- **Icons:** Lucide React & React Icons
- **Charts:** Recharts

### Backend
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon Serverless) - Accessed via `pg` pool
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt
- **File Uploads:** Multer & Cloudinary
- **AI Integration:** Google Generative AI (Gemini)
- **Email Service:** Nodemailer
- **Background Tasks:** Node-Cron

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (e.g., Neon)
- Cloudinary Account
- Google Gemini API Key
- SMTP Server (e.g., Gmail App Passwords) for emails

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/careerflow.git
cd careerflow
```

### 2. Setup Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```
Run the database initialization script:
```bash
npm run db:init
npm run db:seed  # Optional: Adds a test admin and student
```
Start the server:
```bash
npm run dev
```

### 3. Setup Frontend
Open a new terminal window:
```bash
cd client
npm install
```
Start the development server:
```bash
npm run dev
```

## 📂 Project Structure
```text
careerflow/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI, Layouts, Skeletons
│   │   ├── context/        # Global State (Auth, Theme)
│   │   ├── pages/          # Full page views (Dashboard, AI Analyzer, etc.)
│   │   ├── services/       # Axios API integration
│   │   ├── utils/          # Helper functions & Constants
│   │   ├── App.jsx         # Main router
│   │   └── index.css       # Tailwind v4 configuration & base styles
│   └── vite.config.js      # Vite configuration & proxy
├── server/                 # Node.js Backend
│   ├── config/             # DB, Cloudinary, Email setup
│   ├── controllers/        # Business logic for endpoints
│   ├── database/           # SQL schemas and seeders
│   ├── middleware/         # Auth, Role, Validation, Rate Limiting
│   ├── routes/             # Express routers
│   ├── services/           # AI, Email, Cron services
│   ├── utils/              # Backend helpers
│   └── server.js           # Express entry point
├── INTERVIEW_README.md     # In-depth technical decisions and architecture guide
└── README.md
```

## 📝 License
This project is licensed under the MIT License.
