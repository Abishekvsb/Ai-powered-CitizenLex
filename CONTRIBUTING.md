# Contributing to CitizenLex

Thank you for your interest in contributing to CitizenLex! We're building AI-powered legal access for India, and every contribution makes a real difference.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

This project adheres to our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold these standards.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Ai-powered-CitizenLex.git
   cd Ai-powered-CitizenLex
   ```
3. **Set upstream remote**:
   ```bash
   git remote add upstream https://github.com/Abishekvsb/Ai-powered-CitizenLex.git
   ```
4. **Follow** the [Development Setup](#development-setup) instructions below

---

## Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 17+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Docker | 24+ (optional) |

### Backend (Spring Boot)

```bash
cd backend
cp ../backend/src/main/resources/application.yml.example \
   ../backend/src/main/resources/application.yml
# Edit application.yml with your local DB credentials
./mvnw spring-boot:run
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your local settings
npm run dev
```

### Using Docker

```bash
docker compose up --build
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `develop` | Integration branch for features |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation updates |
| `refactor/<name>` | Code refactoring |

Always branch from `develop`:

```bash
git fetch upstream
git checkout -b feat/my-feature upstream/develop
```

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

<optional body>
```

**Types:**

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation change |
| `refactor` | Code refactor (no feature/fix) |
| `test` | Add or update tests |
| `chore` | Build/config changes |
| `perf` | Performance improvement |
| `security` | Security fix |

**Examples:**
```bash
feat(lawyer): add AI-based advocate recommendation by case text
fix(auth): resolve JWT expiry not being validated on refresh
docs(readme): add Docker Compose setup instructions
security(api): add rate limiting to /auth/login endpoint
```

---

## Pull Request Process

1. Ensure your branch is up-to-date with `upstream/develop`
2. Verify backend compiles: `mvn clean compile -f backend/pom.xml`
3. Verify frontend builds: `npm run build` (in `frontend/`)
4. Submit a PR against `develop` (not `main`)
5. Fill in the [PR template](./.github/PULL_REQUEST_TEMPLATE.md) completely
6. Wait for review — maintainer will respond within 5 business days
7. Address review comments and push updates
8. PRs are merged using **Squash and Merge**

---

## Coding Standards

### Java / Spring Boot

- Follow standard Java naming conventions (camelCase methods, PascalCase classes)
- All service methods must have Javadoc for public APIs
- Use `@Valid` and Bean Validation on all DTO parameters
- Never hardcode credentials or API keys — use environment variables
- Prefer constructor injection over field injection

### React / JavaScript

- Use functional components with React Hooks only (no class components)
- One component per file; filename matches export name
- CSS-in-style or inline styles consistent with existing `index.css` design system
- Use `axios` for all HTTP calls via the configured base URL
- Console.log should be removed before submitting PRs

---

## Reporting Issues

Please use the GitHub Issue templates:
- 🐛 [Bug Report](./.github/ISSUE_TEMPLATE/bug_report.yml)
- ✨ [Feature Request](./.github/ISSUE_TEMPLATE/feature_request.yml)

For security vulnerabilities, see [SECURITY.md](./SECURITY.md).

---

Thank you for helping democratize access to justice in India! 🇮🇳⚖️
