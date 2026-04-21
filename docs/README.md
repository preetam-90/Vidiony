# Vidiony Documentation Index

This directory contains the project documentation bundle used for final-year review and onboarding.

## Document Map

| Document | Purpose |
|----------|---------|
| `architecture.md` | High-level system design, module boundaries, and runtime flow |
| `api.md` | API usage guide and Swagger/OpenAPI access points |
| `database.md` | Database entities, relationships, and schema notes |
| `features.md` | Feature catalogue with screenshot references |

## Quick Access

- Architecture diagram asset: `architecture.svg`
- Backend API interactive docs: `http://localhost:4000/docs`
- Backend route reference (detailed): `../backend/README.md`

## For Reviewers

If you are evaluating this project for a final-year assessment, review in this order:

1. `../README.md` (project overview)
2. `architecture.md` (system understanding)
3. `api.md` (service contract and endpoint access)
4. `database.md` (data model depth)
5. `features.md` (functional coverage)

## Maintenance Notes

- Keep endpoint names in `api.md` synced with backend routes in `backend/src/app.ts`.
- Keep model descriptions in `database.md` synced with `backend/prisma/schema.prisma`.
- Replace screenshot placeholders with dedicated feature captures before final submission.
