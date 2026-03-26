# SEO Bot Platform 🤖📈

A full-stack, enterprise-grade SEO application that allows users to perform technical site audits, discover ranking keywords using SERP intelligence, and automatically generate high-quality SEO content via AI. 

## 🏗️ Architecture Stack

### Backend (Django REST Framework)
- **Framework:** Django 4.2+ & Django REST Framework
- **Database:** PostgreSQL (with `psycopg2-binary`)
- **Authentication:** JWT via `rest_framework_simplejwt` (Access/Refresh Tokens)
- **Caching:** Django's built-in `LocMemCache` (`seobot-dev`)
- **Security limits:** Built-in CORS whitelist, max memory request size 1MB limits, Throttle limits (e.g. `1000/day` per user)

### Frontend (React + Vite)
- **Framework:** React 18
- **Bundler:** Vite
- **Styling:** CSS / TailwindCSS / Dynamic UI Component Design

### External APIs
- **SERP API:** Used for real-time live keyword ranking, volume, and search engine results data.
- **Groq/OpenAI API:** Advanced LLM used for structuring, formatting, and generating full-length SEO articles.

---

## 🛠️ Backend Core Modules (Django Apps)

1. **`accounts`**: Custom user authentication, signup/login flows, token blacklisting.
2. **`projects`**: Manages isolated client/user SEO projects. Every report or campaign belongs to a project.
3. **`audit` & `crawler`**: Scans website URLs, extracting DOM data, measuring SEO health (missing headers, meta descriptions, alt text) using `beautifulsoup4`, `requests`, and optionally `playwright`.
4. **`keywords` & `serp`**: Implements keyword extraction (`keybert`) and fetching live Google SERP ranking data (`serpapi`).
5. **`generator` & `ai`**: Orchestrates LLM prompt execution. Uses LLMs to draft complete blog posts, headings, and outlines based on keyword data. Contains optional hooks for YouTube transcript generation (`youtube-transcript-api`).
6. **`monitoring`**: Keeps track of daily SEO scores, indexing, or audit failures.
7. **`services`**: Centralized core logical handlers used across other apps (e.g. wrapping 3rd party API calls).

---

## 💻 Local Development Setup

### 1. Backend Server Setup
Ensure you have Python 3 installed. You must set up your PostgeSQL database (named `bot_db`) or adjust `settings.py` if using sqlite locally.

```bash
# 1. Navigate to the inner core backend directory
cd bot_backend/bot_backend

# 2. Setup your virtual environment (Recommended)
python -m venv venv

# 3. Activate the environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# (Note: If you get an Execution Policy Error here, run VS Code as Admin or run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell first).

# 4. Install requirements
pip install -r requirements.txt

# 5. Setup your .env file
# Ensure you copy your API Keys (Groq, SerpApi) to bot_backend/.env
# Example format: 
# SERPAPI_API_KEY="your-key-here"
# GROQ_API_KEY="your-key-here"

# 6. Apply database migrations
python manage.py migrate

# 7. Start the server
python manage.py runserver
```
The Django server will run at `http://localhost:8000`.

### 2. Frontend React Setup
Ensure you have Node.js and NPM installed.

```bash
# 1. Navigate to the frontend directory
cd bot_frontend

# 2. Install Javascript dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

---

## 🔑 Security & Roles

- **Data Isolation:** Regular users are strictly segmented to only see their personal project models.
- **Admin Dashboard:** Django Superusers (`is_staff` / `is_superuser`) have wide-angle access to metrics across all users through the Django Admin panel. 
- **Rate Limiting:** Protects endpoints from abuse (e.g. 5 requests/minute config specifically for login brute-force protection, 10/hour for account creation).

## 🚀 Known Functionalities & Workflows
1. **User registers** an account -> Authenticates via JWT -> Receives tokens.
2. User **creates a Project** -> Triggers a `bot_backend` audit request for a target domain.
3. User accesses **Keyword Research** -> Sends query to SERP module -> Renders volume matrices.
4. User selects keywords and clicks **Generate Article** -> `generator` app contacts Groq/OpenAI -> Renders the drafted text back to the frontend editor.
