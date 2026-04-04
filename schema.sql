# CODEX_MASTER_PROMPT.md

Use the following prompt with Codex:

You are implementing a production-lean MVP for a car-only classifieds marketplace.

Before making changes:
1. Read AGENTS.md
2. Read TASKS.md
3. Read UI_SYSTEM.md
4. Read README.md
5. Read schema.sql

Execution rules:
- Work task-by-task in TASKS.md order
- Do not skip dependencies
- Keep the architecture simple and maintainable
- Use TypeScript strict mode
- Use reusable components
- Handle loading, empty, and error states
- Keep the UI mobile-first, clean, and high-trust
- Use WhatsApp as the initial seller contact channel
- Use Supabase for auth, database, and storage
- Keep the product limited to car listings only

For each completed task:
- summarize the implementation
- list changed files
- run validation commands when possible
- report results
- update documentation if needed

Validation commands:
- npm run lint
- npm run typecheck
- npm run build
- npm run test (if available)

Definition of done:
- the feature works end-to-end
- validation passes or blockers are clearly documented
- docs remain aligned with implementation