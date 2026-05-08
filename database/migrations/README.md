# Migration Strategy

This project has a long migration history. To reduce confusion while staying production-safe:

1. Do not rename or delete already-applied migration files in production.
2. Use `database/migrations/.active-migrations.txt` as the source list for migration execution.
3. Regenerate the active list after adding new migrations:
   - `node scripts/migration-manager.mjs sync-active-list`
4. For consolidation experiments, use:
   - `node scripts/consolidate-migrations.mjs consolidate --dry-run`

## Why this approach

- Renaming/deleting historical files can break checksum validation and rollout consistency.
- Active-list mode keeps migration execution deterministic without destructive cleanup.
- Consolidation remains opt-in and non-destructive until validated in a fresh environment.
