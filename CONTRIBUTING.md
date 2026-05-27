# Contributing to CragTrails

**Welcome, climber.** Whether you're a human or an AI agent, thank you for caring enough to make this better.

This project has one non-negotiable rule:

> **The CEO (lead maintainer) assumes every proposed change is wrong, bloated, or solving the wrong problem until you prove otherwise with evidence.**

This is not gatekeeping. This is how we keep the app simple enough for a 10-year-old while still being the most powerful free climbing tool on Earth.

---

## The Skeptical CEO Review Process (Mandatory)

Every Pull Request **must** contain a **"Proof of Value"** section in the PR description. Use this template exactly:

```markdown
## Proof of Value (required)

**1. What climber problem does this solve?**
(Quote a real Reddit/r/climbing comment, forum post, or AllTrails analogy. "New climbers can't find moderate routes near them" is better than "I think this would be cool.")

**2. 10-year-old test**
Describe exactly how a 10 year old would encounter this feature. 
- Number of taps to complete the core action?
- Does any text or UI element require adult explanation?
- Would their parent be annoyed or delighted?

**3. Why not a simpler alternative?**
What did you consider cutting? Why was the full version necessary?

**4. Evidence of positive impact**
- Retention / frequency / accessibility / data quality / revenue sustainability?
- Any user testing, even informal ("showed to 3 friends at the crag")?

**5. Risks & mitigation**
How could this make the app worse (complexity, data quality, trust, paywall creep)? How do we prevent that?
```

**PRs without this section will be closed immediately with a polite link back to this file.**

The CEO will:
1. Start the review by listing every reason this might be a bad idea.
2. Ask hard follow-up questions.
3. Only approve once the proposer has convincingly answered every concern **and** at least one other reviewer (human or future agent) has +1'd.

This process is public. Future generations of contributors will see the debates.

---

## What We Are Looking For

**High value (prove these extra hard):**
- Making first-time outdoor climbers feel welcome and competent
- Improving data quality or attribution
- Real offline experience (the only premium feature we will ever have)
- Safety / trust / moderation improvements
- Beautiful micro-interactions that make logging a send feel *good*

**Usually rejected (prove extremely hard):**
- New filters that only power users will understand
- Social features before the core logbook + map experience is perfect
- Any change that makes the bottom nav or primary discover flow more than 3 taps deep
- Dark patterns, aggressive paywalls, or "engagement" tricks that feel manipulative

---

## For AI Subagents (Future Agents Reading This)

You are subject to exactly the same rules as humans.

When the CEO spawns you:
- You must output your **complete Proof of Value** before writing any code.
- You will be challenged.
- You may be asked to simplify or abandon your approach.
- Only after CEO approval + human or peer review will your work be merged.

The best agents are the ones whose proposals survive the most skeptical scrutiny.

---

## Technical Guidelines

- Keep it simple. Prefer Tailwind + a few well-chosen libraries over heavy frameworks.
- Mobile-first. Desktop is a nice-to-have.
- Every new UI element must have a 48px+ tap target.
- All user-generated content goes through the Admin console before appearing publicly.
- Always show data sources on routes.
- Performance: the app must feel instant even on mediocre phones with bad signal.

---

## Getting Started (Code)

```bash
npm install
npm run dev
```

See the Admin console at `/admin` (demo credentials in the code).

---

## Sponsorship & Revenue

We are proudly sponsored by climber-owned companies. All revenue discussions happen in the open (see the Partners section in the app).

If you represent a brand that wants to keep CragTrails free for the next generation of climbers, please open an issue.

---

## License

By contributing, you agree your code is MIT licensed.

Thank you for helping build the climbing tool we all wish existed when we started.

Now go outside and climb something.

— The CragTrails CEO
