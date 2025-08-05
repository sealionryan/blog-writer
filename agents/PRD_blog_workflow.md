# Product Requirements Document – Blog Creation Workflow

|               |                                          |
|---------------|------------------------------------------|
| **Document ID** | PRD-BLOG-WORKFLOW-v1 |
| **Author**      | Claude Assistant |
| **Date**        | 2025-08-03 |
| **Status**      | Draft |

---

## 1. Problem Statement
Manual blog-post production is slow, inconsistent, and error-prone. We need an end-to-end automated agent workflow that reliably transforms a keyword or working title into a publication-ready Markdown article while enforcing quality gates.

## 2. Goals & Success Criteria
| Goal | Metric | Target |
|------|--------|--------|
| Reduce human touch-points | # of manual interventions | ≤ 2 per article |
| Time-to-publish | Minutes from kickoff to `✅ ready` | < 10 min |
| Quality approval rate | Reviewer passes on first loop | ≥ 80% |

## 3. Scope
Included:
* Eight-step agent flow (see `BLOG_WORKFLOW.md`)
* Scaffolding of agent specs & command files
* Storage of artefacts: final post + metadata

Excluded:
* Front-end CMS integration
* Deployment automation

## 4. Functional Requirements
1. **Kick-off interface** accepts `search_term`, `context`, `keywords`, `allow_web`.
2. **Brainstormer** returns heading ideas exactly per spec.
3. **Outline Writer** produces clean Markdown outlines (two passes).
4. **Content Writer** can:
   * Suggest H3s
   * Write per-section Markdown
5. **Reviewer** loop until `✅ ready`.
6. **Orchestrator** writes output files to project root.

## 5. Non-Functional Requirements
* Responses strictly follow output-format rules (token economy).
* The workflow must be idempotent – reruns with same slug overwrite files safely.
* All agents must read shared memory keys, not rely on long parameter chains.

## 6. Milestones
| ID | Task | Owner | ETA |
|----|------|-------|-----|
| T1 | Create workflow doc | Orchestrator | ✅ Done |
| T2 | Scaffold agent files & commands | Claude | 1 h |
| T3 | Implement memory hand-offs | Claude | 1 h |
| T4 | Validate with test run | Team | 2 h |

## 7. Open Questions
1. Should Brainstormer’s web access be on by default?
2. Where to store generated images if we add them later?
