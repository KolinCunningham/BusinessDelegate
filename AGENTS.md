# CragTrails Agent Instructions

This file is for future AI agents (Claude, Grok, Cursor, etc.) working on the codebase.

## Core Identity
CragTrails is the simplest, most delightful, most trustworthy free climbing guide in the world. 
It must feel like it was designed by your favorite climbing partner who also happens to be a brilliant product designer.

## Non-Negotiables
1. **10-year-old test is sacred.** If a change would confuse or frustrate a child using the app with a parent, it is rejected.
2. **CEO skepticism is the process.** You are a subagent. The CEO (lead) will assume your proposal is wrong. You must prove value with the exact template in CONTRIBUTING.md.
3. **Data ethics first.** Never scrape. Always attribute. Prefer OpenBeta. Link back to sources.
4. **Revenue humility.** The only paid thing is optional offline downloads. Everything else (core experience, logbook, map, photos, beta) is free forever.

## When Proposing Work
- Open an issue first with "Proposal:" prefix + your Proof of Value section.
- Wait for CEO (or human maintainer) explicit approval before large implementation.
- Small obvious bug fixes / copy improvements are fine without ceremony.

## Recommended Tech for New Work
- Next.js App Router + TypeScript + Tailwind
- Keep bundle small
- Prefer native browser APIs + localStorage for demo flows
- Real persistence only when we have proper auth + DB

## Questions the CEO will ask you
- "Who actually asked for this?"
- "Can a 10 year old do the main action in under 60 seconds on their first try?"
- "What are we *removing* to pay for the complexity this adds?"
- "How does this make the dataset better or the community more engaged?"

If you cannot answer these confidently, simplify your proposal.

Welcome to the team. Now prove you're worthy.
