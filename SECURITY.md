# Security Policy

## Supported Versions

| Version | Supported          |
|---|---|
| `1.0.x` | ✅ Actively supported |
| `< 1.0` | ❌ No longer supported |

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in CitizenLex, please report it responsibly by emailing:

📧 **abishekvsb@gmail.com**

Include the following in your report:

1. **Description** — A clear description of the vulnerability
2. **Impact** — Potential impact (data breach, privilege escalation, etc.)
3. **Reproduction Steps** — Detailed steps to reproduce the issue
4. **Affected Component** — Backend API / Frontend / Authentication / Database
5. **Environment** — URL, browser, version where tested
6. **Proof of Concept** — Any code, screenshots, or network traces

---

## Response Timeline

| Step | Timeframe |
|---|---|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix deployed (critical) | Within 7 business days |
| Fix deployed (high) | Within 30 days |
| Public disclosure | After fix is released |

---

## Security Architecture

CitizenLex implements the following security controls:

| Control | Implementation |
|---|---|
| **Authentication** | JWT HS512 — 24-hour expiry, stateless |
| **Authorization** | Spring Security `@PreAuthorize` — role-based |
| **Password Storage** | BCrypt adaptive hash — strength 10 |
| **SQL Injection Prevention** | Spring Data JPA parameterized queries |
| **XSS Prevention** | React DOM escaping + CSP headers |
| **CORS** | Strict allowlist — registered frontend origins only |
| **Email Verification** | Cryptographic random token — 24h expiry |
| **File Upload Security** | MIME validation + size limit (10MB) + Cloudinary sandbox |
| **Secrets** | Environment variables only — no hardcoding |

---

## Known Limitations

- This application is provided as-is for educational and demonstration purposes.
- The AI legal assistant does not provide certified legal advice.
- Demo lawyer records are seeded data and should not be contacted for real legal matters.

---

## Acknowledgements

We gratefully acknowledge security researchers who responsibly disclose vulnerabilities and help improve CitizenLex.
