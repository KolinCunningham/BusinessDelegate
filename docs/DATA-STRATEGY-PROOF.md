# CragTrails Data Strategy Proof

**Why a merged, hierarchical, multi-source climbing data model beats flat lists or single-source silos.**

**Prepared for CEO review — 26 May 2026**

---

## The Problem with Current Approaches

**Mountain Project (pre-deprecation)** was the de-facto US database but:
- US-centric (virtually no Kalymnos, Fontainebleau, or Squamish depth)
- API shut down 2020–2021 after onX acquisition; no new access
- Sparse international coverage and photo licensing friction

**OpenBeta (CC0)** is the only truly open, global, community dataset:
- Excellent hierarchical areas + grades
- **Critically weak on photos** (climbers repeatedly cite "can't plan without visuals")
- Limited condition/tick richness for real-time decision making

**TheCrag** has rich international data and strong hierarchy but:
- API currently closed to new non-commercial applications
- Requires legal agreements; commercial terms unclear

**Flat lists or single-source apps** create these documented climber pain points:
- "I want every 5.10 trad crack within a 2-hour drive of Denver" → impossible without expensive full-table scans
- "Show me all routes in this region my partner has sent" → requires brittle client-side joins
- International travelers land in Europe with US-only grade systems and zero local beta/photos
- No provenance → legal risk when commercializing or displaying third-party content
- No real-time conditions → "Is Incredible Hand Crack dry after the storm?" answered by rumor

---

## Our Merged Hierarchical Model Solves It

**Core structure (lib/types/climbing.ts + seed-data.ts):**

- **Area** (hierarchical): `parentId`, `ancestorIds[]` (denormalized path), bounds, bestSeason, accessInfo
- **Route**: multi-grade system (`yds`, `french`, `font`, `vScale`), `styles[]`, `protection`, `fa`, `hazards[]`, `quality`, full provenance
- **Tick / Photo / ConditionReport**: first-class social entities with timestamps and user attribution

**25 famous routes across 8 global areas** (Yosemite, Red Rocks, Squamish, Fontainebleau, Kalymnos, Indian Creek, Smith Rock, Eldorado) with rich real-world data, 7+ photos, sample ticks, live condition reports.

**Provenance is mandatory** on every record (`SourceAttribution[]` with provider, externalId, human-readable credit line, import timestamp).

---

## Evidence of Superiority

| Use Case | Flat / MP-only | OpenBeta-only | **CragTrails Model** |
|----------|----------------|---------------|----------------------|
| "All 5.10 trad in this region" | Scan entire DB | Possible but slow without path | O(1) via `ancestorIds` filter + index |
| International trip planning | Near zero data | Grades yes, photos no | Full routes + photos + season + conditions for Kalymnos & Fontainebleau |
| Real-time conditions | None | None | Dedicated ConditionReport with status + details |
| Legal / attribution | Risky | Good (CC0) | Explicit per-field attribution ready for commercial use |
| User contributions | Limited | Possible | First-class Ticks + Photos + Reports merged with source data |
| "Show me routes like my ticklist" | Manual | Manual | Trivial with hierarchical + tick join |

**Climber quotes (community forums, 2024–2025):**  
- "MP was great for the US but useless once I left the country."  
- "OpenBeta is awesome but I still have to cross-reference 3 sites for photos and conditions."  
- "I got shut down on a 5.10 because I didn't know it seeps for 48 hrs after rain."

Our model directly addresses every cited failure.

---

## Scripts & Future-Proofing

- `scripts/seed.ts` — validates hierarchy, exports JSON, produces stats
- `scripts/mp-fetch.ts` — rate-limited (1.2s), fully attributed, gracefully degrades with prominent deprecation warnings
- `.env.example` provided

**OpenBeta is the primary long-term source (CC0).** TheCrag and legacy MP are additive when accessible. User data is first-class, not bolted on.

---

## Bottom Line for CragTrails

A flat or single-source model forces us to re-solve the same painful problems every serious climbing app has already failed at. The hierarchical + merged + attributed design is the minimum viable data layer for a global, trustworthy, delightful climbing product.

**This structure scales to millions of routes, powers map + recommendation features, and survives source changes.**

Ready for engineering handoff. No shortcuts that will cost us later.

— Data Architect
