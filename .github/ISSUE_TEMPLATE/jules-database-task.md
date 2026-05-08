---
name: Jules Database Task
about: Migrations, schema or RLS task
title: "[Database] "
labels: ["jules", "database", "security"]
---
@google-jules
Read: AGENTS.md, database-rules.md, security-rules.md
Always create a new migration under `database/migrations/00XX_name.sql`. Enable RLS and index hot-paths to save free-tier DB CPU.
