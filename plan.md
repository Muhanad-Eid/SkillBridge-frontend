# SkillBridge Graduation Completion Plan

## Scope rule

Finish the locked Graduation Project specification before adding commercial
platform infrastructure. Every task must close an FR-01 through FR-21 or a
required NFR gap, protect the Evidence Issuance Protocol, or make a required
role journey usable and defensible.

The following are deferred unless a verified requirement makes them necessary:

- authentication architecture replacement
- TanStack Query migration
- generated OpenAPI client migration
- S3-compatible storage and malware quarantine pipeline
- commercial observability, automated rollback, and disaster-recovery drills
- new ranking, recommendation, payment, social, blockchain, or credential scope

## Stage 1 - Freeze and verify the baseline

- [x] Preserve existing uncommitted work in both repositories.
- [x] Separate Vitest unit files from Playwright specifications.
- [x] Stabilize the application handoff E2E with isolated opportunity data.
- [x] Pass backend tests, frontend lint/build/unit tests, and Playwright.
- [x] Create the FR-01 through FR-21 and NFR-01 through NFR-12 traceability matrix.
- [x] Freeze the fixed white authenticated sidebar as the portal shell.
- [x] Restore the deliberately approved older public landing composition with
  honest SkillBridge facts instead of fabricated users, partners, or statistics.

## Stage 2 - Finish every required workflow

Verify each requirement end to end, including its negative rules:

- authentication, authorization, profile completion, and provider verification
- all five opportunity types
- Evidence Contract versioning and participation pinning
- application responses, PDF CV, work samples, accept/reject/withdrawal
- Work Hub milestones, submissions, revisions, protected final deliverables,
  feedback, and messages
- team declaration, confirmation/dispute, non-response handling, provider
  resolution, and locked attribution
- University Training hours, reports, outcomes, monitoring, both approvals, and
  authorized export
- stable criterion evaluation, exact readiness blockers, same-lineage validation,
  issuance, and one-active-card enforcement
- Skill Evidence Card, Evidence Trace, Claim Boundary, criterion coverage,
  sharing, revocation, supersession, and material-resubmission invalidation
- administrator verification, lifecycle correction, and audit history

## Stage 3 - Finish the signature evidence experience

The strongest visual and interaction treatment belongs to the canonical evidence
workflow:

- Evidence Contract
- Work Hub
- Team Contribution Attribution
- Criterion Evaluation
- University Training
- Evidence Issuance Readiness
- Skill Evidence Card
- Evidence Trace
- Claim Boundary
- Public Evidence
- Admin Evidence Lifecycle and Audit

Use `Evidence Replay` only as a presentation layer over canonical evidence data.
Do not introduce a separate Proof Engine protocol or rename report concepts.

## Stage 4 - Quality and defensibility

- expand browser coverage for the remaining Stage 2 handoffs
- run PostgreSQL migration, concurrency, lineage, and protected-file integration tests
- verify anonymous projections never expose protected or internal fields
- complete keyboard, labels, focus, contrast, reduced-motion, and responsive QA
- protect long forms from accidental data loss without storing confidential work
- validate loading, empty, unavailable, stale, and error states route by route
- keep refactors behind behavior tests; avoid platform-wide migrations

## Stage 5 - Graduation deployment

- one HTTPS origin with environment secrets outside source control
- private PostgreSQL database and protected server-side file access
- explicit migration and backup procedure
- liveness/readiness health checks
- reproducible Docker or host deployment verification
- demonstrate required role journeys against the deployed build

Commercial monitoring, automated rollback, object-storage migration, and broader
operations automation remain optional after the graduation release gate passes.

## Graduation release gate

SkillBridge is complete when:

- FR-01 through FR-21 are implemented and traceable
- required NFRs are verified with evidence appropriate to the requirement
- critical positive and negative cross-role journeys pass
- backend/frontend tests and migrations pass
- protected/public evidence boundaries hold
- the canonical evidence routes are visually complete, responsive, and accessible
- no P0/P1 workflow defect remains

## Current verified baseline

- backend release tests: 152 passed
- frontend unit tests: 57 passed across 13 files
- frontend lint and production build: passed
- Playwright: 7 passed, including application handoff, all seeded role portals,
  role guarding, participant work/evidence, University Training approval gates,
  anonymous public evidence and Claim Boundary, and mobile navigation
