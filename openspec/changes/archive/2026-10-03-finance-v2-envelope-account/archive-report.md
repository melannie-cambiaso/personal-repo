## Archive Report: finance-v2-envelope-account Change

**Change**: finance-v2-envelope-account  
**Created**: 2026-09-30  
**Archived**: 2026-10-03  
**Artifact Store**: openspec  
**Status**: ✅ Complete  

### Executive Summary

The `finance-v2-envelope-account` change adds a single, optional "envelope" account (e.g.
"Servicios") to finance-v2: a `transfer` movement from the main account into the envelope,
expenses in the bound category stamped `paidFrom: "envelope"`, main-account totals that exclude
envelope activity, a cumulative envelope balance derived from stored transactions, and a
missing-transfer reminder. All 19 tasks across 3 phases are complete and merged to `main`.
One new capability spec (`finance-v2-envelope-account`) has been synced to the main spec source.

### Phases Completed

| Phase | Status | Artifact | Notes |
|-------|--------|----------|-------|
| Propose | ✅ Done | proposal.md | One envelope, one bound category, one direction; no general multi-account model |
| Spec | ✅ Done | specs/finance-v2-envelope-account/spec.md | 6 requirements, 11 scenarios |
| Design | ✅ Done | design.md | Global config, snapshot `paidFrom` stamp, carried-in balance derived on load |
| Tasks | ✅ Done | tasks.md | 19 tasks across 3 phases (domain, data/actions/hooks, UI) |
| Apply | ✅ Done | `459746a`, `66f4ba8`, `c6f8e35`, `24b996b` | Test-first per task |
| Verify | ✅ Pass | tasks.md 3.7 | See Verification below |
| Archive | ✅ Done | archive-report.md | Artifacts moved, spec synced |

### Specs Synced to Main

| Domain | Action | Summary |
|--------|--------|---------|
| finance-v2-envelope-account | Created | 6 requirements: optional global config, transfer movement, envelope-paid expenses, main totals excluding envelope activity, cumulative balance, missing-transfer reminder |

**File Locations**:
- `openspec/specs/finance-v2-envelope-account/spec.md` — new main spec (synced from delta)

### Verification

- Tests: ✅ 864 passing at merge, plus 1 later test for scenario "Editing a past month updates the balance" (`24b996b`)
- Build: ✅ `npm run build` green (Next.js 16.2.9 Turbopack, TypeScript clean)
- Manual: scenarios 3, 4, 5, 9 and 10 checked by the user; 1, 2, 6, 7, 8 and 11 covered by
  automated tests. Remaining manual checks were skipped on purpose to protect production data.

### Known Gaps

- The native review of `24b996b` could not complete: the reviewer model refused the review relay
  prompt. The commit (test-only plus task bookkeeping) was delivered without that review by user
  decision.
