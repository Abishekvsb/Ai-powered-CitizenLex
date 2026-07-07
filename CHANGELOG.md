# Changelog

All notable changes to CitizenLex are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — version numbers follow [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-07-06

### 🎉 Initial Release

#### Added — AI & Intelligence
- Google Gemini 2.5 Flash integration for AI-powered legal Q&A
- Bilingual legal chat in English and Tamil
- AI document intelligence: PDF (Apache PDFBox), DOCX (Apache POI), Images (Tesseract.js OCR)
- AI case-based lawyer recommendation via Gemini categorization
- Smart legal document drafting templates
- Persistent conversation history per user session

#### Added — Lawyer Marketplace
- 76 verified advocate records seeded across all 38 Tamil Nadu districts
- Real Google Maps JS API integration with per-lawyer GPS coordinates
- Deterministic geocoding fallback using district centre coordinates
- Advanced search filters: district, specialization, fee, experience, rating, language
- Lawyer registration and verification flow (PENDING → APPROVED → SUSPENDED)
- Admin KYC review dashboard
- Post-consultation review and star rating system
- 5-step appointment booking wizard with Razorpay payment integration
- Jitsi Meet video consultation room auto-generation

#### Added — Rights & Schemes
- Citizen rights knowledge base: Fundamental, Consumer, Women, Child, Labour rights
- Bilingual content (English/Tamil) for all rights articles
- Government scheme database with eligibility criteria
- Interactive rights explorer with category navigation

#### Added — Security & Auth
- JWT HS512 authentication with 24-hour expiry
- Email OTP verification on new account registration
- Role-Based Access Control: ROLE_USER, ROLE_LAWYER, ROLE_ADMIN
- BCrypt password hashing (strength 10)
- Spring Security CORS allowlist configuration
- Login audit trail and session management

#### Added — Real-time Communication
- Spring WebSocket + STOMP broker for lawyer-user consultation chat
- WebSocket-secured message channels per chat room

#### Added — Infrastructure
- Spring Boot 3.2.5 backend on Railway with MySQL 8 managed DB
- React 18 + Vite 5 PWA frontend on Vercel
- Cloudinary CDN for profile image storage
- HikariCP connection pool with auto-scaling (2–10 connections)
- GitHub Actions CI for Spring Boot compilation + React build
- CodeQL security analysis workflow (Java + JavaScript)
- Docker Compose for local development

#### Added — Developer Experience
- DatabaseSeeder auto-populates all demo data on first startup
- `isDemo` flag on lawyers for easy prod vs. demo distinction
- `pincode` field on lawyer profiles
- Deterministic geocoding fallback (no API key required for local dev)
- `GEMINI_API_KEY=mock` fallback mode for AI simulation

---

## [Unreleased — v1.1.0] — Target Q3 2026

### Planned
- High Court and Supreme Court case law database
- SMS notifications via Fast2SMS
- Lawyer Google Calendar sync for availability
- AI document comparison (two-contract side-by-side analysis)
- Rate limiting on authentication endpoints

---

[1.0.0]: https://github.com/Abishekvsb/Ai-powered-CitizenLex/releases/tag/v1.0.0
