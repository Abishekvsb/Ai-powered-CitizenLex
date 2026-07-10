<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=Abishek&fontSize=60&fontColor=ffffff&animation=twinkling&fontAlignY=38&desc=Full-Stack%20Software%20Engineer%20%7C%20Legal-Tech%20Builder%20%7C%20AI%20Enthusiast&descAlignY=60&descSize=16" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=6366F1&center=true&vCenter=true&width=700&lines=Building+AI-Powered+Legal+Tech+for+India+%F0%9F%87%AE%F0%9F%87%B3;Spring+Boot+%2B+React+%2B+Gemini+AI;Making+Justice+Accessible+to+Every+Citizen;Always+Learning%2C+Always+Building+%F0%9F%9A%80)](https://git.io/typing-svg)

<p align="center">
  <a href="https://linkedin.com/in/abishekvsb"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a>
  <a href="mailto:abishekvsb@gmail.com"><img src="https://img.shields.io/badge/Gmail-EA4335?style=for-the-badge&logo=gmail&logoColor=white"/></a>
  <a href="https://github.com/Abishekvsb"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a>
  <img src="https://komarev.com/ghpvc/?username=Abishekvsb&label=Profile+Views&color=6366f1&style=for-the-badge"/>
</p>

</div>

---

## 🧑‍💻 About Me

```yaml
name: Abishek k
title: Full-Stack Software Engineer
location: Tamil Nadu, India 🇮🇳
currently_building:
  - CitizenLex — AI-Powered Legal Research Platform
  - AI document intelligence with Gemini 2.5 Flash
  - Production-grade Java microservices
focus_areas:
  - Backend: Java 17, Spring Boot 3, REST APIs, Spring Security, JPA/Hibernate
  - Frontend: React 18, Vite, PWA, Three.js, GSAP animations
  - AI/ML: Google Gemini, OCR (Tesseract.js), NLP legal reasoning
  - DevOps: Docker, Railway, Vercel, GitHub Actions CI/CD
  - Database: MySQL 8, Spring Data JPA, HikariCP connection pooling
interests:
  - Legal Technology & Access to Justice
  - AI Engineering & Prompt Engineering
  - System Design & Architecture
  - Open Source Contributions
```

---

## 🚀 Live Demo

| | |
|---|---|
| 🌐 **Production Website** | https://ai-powered-citizen-lex.vercel.app |
| ⚙️ **Backend API** | https://ai-powered-citizenlex-production.up.railway.app |
| 📦 **GitHub Repository** | https://github.com/Abishekvsb/Ai-powered-CitizenLex |

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure login, registration, and token-based session management |
| 🤖 **AI Legal Assistant** | Conversational legal guidance powered by Google Gemini AI |
| ⚖️ **AI Legal Copilot** | Step-by-step legal reasoning and case analysis with Gemini 2.5 Flash |
| 📚 **Rights Explorer** | Browse fundamental rights organized by domain and category |
| 🏛️ **Government Scheme Finder** | Discover and filter government welfare schemes by eligibility |
| 📝 **AI Legal Draft Generator** | Auto-generate FIRs, RTIs, complaints, contracts, and affidavits |
| 👨‍⚖️ **Lawyer Marketplace** | Find and book verified advocates across 38 Tamil Nadu districts |
| 🔍 **OCR Document Scanner** | Upload and extract text from legal documents using Tesseract.js |
| 📊 **Dashboard & Analytics** | Personalized user dashboard with activity and case summaries |
| 🔔 **Notifications** | Real-time in-app notification system with unread badge counts |
| 📱 **Responsive UI** | Mobile-first design that adapts seamlessly across all screen sizes |
| 📲 **Progressive Web App (PWA)** | Installable on desktop and Android; supports offline access |

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Bootstrap 5, GSAP, Three.js, Axios |
| **Backend** | Java 17, Spring Boot 3.2.5, Spring Security, Spring Data JPA, Hibernate |
| **Authentication** | JWT (JSON Web Tokens), BCrypt password encoding |
| **Database** | MySQL 8 (Railway Cloud) |
| **AI & ML** | Google Gemini 2.5 Flash, Tesseract.js OCR, Apache PDFBox, Apache POI |
| **Storage** | Cloudinary CDN (profile photos and media) |
| **Maps** | Google Maps JavaScript API + Geocoding API |
| **Payments** | Razorpay SDK |
| **Video** | Jitsi Meet (WebRTC) |
| **Deployment** | Vercel (Frontend) + Railway (Backend + Database) |
| **CI/CD** | GitHub Actions (Java CI/CD + CodeQL Security Analysis) |
| **Version Control** | Git & GitHub |

---

## 🏗 System Architecture

```
Internet → Vercel Edge → React SPA → Railway API → Railway MySQL
                                    ↘ Gemini AI, Cloudinary, Google Maps
```

> 📐 *System Architecture Diagram — to be inserted later*

---

## 🗄 Database Design

- **Database**: MySQL 8 hosted on Railway Cloud
- **ORM**: Spring Data JPA + Hibernate
- **Schema Management**: Hibernate DDL Auto (`update`)
- **Relationships**: Full relational model with foreign key constraints
- **Key Entities**: `User`, `Lawyer`, `Appointment`, `Notification`, `ChatMessage`, `RightsDomain`, `GovernmentScheme`, `Document`, `Bookmark`

> 📊 *ER Diagram — to be inserted later*

---

## 📸 Application Screenshots

| Screen | Preview |
|---|---|
| 🏠 **Home Page** | *Screenshot coming soon* |
| 🔐 **Login** | *Screenshot coming soon* |
| 📊 **Dashboard** | *Screenshot coming soon* |
| 📚 **Rights Explorer** | *Screenshot coming soon* |
| 🤖 **AI Assistant** | *Screenshot coming soon* |
| 👨‍⚖️ **Lawyer Marketplace** | *Screenshot coming soon* |
| 👤 **Profile** | *Screenshot coming soon* |
| 🔍 **OCR Scanner** | *Screenshot coming soon* |

---

## 📁 Project Structure

```
AI-Powered-CitizenLex/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/com/citizenlex/
│   │   ├── controllers/              # REST API Controllers
│   │   ├── services/                 # Business Logic Layer
│   │   ├── models/                   # JPA Entity Classes
│   │   ├── repositories/             # Spring Data JPA Repositories
│   │   ├── security/                 # JWT + Spring Security Config
│   │   └── config/                   # App Configuration
│   ├── src/main/resources/
│   │   └── application.yml           # Application Configuration
│   └── pom.xml                       # Maven Dependencies
│
├── frontend/                         # React + Vite Frontend
│   ├── src/
│   │   ├── components/               # Reusable UI Components
│   │   ├── pages/                    # Route-Level Page Components
│   │   ├── context/                  # Auth, PWA & Theme Contexts
│   │   └── hooks/                    # Custom React Hooks
│   ├── public/                       # PWA Icons & Static Assets
│   ├── index.html                    # Entry HTML (PWA prompt setup)
│   └── vite.config.js                # Vite + PWA Configuration
│
├── docs/
│   └── DEPLOYMENT.md                 # Production Deployment Guide
│
├── .github/workflows/
│   ├── java-ci.yml                   # Java CI/CD Pipeline
│   └── codeql.yml                    # CodeQL Security Scanning
│
├── vercel.json                       # Vercel Rewrite Rules
└── README.md                         # This File
```

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| **JWT Authentication** | Stateless token-based auth with configurable expiry |
| **Password Encryption** | BCrypt hashing (Spring Security's PasswordEncoder) |
| **Spring Security** | Method-level security, CORS config, custom filter chain |
| **Secure REST APIs** | All protected endpoints require valid Bearer token |
| **Role-Based Access Control** | `USER` and `ADMIN` roles with scoped access permissions |
| **CodeQL Analysis** | Automated static security analysis on every push via GitHub Actions |

---

## 🚀 Deployment

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | https://ai-powered-citizen-lex.vercel.app |
| **Backend** | Railway | https://ai-powered-citizenlex-production.up.railway.app |
| **Database** | Railway MySQL | Managed MySQL 8 on Railway |
| **Media Storage** | Cloudinary | Profile photos and generated documents |

Every push to `main` triggers the full pipeline automatically:

```
git push origin main
    ├── GitHub Actions CI  (build + test + CodeQL)
    ├── Railway            (backend auto-redeploy)
    └── Vercel             (frontend auto-redeploy)
```

---

## 🔮 Future Enhancements

1. 🌐 **Multilingual Support** — Full interface in Hindi, Tamil, Telugu, and other regional languages
2. 📱 **Native Mobile App** — React Native iOS & Android application
3. 🗣️ **Voice Interaction** — Voice-based legal queries using the Web Speech API
4. 🏛️ **Case Tracker** — Track ongoing legal cases with timeline visualization
5. 📜 **Legal Library** — Curated database of Indian Acts, sections, and landmark judgments
6. 🤝 **Lawyer Video Consultation** — In-app Jitsi video calls with verified advocates
7. 🔔 **Push Notifications** — FCM-powered push alerts for appointments and case updates
8. 📊 **Admin Analytics Dashboard** — Platform-wide usage analytics and reporting
9. 💳 **Subscription Plans** — Tiered access with Razorpay recurring billing
10. 🔗 **Government API Integration** — Direct connection to DigiLocker and e-Courts APIs

---

## 👨‍💻 Developer

| | |
|---|---|
| **Name** | Abishek K |
| **Registration Number** | 922524243004 |
| **GitHub** | [github.com/Abishekvsb](https://github.com/Abishekvsb) |
| **Project Repo** | [Ai-powered-CitizenLex](https://github.com/Abishekvsb/Ai-powered-CitizenLex) |
| **LinkedIn** | *Link to be added* |

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Abishek K

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

<sub>💡 "The intersection of technology and justice is where I build."</sub>

</div>
