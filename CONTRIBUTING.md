# Contributing to CragTrails

Thank you for your interest in CragTrails. We are building a deliberately focused, high-trust, map-first climbing guide that prioritizes real climber problems, radical simplicity (10-year-old friendly), and long-term product quality over feature volume.

This document defines **how** we work. The process below is not bureaucracy — it is the mechanism that protects the soul of the product.

---

## The Skeptical CEO Review Process (Mandatory for Every PR)

**Core rule:** The lead maintainer (CEO) begins every code, design, or documentation review by assuming the proposed change *adds bloat or attacks the wrong priority*. Approval is not the default. It is earned.

**No PR will be merged without a complete "Proof of Value" section** (see template below) that directly answers the four required questions with evidence.

At minimum, **one other reviewer** (not the author) must also approve after the Proof of Value has been provided.

### The Four Required Questions (Every PR)

Your PR description **must** contain a top-level `## Proof of Value` section that answers:

1. **What climber problem does this solve?**  
   Include a real quote from a climber (or a close AllTrails analogy that maps cleanly to vertical-world behavior). Vague "users would like X" is not sufficient.

2. **Simplicity impact**  
   Does this change make navigation or comprehension harder for a 10-year-old? Reference specific UI patterns in the current app (search + map hybrid, grade badges, preview cards, bottom sheets, big tap targets, etc.). Quantify added complexity if possible.

3. **Growth / retention evidence**  
   What data, user testing, or behavioral analogy shows this will increase (or at least not harm) climber acquisition and repeat usage? "It would be cool" is not evidence.

4. **Why not a simpler alternative?**  
   What is the absolute simplest version of this idea? Why does the simpler version fail to solve the problem identified in question 1?

### Review Philosophy

The CEO (lead maintainer) will:
- Start skeptical.
- Demand clear answers to the four questions.
- Look for signs of scope creep, "while we're here" additions, or solutions in search of problems.
- Only approve when the Proof of Value is convincing **and** at least one other qualified reviewer has also approved.

This applies to **all** changes: new features, refactors, UI tweaks, dependency additions, docs, even "small" improvements.

### Why We Do This (The Governance Advantage Over Normal OSS)

Most open source projects suffer from a structural problem: the marginal cost of adding a feature is near zero for contributors, while the long-term cost (complexity, maintenance, user confusion, diluted focus) is paid by everyone — especially future contributors and users.

The result is classic:
- Enthusiastic "nice to have" PRs accumulate.
- The original delightful, opinionated core becomes a committee-designed mess.
- New users (especially kids and casual climbers) bounce off the complexity.
- Serious contributors burn out maintaining edge cases no one uses.
- The product slowly becomes mediocre.

CragTrails rejects this pattern. The Skeptical CEO process creates **asymmetric pressure toward quality and focus**.

**Long-term advantages this governance produces:**

- **Higher retention and word-of-mouth** — A simple, trustworthy, joyful experience spreads faster than a bloated one. Parents recommend it. New climbers don't get overwhelmed.
- **Sustainable maintainer energy** — Reviews are high-signal. Time is spent on changes that matter.
- **Better contributor experience** — When something ships, it ships because it was proven valuable. Contributors feel their effort produced real user delight, not technical debt.
- **Strong product identity** — We know exactly what we are (map-first discovery + trust layer) and what we are not. This clarity attracts the right contributors and repels scope creep.
- **Trust compounds** — The same rigor we apply to the product (see the Admin Trust Console and "non-negotiable for scale" banners) is applied to the codebase itself. Users and contributors can feel the consistency.
- **Defensibility** — In a world of fast-follower climbing apps, the combination of technical quality + obsessive simplicity + trust is extremely hard to copy.

This is not slower development. It is *higher-quality* development that compounds. We would rather ship nothing than ship something that makes the product worse over a 5–10 year horizon.

**Empirical pattern observed across OSS and consumer software:** Projects without strong anti-bloat mechanisms trend toward mediocrity and abandonment. Projects with explicit skeptical filters (whether cultural or process-enforced) disproportionately produce the focused, loved tools that endure (think early AllTrails, certain indie apps, or famously opinionated libraries). CragTrails is deliberately engineering this outcome at the governance layer.

If this philosophy resonates with you, you will love contributing here. If you prefer high-velocity feature factories, there are many other projects.

---

## How to Propose Work

1. **Read the docs first** (non-negotiable):
   - `README.md` (especially the "Built by Skeptical Agents" section and current experience)
   - This `CONTRIBUTING.md`
   - `AGENTS.md` (if you are an AI agent)
   - Relevant source in `app/`, `lib/types.ts`, `lib/seed-data.ts`, `app/globals.css`

2. **Start with an issue** (strongly recommended for anything non-trivial). Use the feature request template. Include an early draft of the Proof of Value section.

3. **Implement only after discussion** (for larger changes). Small, obvious improvements that clearly pass the four questions can go straight to PR.

4. **In your PR**, use the Pull Request template. It requires the full Proof of Value section.

5. **Be prepared to iterate** on the Proof of Value itself. This is normal and healthy.

---

## Development Setup

```bash
npm install
npm run dev
```

- Main experience: `/`
- Trust Console demo: `/admin` (credentials shown in UI)
- The map component lives at `app/components/CragMap.tsx`
- Rich UI styles and 10yo-friendly patterns are in `app/globals.css`
- Data models and vision: `lib/types.ts` + `lib/seed-data.ts`

**Next.js note:** This is not the Next.js you may know from older tutorials. Read the relevant guides in `node_modules/next/dist/docs/` before making structural changes.

Run `npm run lint` and ensure the prototype experience remains delightful and fast.

---

## Code of Conduct & Trust

We extend the same care to contributors that we extend to end users. Be respectful. Focus on the problem and the evidence, not on personal preference.

The Trust & Safety principles in the Admin console ("Kids climb here") also apply to how we treat the community and the codebase.

---

## Built by Skeptical Agents

The phrase is not ironic. A rotating cast of rigorous AI agents (plus the human lead maintainer) act as the first line of defense against bloat. Every major piece of documentation and process you are reading was stress-tested under the same skeptical lens applied to code.

The agents' job is to ask the hard questions *before* the code is written. This saves human time and protects the product.

If an AI agent (including future versions of this one) proposes work without a strong Proof of Value draft, it will be rejected immediately — just like any human contributor.

This is a feature, not a bug.

---

## Questions?

Open a discussion issue or reach out via the project's GitHub discussions. We are happy to help you shape a strong Proof of Value before you invest significant time.

Welcome. We are glad you're here — as long as you are willing to be skeptical with us.

— The CragTrails Maintainers
