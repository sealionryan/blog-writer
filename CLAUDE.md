# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude-Powered Blog Workflow system that transforms keywords into publication-ready blog articles through an automated multi-agent architecture. The system combines a CLI-based agent framework with both web interface and n8n workflow implementations.

### Architecture Patterns

**Master-Sub-Agent Pattern**: The system uses a sophisticated orchestrator that coordinates specialized sub-agents for different phases of content creation.

**Agent Framework**: Built on the Claude Sub-Agents CLI framework (`@webdevtoday/claude-agents`) with custom agents in `agents/.claude/`

## Commands & Usage

### Primary Commands

**Complete Blog Workflow (Recommended)**:
```bash
# Use the master orchestrator for end-to-end blog creation
> /blog-orchestrate

# Inputs required:
# - search_term: keyword or working title
# - context: background, tone, audience details
# - keywords: optional CSV of target SEO terms  
# - allow_web: true to enable SERP sampling for research
```

**Individual Agent Commands**:
```bash
> /blog-brainstorm     # Generate blog ideas and H2 options
> /blog-outline        # Create detailed structured outlines
> /blog-write          # Write full blog posts from outlines
> /blog-review         # Review and optimize completed content
```

**Framework Management**:
```bash
claude-agents list                  # See all available agents
claude-agents list --installed      # See installed agents
claude-agents info <agent>          # Get agent details
```

### 9-Step Workflow Process

1. **Orchestrator**: Workflow kickoff and project brief
2. **Brainstormer**: Generate 20 H2s + 3 intro + 3 conclusion options
3. **Outline Writer**: Select 5-10 H2s, order them, create raw outline
4. **Content Writer**: Suggest 0-5 H3s per H2 (only if needed)
5. **Outline Writer**: Finalize H2/H3 structure
6. **Content Writer**: Write sections (H2s first, intro/conclusion last)
7. **Reviewer**: Review and provide feedback
8. **Content Writer**: Make revisions based on feedback
9. **Orchestrator**: Compile final output files

## Code Architecture

### Agent Structure
```
agents/
├── AGENTS.md                    # Master agent documentation & rules
├── COMPANY_INFO.md             # Brand context for all agents
└── .claude/
    ├── agents/                 # Agent definitions
    │   ├── blog-orchestrator.md
    │   ├── blog-brainstormer.md
    │   ├── blog-outline-writer.md
    │   ├── blog-content-writer.md
    │   └── blog-reviewer.md
    └── commands/               # Command definitions
        ├── blog-orchestrate.md
        ├── blog-brainstorm.md
        ├── blog-outline.md
        ├── blog-write.md
        └── blog-review.md
```

### Web Interface Implementation
```
docs/                           # GitHub Pages deployment
├── index.html                  # Main web interface
├── app.js                      # Core application logic
├── styles.css                  # UI styling
├── agents/                     # JavaScript agent implementations
│   ├── orchestrator.js
│   ├── brainstormer.js
│   ├── outline-writer.js
│   ├── content-writer.js
│   └── reviewer.js
└── utils/                      # Utility modules
    ├── api-client.js          # Claude API integration
    ├── workflow.js            # Workflow management
    └── storage.js             # Local storage handling
```

### n8n Workflow Integration
- **File**: `n8n-blog-workflow.json` - Complete workflow definition
- **Documentation**: `n8n-workflow-documentation.md` - Implementation guide
- **Integration Points**: Ready for Perplexity API and other enhancements

## Development Guidelines

### Agent Development Rules

**Critical**: Always reference `agents/AGENTS.md` before working with agents or sub-agents. This file contains:
- Agent naming conventions
- File structural requirements  
- Quality gates and standards
- Tool access patterns
- Brand voice integration

### Content Quality Standards

- **Word Count**: 1,500-2,500 words for comprehensive posts
- **SEO Optimization**: 1-2% keyword density, natural integration
- **Structure**: Clear H2/H3 hierarchy with logical flow
- **Brand Voice**: Aligned with "Improv for Being a Human®" philosophy
- **Performance**: Complete workflow in under 10 minutes

### Code Conventions

**JavaScript Style** (for web interface):
- Use modern ES6+ syntax
- Implement proper error handling with try/catch
- Follow event-driven architecture for workflow coordination
- Use localStorage for draft persistence
- Implement retry logic for API failures

**Agent Development**:
- Follow master-sub-agent pattern
- Implement quality gates between steps
- Maintain context preservation across handoffs
- Use structured output formats consistently

## File Naming & Organization

### Output Files
Generated content follows these patterns:
- Blog posts: `[search-term].md`
- Metadata: `[search-term]-metadata.json`
- Workflow data: `[search-term]-workflow.json`

### Agent Files
- Agent definitions: `agents/.claude/agents/[agent-name].md`
- Commands: `agents/.claude/commands/[command-name].md`
- Brand context: `agents/COMPANY_INFO.md`

## API Integration

### Web Interface
Uses Puter.js for free Claude API access without exposing API keys:
```javascript
const response = await puter.ai.chat([
    {role: 'user', content: prompt}
], {
    model: 'claude-sonnet-4'  
});
```

### n8n Integration
OpenAI/Claude nodes configured for each agent interaction with proper error handling and retry logic.

## Testing & Quality Assurance

### Quality Gates
Each workflow step has defined quality checkpoints:
- Strategic alignment with content goals
- SEO keyword integration
- Brand voice consistency
- Grammar and readability standards

### Success Metrics
- **Efficiency**: < 10 minutes from keyword to publication-ready article
- **Quality**: ≥ 80% reviewer approval rate on first draft
- **SEO Performance**: Target keyword density and readability scores

## Deployment

### Web Interface Deployment
- **Platform**: GitHub Pages (`/docs` folder)
- **URL**: Automatic deployment from main branch
- **Dependencies**: Vanilla HTML/CSS/JS (no build process required)

### n8n Workflow Deployment
1. Import JSON from `n8n-blog-workflow.json`
2. Configure API credentials  
3. Customize prompts and parameters
4. Add enhancement nodes as needed

## Important Instruction Reminders

**Agent Work Rules**: Always reference `agents/AGENTS.md` before working with agents or sub-agents. This is mandatory for maintaining system consistency.

**File Creation Policy**: Prefer editing existing files over creating new ones. Only create new files when absolutely necessary for the requested functionality.

**Documentation Policy**: Do not proactively create documentation files unless explicitly requested.