# OtoBurada AI Rules Setup

This repository is optimized for autonomous AI agents (such as Jules, Claude, Roo) using **free-tier limits** on Vercel, Supabase, Sentry, Upstash, and Resend.

## Documentation Hierarchy

1. **AGENTS.md**: The "Compass". Ultimate vision, non-negotiable rules, and architectural standards.
2. **TASKS.md**: The "Backlog". Execution order and detailed acceptance criteria.
3. **PROGRESS.md**: The "Log". Implementation history, specific decisions, and immediate next steps.
4. **.agents/rules/**: Helper guidelines with automated trigger tags to optimize AI context size and token costs.

## Directory Structure

```txt
oto-burada/
├── AGENTS.md
├── TASKS.md
├── PROGRESS.md
├── README.md
├── RULES_SETUP.md
├── .github/
│   ├── JULES_INSTRUCTIONS.md
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       ├── jules-frontend-task.md
│       ├── jules-backend-task.md
│       ├── jules-database-task.md
│       └── jules-bugfix-task.md
└── .agents/
    └── rules/
        ├── README.md
        ├── global-rules.md
        ├── frontend-rules.md
        ├── backend-rules.md
        ├── database-rules.md
        ├── security-rules.md
        ├── testing-rules.md
        └── ui-ux-rules.md
```

## Features for Jules
- **Automated Triggers**: Frontend, Backend, Database, and UI rules use files-specific globs (`trigger: glob: ...`) or `trigger: always_on` to keep context footprint small and avoid token waste.
- **Free-Tier Protection**: Detailed guardrails to respect rate limits, connection pooling, e-mail limits, storage limits, and prevent white-screen crashes through graceful degradation.
