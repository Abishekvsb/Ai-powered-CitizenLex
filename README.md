# CitizenLex – AI-Powered Legal Research & Citizen Rights Assistant

CitizenLex is a comprehensive full-stack legal-tech web application that democratizes access to legal information. It features a ChatGPT-style conversational assistant (supporting English and Tamil), a Document Analyzer for summarization, a Rights Explorer, a Government Scheme Finder, and an Admin Dashboard.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Bootstrap 5, Axios, React Router, Chart.js, Vanilla CSS styling (Glassmorphism & Dark/Light mode support).
- **Backend:** Spring Boot 3.2.5, Spring Security 6, Spring Data JPA, JWT Authentication, Maven.
- **Database:** MySQL 8.
- **AI Engine:** OpenAI-compatible API Integration (with local simulation fallback).

---

## 📂 Project Structure

```
cit app/
├── docker-compose.yml          # Connects MySQL, Backend, and Frontend containers
├── README.md                   # Setup details and API docs
├── backend/
│   ├── Dockerfile              # Multi-stage Java compile & packaging environment
│   ├── pom.xml                 # Maven dependency manifests
│   └── src/main/java/com/citizenlex/
│       ├── CitizenLexApplication.java
│       ├── config/             # Spring Security and MVC configurations
│       ├── controllers/        # Auth, Chat, Rights, Scheme, Document, Admin REST APIs
│       ├── dtos/               # Request/Response data contracts
│       ├── entities/           # JPA model mapping rules
│       ├── exceptions/         # Global controllers advice handlers
│       ├── repositories/       # JPA Database access layer interfaces
│       ├── security/           # JWT Tokens parsers and UserDetails providers
│       └── services/           # Business logic cores (including PDF/Word parsing)
└── frontend/
    ├── Dockerfile              # Production Nginx image serving Vite build assets
    ├── nginx.conf              # SPA route rewriting controls
    ├── package.json            # Node dependency registry
    ├── vite.config.js          # Vite developer options
    ├── index.html              # HTML bootstrapper
    └── src/                    # Components, Pages, Context Hooks, and Main CSS styles
```

---

## 🚀 Getting Started

Ensure you have **Docker** and **Docker Compose** installed on your system.

### Option 1: Run with AI Simulation Fallback (Offline Mode)
Launch the application immediately without providing any API keys:
```bash
docker-compose up --build
```

### Option 2: Run with Live OpenAI API
Provide your API Key to enable real OpenAI-powered chat and document analysis:
```bash
OPENAI_API_KEY="your-api-key" docker-compose up --build
```
*(Optionally provide custom values for `OPENAI_API_URL` and `OPENAI_API_MODEL` if utilizing alternative compatible engines such as local Ollama, DeepSeek, or Groq).*

Once the build completes and containers are healthy:
- **Frontend URL:** [http://localhost](http://localhost) (Port 80)
- **Backend API URL:** [http://localhost:8080/api](http://localhost:8080/api)

### 🔑 Default Credentials

- **Admin Email:** `admin@citizenlex.com`
- **Admin Password:** `Admin@123`

*(Note: On startup, the database tables will be generated automatically and pre-seeded with sample categories, rights, schemes, and the admin profile).*

---

## 📡 REST API Documentation

### 1. Authentication

#### Sign In (`POST /api/auth/login`)
- **Request Example:**
  ```json
  {
    "email": "admin@citizenlex.com",
    "password": "Admin@123"
  }
  ```
- **Response Example:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "email": "admin@citizenlex.com",
      "firstName": "Admin",
      "lastName": "CitizenLex",
      "role": "ROLE_ADMIN",
      "createdAt": null
    }
  }
  ```

---

### 2. AI Chat Assistant

#### Ask AI (`POST /api/chat`)
- **Request Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Example:**
  ```json
  {
    "message": "What is the Right to Education?",
    "language": "en"
  }
  ```
- **Response Example:**
  ```json
  {
    "id": 3,
    "message": "What is the Right to Education?",
    "response": "Under the Right to Education (RTE) Act, 2009...",
    "language": "en",
    "createdAt": "2026-06-16T21:40:00"
  }
  ```

---

### 3. Document Analyzer

#### Analyze Legal Document (`POST /api/documents/upload`)
- **Request Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Payload:** Form-data containing key `file` (multipart file stream: PDF, DOCX, JPG, PNG).
- **Response Example:**
  ```json
  {
    "id": 12,
    "fileName": "LeaseAgreement.pdf",
    "fileType": "application/pdf",
    "extractedText": "LEASE CONTRACT AGREEMENT...",
    "summary": "### 📑 Legal Document Analysis Report\n\n- **Termination Clause:** 30-day notice required...",
    "uploadedAt": "2026-06-16T21:45:00"
  }
  ```

---

### 4. Admin Analytics

#### Fetch Dashboard Stats (`GET /api/admin/analytics`)
- **Request Header:** `Authorization: Bearer <JWT_TOKEN>` (Requires `ROLE_ADMIN`)
- **Response Example:**
  ```json
  {
    "totalUsers": 5,
    "totalRights": 8,
    "totalSchemes": 4,
    "totalDocuments": 12,
    "totalChats": 25
  }
  ```
