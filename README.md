# CragTrails 🌍🧗

**The world's most climber-friendly open source rock climbing guide.**

Simple enough for a 10-year-old. Powerful enough for lifelong crushers.  
**AllTrails for crags, boulders, sport, and trad** — but completely free at the core, built in the open, and governed by a skeptical multi-agent CEO process.

> "Every feature must prove it makes climbing more accessible, safer, or more fun — or it doesn't ship."

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with skeptical agents](https://img.shields.io/badge/built%20by-10%20AI%20subagents%20%2B%20CEO%20review-166534)](https://github.com/KolinCunningham/cragtrails)

---

## Why CragTrails exists

Mountain Project is incredible but corporate and US-heavy. TheCrag is global but complex. AllTrails proved that **dead-simple, beautiful, mobile-first interfaces win** for outdoor people.

CragTrails combines:
- The best open data (OpenBeta CC0 + Mountain Project API + TheCrag where licensed)
- An interface so simple and delightful a child can use it on their parent's phone
- One-tap sends that actually feel good (confetti + instant logbook)
- Real revenue transparency (sponsors + cheap offline packs only)
- Radical trust & safety tooling because families and kids use climbing apps

**Everything else is secondary.**

---

## 30-Minute Multi-Agent CEO Sprint (How This Was Built)

This entire v0 was created in a single 30-minute session using **10+ specialized subagents** orchestrated by a skeptical "CEO" persona that **assumes every proposal is wrong until proven with evidence**.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the exact process every future contributor (human or AI) must follow.

**The process works.** It forced better prioritization, removed bloat, and kept the 10-year-old test front and center.

---

## Current Features (v0 — already delightful)

- **Discover** with huge friendly search + grade/type filters
- **Interactive map** (Leaflet) with grade-colored markers, clustering, real "Near Me" (browser GPS)
- **One-tap "SEND IT"** with satisfying animations + auto logbook entry
- **Full route modals** with beta, conditions, FA, sources (proper attribution always)
- **Real logbook** + personal stats that persist in localStorage (demo)
- **Wishlist** hearts
- **Admin / Trust Console** (demo) — photo moderation, data source health, CEO oversight view
- **Revenue surfaces done right**: Sponsors logos, "offline packs" $4.99 one-time (or GitHub Sponsors unlocks all), 100% transparent
- Beautiful, high-contrast, 48px+ tap targets everywhere

**Core is and will always remain 100% free.**

---

## Quick Start

```bash
git clone https://github.com/KolinCunningham/cragtrails.git
cd cragtrails
npm install
npm run dev
```

Open http://localhost:3000

**Demo login is automatic** (you're "Alex Rivera"). All sends you log are saved locally.

**Admin demo**: Click the tiny "ADMIN" button top right → password `demo` (or just explore the console).

---

## Data Philosophy & Attribution

We never scrape. We use:

- **OpenBeta** (primary long-term — CC0, community-owned, the "OSM of climbing")
- **Mountain Project API** (with proper key + attribution when used)
- **TheCrag** (when API access is granted)
- **User contributions** (with moderation)

Every route clearly shows its sources. We link back whenever possible.

See `lib/seed-data.ts` and future `scripts/` for import pipelines.

---

## Roadmap (proven ideas only)

- Real auth (Clerk) + sync
- Photo uploads + moderation queue
- Conditions reports from real users
- Offline PWA + map tile caching (the paid unlock)
- OpenBeta + MP live sync scripts
- Mobile apps (React Native / Tauri) — same simple UI
- Grade converter + filters that actually help ("show me things I can onsight")

---

## Contributing (Humans + Future AI Agents)

**Read CONTRIBUTING.md first.**

The bar is high on purpose. The CEO (lead maintainer) will start every review by assuming the change adds complexity or solves the wrong problem. You must bring proof:

- Real climber quotes or AllTrails analogy
- 10-year-old usability test notes
- Growth / retention / accessibility evidence
- Why a simpler alternative wasn't enough

Quality over quantity. This is how we build the best tool climbers have ever had.

---

## License & Ethics

Code: MIT  
Data: Respect the source licenses (OpenBeta CC0, MP terms, etc.)  
User content: You own your ticks/photos. We moderate for safety.

This project was built with love for the climbing community by a ridiculous multi-agent system in 30 minutes — and it's just the beginning.

---

**Now go send something.**

Made for the vertical world. Free forever. Built in the open.

— The CragTrails CEO + Subagent Team (May 2026)
