# 📰 Claude-Powered Blog Workflow

Automated, multi-agent system that takes a single keyword and delivers a fully-written, SEO-optimised Markdown article. Built on the [Claude Sub-Agents](https://github.com/webdevtoday/claude-agents) framework.

---

## 🚀 Quick Start
```bash
# Kick off the end-to-end workflow (recommended)
> /blog-orchestrate

# Provide the brief when prompted:
#   – search_term  (keyword or working title)
#   – context      (background, tone, audience)
#   – keywords     (optional CSV of target SEO terms)
#   – allow_web    (true to let the Brainstormer sample SERPs)
```
The master *Blog Workflow Orchestrator* will coordinate all sub-agents and return a finished article plus metadata files.

### Two-Phase Option  
Prefer human control over H2 selection?  
Run `/blog-orchestrate`, review the brainstormed headings, reply with a `# keep / # drop` list, then call:
```bash
/blog-continue --selection "<your selection block>"
```

---

## 🖥️ Repository Tour
| File | Purpose |
|------|---------|
| **BLOG_WORKFLOW.md** | Full eight-step playbook (single source of truth) |
| **WORKFLOW_QUICK_REFERENCE.md** | One-page cheat-sheet of the same steps |
| **AGENTS.md** | Detailed reference for every Claude agent in the system |
| **tests/** | Sample run artefacts (brainstorm → outline → H3s) |
| **.claude/** | Agent prompt files & command wrappers (consumed by CLI) |

---

## 🧩 Agent Roster
| Role | Command | Key Task |
|------|---------|---------|
| **Orchestrator** | `/blog-orchestrate` | Oversees complete workflow |
| Brainstormer | `/blog-brainstorm` | Generate intro ideas, 20 H2s, conclusion ideas |
| Outline Writer | `/blog-outline` | Select 5-10 H2s & finalise H3 hierarchy |
| Content Writer | `/blog-write` | Suggest 0–5 H3s per H2 & write sections |
| Reviewer | `/blog-review` | Edit & polish final draft |

---

## ✨ Highlights
* **Master-Sub-Agent Architecture** – clear separation of duties with quality gates at every phase.
* **Flexible H3 Logic** – each H2 gets 0–5 H3s *only if needed* to avoid bloated outlines.
* **Human-in-the-Loop** – optional selection step lets editors choose which H2s make the final cut.
* **Extensible** – add new agents (e.g., Image Generator, SEO Auditor) by dropping prompt files into `.claude/agents/`.

---

## 🛠️ Installation (once per machine)
```bash
npm install -g @webdevtoday/claude-agents   # or yarn global add
claude-agents install --project             # sets up local hooks
```

---

## 📈 Future Work
* Add automated image suggestions
* Integrate a social-media blurb generator
* Collect performance metrics after publication

---

## License
MIT © 2025  
Made with ❤️ and with Claude.