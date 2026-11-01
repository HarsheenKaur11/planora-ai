# Planora AI — Your Event. Your Vision. Perfectly Planned.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-planora--ai--lyart.vercel.app-2C1242?style=for-the-badge&logo=vercel)](https://planora-ai-lyart.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-HarsheenKaur11%2Fplanora--ai-181717?style=for-the-badge&logo=github)](https://github.com/HarsheenKaur11/planora-ai)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Custom%20Plum%20%26%20Gold-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-SQLite%20%2F%20PostgreSQL-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)

**Live Production Website**: [https://planora-ai-lyart.vercel.app](https://planora-ai-lyart.vercel.app)  
**GitHub Repository**: [https://github.com/HarsheenKaur11/planora-ai](https://github.com/HarsheenKaur11/planora-ai)

---

## 1. Product Overview

**Planora AI** is an intelligent generative AI-powered event planning platform designed for individuals and communities organizing weddings, birthdays, anniversaries, corporate summits, cultural festivals, and community celebrations.

Primary market: **India** (with default INR ₹ formatting and culturally attuned planning models, with full multi-currency support for USD $, EUR €, GBP £, and AED).

### Key Modules:
- **Interactive AI Event Creator**: Multi-step wizard parsing structured form details and open-ended natural-language prompts (*"I want to organize a traditional Punjabi wedding in Delhi for 250 guests..."*) into actionable, editable application data.
- **Smart Budget Planner**: Real-time financial ledger with Recharts donut category breakdowns, estimated vs actual spend comparisons, and an **"Optimize My Budget"** AI audit engine.
- **Intelligent Event Timeline**: Chronological run-sheet adapting dynamically to event target dates, short-notice compression, and visual overdue deadline trackers.
- **Vendor Management System**: Complete procurement system with status tracking (*Not contacted, Contacted, Negotiating, Shortlisted, Booked*), payment stages, and side-by-side quotation comparisons.
- **AI-Generated Checklist**: Priority-ranked tasks with dynamic completion progress bars and an instant **"Generate More Tasks"** AI action that prevents duplicates.
- **Conversational AI Assistant**: Event-aware chatbot that queries real database records (expenses, contracts, deadlines) to provide factual, contextual advice rather than generic recommendations.
- **Deterministic Offline Fallback Engine**: If a Google Gemini API key is not configured or times out, Planora activates its built-in deterministic planning engine with full transparency.

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS with custom palette (Warm Ivory `#FAF9F5`, Deep Plum `#2C1242`, Muted Lavender `#B792DE`, Champagne Gold `#D4AF37`)
- **Icons**: Lucide React
- **Database ORM**: Prisma ORM with SQLite (production-swappable to PostgreSQL)
- **AI SDK**: Official `@google/generative-ai` SDK with deterministic fallback
- **Visualizations**: Recharts (PieChart, BarChart, ResponsiveContainer)
- **Validation**: Zod schema validation
- **Notifications**: Custom Toast notification system

---

## 3. Prerequisites

- **Node.js**: `v18.17.0` or higher (Tested on Node `v24.x`)
- **npm**: `v9.x` or higher (or `yarn` / `pnpm`)

---

## 4. Quick Start & Installation

Clone or enter the project directory and install dependencies:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment file
cp .env.example .env

# 3. Generate Prisma client & initialize database
npx prisma generate
npx prisma db push

# 4. Seed rich Indian Wedding demo data
npm run db:seed
# Or: node prisma/seed.js

# 5. Launch development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Variables

Create a `.env` file in the project root:

```env
# Database configuration (SQLite for local, PostgreSQL for cloud)
DATABASE_URL="file:./dev.db"

# Google Gemini API Key (Optional: will run in local intelligent fallback mode if omitted)
GEMINI_API_KEY=""

# Application Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="Planora AI"
```

### Configuring Google Gemini API:
1. Visit [Google AI Studio](https://aistudio.google.com/) and create an API key.
2. Paste the key into your `.env` file:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```
3. Restart your dev server. Planora will automatically detect the key and switch from Fallback Mode to Google Gemini 1.5 Flash.

### Running in Demo Mode:
Planora includes an out-of-the-box **Demo Guest Mode** with complete pre-seeded data for **Aarav & Meera's Royal Punjabi Wedding** (Chattarpur, New Delhi, ₹12,00,000 budget, 250 guests, 9 expenses, 5 vendors, 6 tasks, 7 milestones, and 4 ideas).
To reset or re-seed this demo event at any time:
- Navigate to the **Settings** page and click **"Re-seed Demo Event"**, or
- Run `npm run db:seed` in your terminal.

---

## 6. Production Build & Deployment

### Build Command:
```bash
npm run build
```

### Start Production Server:
```bash
npm start
```

### Deploying to Vercel:
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. If using SQLite on Vercel, consider deploying SQLite via Turso (`@libsql/client`) or connecting a hosted PostgreSQL database (Neon, Supabase) by changing the provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.
4. Add `GEMINI_API_KEY` to Vercel Environment Variables.

---

## 7. QA Verification Suite

Planora includes an automated end-to-end verification script testing the complete 17-point user journey:

```bash
npx tsx scripts/verify-all.ts
```

**Verification Results:**
- 47 / 47 tests passed
- 0 failed assertions
- Validates seeded demo events, budget calculation math, vendor quotation comparisons, task completion percentages, AI assistant context extraction, and cascade deletions.

---

## 8. License

MIT License. Crafted for modern celebrations with Planora AI.
