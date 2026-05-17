# 🚀 GTM Automation Platform

> **AI-powered Go-to-Market Automation Platform** — Lead enrichment, AI research, personalized outreach, resume optimization, and workflow automation. Inspired by Clay.com, n8n, and Zapier.

[![CI/CD](https://github.com/anomalyco/GTM-Automation-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/anomalyco/GTM-Automation-Platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Database Models](#-database-models)
- [Workflow Engine](#-workflow-engine)
- [Cron Jobs](#-cron-jobs)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

GTM Automation Platform is a full-stack SaaS application that automates go-to-market workflows using AI. It enables sales and marketing teams to:

- **Enrich leads** with company data, technology stacks, and AI-generated insights
- **Research companies** using AI agents that analyze websites and generate summaries
- **Generate personalized outreach** (cold emails, LinkedIn messages, follow-ups)
- **Optimize resumes** for specific job descriptions with ATS scoring
- **Build automation workflows** with triggers, steps, and async processing
- **Track everything** through a beautiful dashboard

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vercel)                  │
│  React 19  │  TailwindCSS 4  │  TanStack Query      │
│  Zustand   │  Framer Motion  │  Recharts             │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────┐
│              Backend API (Render)                    │
│  Express.js  │  TypeScript  │  Mongoose              │
│  OpenAI      │  Zod         │  Pino                  │
│  JWT Auth    │  Rate Limit  │  Helmet                │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│  MongoDB     │ │  OpenAI  │ │  Redis   │
│  Atlas       │ │  API     │ │  (opt.)  │
└──────────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────┐
│              Background Jobs (in-app)                │
│  MongoDB Queue  │  Retry Logic  │  Status Tracking   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
CSV Upload / Manual Entry → Lead Created (pending)
         │
         ▼
Enrichment Job Created → Scrape Website → AI Analysis
         │
         ▼
Lead Enriched (company info, tech stack, summary, category)
         │
         ▼
Generate Outreach → AI Personalization → Store in DB
         │
         ▼
Workflow Execution → Pipeline of Steps → Log Results
```

---

## ✨ Features

### 🔐 Authentication System
- JWT-based signup/login with secure password hashing
- Protected routes and middleware
- User profile management

### 📊 Lead Enrichment Engine
- Upload leads via CSV or manual entry
- Automatic company data enrichment via web scraping
- Technology stack detection
- AI-powered company summaries and categorization
- Hiring page detection
- Pain point identification
- Target audience analysis

### 🤖 AI Research Agent
- Website analysis and business summarization
- Target audience identification
- Pain point discovery
- Competitive advantage extraction
- Company category classification (SaaS, Marketplace, Enterprise, etc.)
- Actionable insight generation

### 📧 Personalized Outreach Generator
- Cold email generation
- LinkedIn message crafting
- Follow-up sequence creation
- Multiple tone options (professional, friendly, formal)
- AI-personalized based on company research

### 📝 Resume Optimizer
- Resume upload and parsing
- Job description analysis
- ATS score calculation
- Keyword gap analysis
- Resume bullet optimization
- Cover letter generation
- Recruiter outreach email generation

### ⚡ Workflow Automation Engine
- Visual workflow builder with triggers and steps
- Trigger types: CSV upload, cron schedule, webhook, manual
- Step types: enrich, scrape, summarize, generate outreach, optimize resume, webhook, classify, score, filter, delay
- Execution logging and status tracking
- Resume/pause/duplicate workflows

### 🔄 Background Job System
- MongoDB-backed job queue
- Async processing with status tracking
- Automatic retry with exponential backoff
- Failed job management
- Job cleanup cron

### 📈 Dashboard & Analytics
- Real-time stats cards
- Activity visualizations with Recharts
- Recent jobs timeline
- Quick action buttons
- Dark mode by default

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **TailwindCSS 4** | Styling |
| **TanStack Query** | Server state management |
| **Zustand** | Client state management |
| **Framer Motion** | Animations |
| **React Router** | Routing |
| **Recharts** | Charts |
| **Axios** | HTTP client |
| **Lucide React** | Icons |
| **Headless UI** | Accessible components |
| **React Hot Toast** | Notifications |
| **React Markdown** | Markdown rendering |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | Web server |
| **TypeScript** | Type safety |
| **MongoDB + Mongoose** | Database |
| **OpenAI API** | AI capabilities |
| **JWT** | Authentication |
| **Zod** | Request validation |
| **Cheerio + Axios** | Web scraping |
| **Multer** | File uploads |
| **Pino** | Logging |
| **Helmet** | Security headers |
| **Express Rate Limit** | Rate limiting |
| **Node-Cron** | Scheduled tasks |
| **Bull (optional)** | Redis-backed queue |

### DevOps
| Tool | Purpose |
|---|---|
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |
| **MongoDB Atlas** | Database |
| **GitHub Actions** | CI/CD + Cron jobs |
| **Docker** | Containerization |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- OpenAI API key
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/anomalyco/GTM-Automation-Platform.git
cd GTM-Automation-Platform
```

### 2. Install Dependencies
```bash
# Install all dependencies (root + server + client)
npm run install:all

# Or install individually:
cd server && npm install
cd ../client && npm install
```

### 3. Set Up Environment Variables
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
# Edit client/.env with your values
```

### 4. Start Development
```bash
# From root (runs both server and client)
npm run dev

# Or individually:
cd server && npm run dev  # Backend on :5000
cd client && npm run dev  # Frontend on :5173
```

### 5. Open the App
Visit `http://localhost:5173` in your browser.

---

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing key | Required |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15min) |
| `RATE_LIMIT_MAX` | Max requests/window | `100` |
| `LOG_LEVEL` | Logging level | `debug` |

### Client (`client/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

---

## 📖 API Documentation

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/profile` | Update profile |

### Leads
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads` | List leads (paginated) |
| `POST` | `/api/leads` | Create lead |
| `POST` | `/api/leads/batch` | Bulk create leads |
| `GET` | `/api/leads/:id` | Get lead details |
| `PUT` | `/api/leads/:id` | Update lead |
| `DELETE` | `/api/leads/:id` | Delete lead |
| `POST` | `/api/leads/:id/enrich` | Enrich single lead |
| `POST` | `/api/leads/batch/enrich` | Batch enrich leads |
| `GET` | `/api/leads/stats` | Lead statistics |

### Workflows
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workflows` | List workflows |
| `POST` | `/api/workflows` | Create workflow |
| `GET` | `/api/workflows/:id` | Get workflow |
| `PUT` | `/api/workflows/:id` | Update workflow |
| `DELETE` | `/api/workflows/:id` | Delete workflow |
| `POST` | `/api/workflows/:id/execute` | Execute workflow |
| `POST` | `/api/workflows/:id/toggle` | Toggle active/paused |
| `POST` | `/api/workflows/:id/duplicate` | Duplicate workflow |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List jobs |
| `GET` | `/api/jobs/:id` | Get job details |
| `POST` | `/api/jobs/:id/retry` | Retry failed job |
| `POST` | `/api/jobs/:id/cancel` | Cancel job |
| `DELETE` | `/api/jobs/cleanup` | Cleanup old jobs |
| `GET` | `/api/jobs/stats` | Job statistics |

### Outreach
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/outreach` | List outreach messages |
| `POST` | `/api/outreach` | Generate outreach |
| `POST` | `/api/outreach/batch` | Batch generate |
| `GET` | `/api/outreach/:id` | Get outreach |
| `DELETE` | `/api/outreach/:id` | Delete |

### Resumes
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resumes/upload` | Upload resume |
| `GET` | `/api/resumes` | List resumes |
| `GET` | `/api/resumes/:id` | Get resume |
| `POST` | `/api/resumes/:id/optimize` | Optimize for JD |
| `POST` | `/api/resumes/:id/export` | Export resume |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client directory
cd client
vercel --prod
```

### Backend (Render)
1. Fork/push repository to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repo
4. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add environment variables from `.env.example`
6. Deploy!

### MongoDB Atlas
1. Create free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get connection string
3. Add to server `.env` as `MONGODB_URI`

### GitHub Secrets for CI/CD
| Secret | Description |
|---|---|
| `RENDER_DEPLOY_HOOK` | Render deploy hook URL |
| `RENDER_SERVICE_ID` | Render service ID |
| `RENDER_API_KEY` | Render API key |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `CRON_SECRET` | Secret for cron endpoints |

---

## 📁 Project Structure

```
GTM-Automation-Platform/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       ├── deploy.yml          # Deployment
│       └── keep-alive.yml      # Render keep-alive cron
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, Sidebar
│   │   │   └── ui/             # DataTable, Modal, StatsCard, etc.
│   │   ├── pages/              # All page components
│   │   ├── services/           # API client
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   └── lib/                # Utilities
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── controllers/        # Route handlers
│   │   ├── jobs/               # Background job workers
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # Express routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Helpers, logger, errors
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
├── render.yaml                 # Render deployment config
├── vercel.json                 # Vercel deployment config
└── README.md
```

---

## 📊 Database Models

### User
```
{ email, password, name, plan, credits, timestamps }
```

### Lead
```
{ userId, domain, linkedinUrl, companyName, companyDescription,
  industry, size, location, technologies[], summary, category,
  targetAudience, painPoints[], hiringPage, socialLinks[],
  status, enrichedAt, timestamps }
```

### Workflow
```
{ userId, name, description, trigger: { type, config },
  steps: [{ id, type, name, config, position }],
  status, lastRun, runCount, timestamps }
```

### Job
```
{ userId, workflowId, type, status, progress, payload,
  result, error, retries, maxRetries, timestamps }
```

### Resume
```
{ userId, originalFilename, content, parsedData,
  optimizations: [{ jobDescription, optimizedBullets,
  atsScore, matchRate, missingKeywords[], coverLetter }],
  timestamps }
```

### Outreach
```
{ userId, leadId, type, leadInfo: { companyName, contactName, role },
  content, subject, tone, timestamps }
```

---

## ⚙️ Workflow Engine

The workflow engine processes automation pipelines asynchronously:

### Trigger Types
| Trigger | Description |
|---|---|
| `csv_upload` | Starts when leads are imported via CSV |
| `cron` | Runs on a schedule (cron expression) |
| `webhook` | Triggered by external webhook call |
| `manual` | Manually triggered by user |

### Step Types
| Step | Description |
|---|---|
| `enrich_lead` | Enrich lead with company data |
| `scrape_website` | Scrape company website |
| `summarize_ai` | Generate AI summary |
| `generate_outreach` | Create personalized outreach |
| `optimize_resume` | Optimize resume for JD |
| `send_webhook` | Send data to external webhook |
| `classify_lead` | Classify lead category |
| `score_lead` | Score lead quality |
| `filter` | Filter based on conditions |
| `delay` | Wait before next step |

### Execution Flow
```
Trigger → Create Job (pending)
              ↓
    Job Queue picks up (running)
              ↓
    Execute Step 1 → Update progress
              ↓
    Execute Step 2 → Update progress
              ↓
    ... (all steps)
              ↓
    Mark Job Completed ✓
         OR
    Mark Job Failed ✗ → Retry (up to 3x)
```

---

## ⏰ Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| **Keep Alive** | Every 10 min | Pings Render backend to prevent sleep |
| **Job Cleanup** | Daily | Removes completed jobs > 7 days |
| **Failed Job Retry** | Hourly | Retries failed jobs within limits |

---

## 🧪 Running Tests

```bash
# Backend tests
cd server && npm test

# Frontend lint
cd client && npm run lint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Clay.com](https://clay.com) — Inspiration for lead enrichment
- [n8n](https://n8n.io) — Workflow automation patterns
- [OpenAI](https://openai.com) — AI capabilities
- [TailwindCSS](https://tailwindcss.com) — Design system

---

<p align="center">
  Built with ❤️ for the GTM Automation Community
</p>
