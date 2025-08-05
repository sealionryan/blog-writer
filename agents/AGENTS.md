# Blog Agents Documentation

## 🎯 **Overview**

This document provides comprehensive documentation for our custom blog-creation agent team built using the Claude Sub-Agents framework. We've created a sophisticated **master-sub-agent architecture** that provides strategic oversight while leveraging specialized expertise at each phase of the content creation process.

> **Note** The definitive workflow instructions live in `BLOG_WORKFLOW.md` (full playbook) and `WORKFLOW_QUICK_REFERENCE.md` (cheat-sheet). Older setup notes have been merged here and removed to prevent drift.

## 🏗️ **Architecture Overview**

### **Brand Context Integration**
All agents reference `agents/COMPANY_INFO.md` for consistent brand voice and messaging aligned with Vegas Improv Power's:
- **"Improv for Being a Human®"** philosophy
- **Functional Improv®** methodology  
- Professional yet playful tone
- Focus on real-world applications and personal growth

### **Master-Sub-Agent Pattern**
Our blog creation workflow uses a **master agent** (orchestrator) that coordinates specialized **sub-agents** for specific tasks:

- **Master Agent**: Maintains strategic oversight, quality standards, and project context
- **Sub-Agents**: Focus on their specific areas of expertise with deep specialization
- **Quality Gates**: Review and approval at each phase ensures consistent quality
- **Context Preservation**: Project requirements maintained across all handoffs

## 🤖 **Agent Team Structure**

### 🎯 **Blog Workflow Orchestrator** (Master Agent)
**File**: `agents/.claude/agents/blog-orchestrator.md`  
**Command**: `/blog-orchestrate`  
**Purpose**: Manage the complete blog creation workflow from ideation to publication

#### **Core Competencies**
1. **Workflow Orchestration**: Manage the complete blog creation process end-to-end
2. **Sub-Agent Coordination**: Delegate tasks to specialized agents while maintaining oversight
3. **Quality Assurance**: Ensure consistent quality and brand standards across all content
4. **Project Management**: Track progress, manage timelines, and handle dependencies
5. **Content Strategy**: Align individual blog posts with broader content strategy

#### **Tools Available**
- Read, Write, Edit, MultiEdit, WebSearch, Grep, Glob, TodoWrite, Task

#### **Workflow Phases**
1. **Project Initiation & Planning**: Analyze requirements, define goals, set standards
2. **Ideation & Strategy**: Delegate to blog-brainstormer
3. **Outline Development**: Delegate to blog-outline-writer
4. **Content Creation**: Delegate to blog-content-writer
5. **Review & Optimization**: Delegate to blog-reviewer
6. **Final Approval & Publication**: Quality review and publication preparation

---

### 🤔 **Blog Brainstormer** (Sub-Agent)
**File**: `agents/.claude/agents/blog-brainstormer.md`  
**Command**: `/blog-brainstorm`  
**Purpose**: Generate blog post ideas, topics, and content strategies

#### **Core Competencies**
1. **Topic Ideation**: Generate blog post ideas based on trends, keywords, and audience needs
2. **Content Strategy**: Develop comprehensive content plans and editorial calendars
3. **SEO Research**: Identify high-value keywords and search opportunities
4. **Audience Analysis**: Understand target demographics and content preferences
5. **Outline Creation**: Structure blog posts for maximum readability and engagement

#### **Tools Available**
- Read, Write, Edit, MultiEdit, WebSearch, Grep, Glob

#### **Output Format**
- Topic Summary with target audience and SEO keywords
- Content Type classification (how-to, analysis, case study, etc.)
- Estimated word count and reading level
- Detailed outline with sections and sub-points
- Content strategy alignment and success metrics

---

### 📝 **Blog Outline Writer** (Sub-Agent)
**File**: `agents/.claude/agents/blog-outline-writer.md`  
**Command**: `/blog-outline`  
**Purpose**: Transform brainstormed ideas into detailed, structured blog post outlines

#### **Core Competencies**
1. **Outline Expansion**: Transform brief ideas into detailed content structures
2. **Content Flow**: Create logical progression and narrative arcs
3. **SEO Integration**: Embed keywords naturally throughout the outline
4. **Engagement Optimization**: Structure content for maximum reader retention
5. **Conversion Focus**: Design outlines that drive reader action

#### **Tools Available**
- Read, Write, Edit, MultiEdit, WebSearch, Grep, Glob

#### **Outline Template**
```markdown
# [Compelling Headline with Primary Keyword]

## Meta Information
- Target Audience, Primary/Secondary Keywords
- Estimated Word Count, Content Type, Reading Level

## Introduction (150-200 words)
- Hook, Problem Statement, Value Promise, Content Preview

## Main Content Sections (3-4 sections, 300-400 words each)
- Sub-points with supporting details
- Examples, case studies, and data
- Visual elements and formatting suggestions

## Conclusion (150-200 words)
- Summary, Final Takeaway, Call-to-Action, Related Content

## SEO Elements
- Meta Title, Meta Description, Featured Image
- Internal/External Links, Schema Markup
```

---

### ✍️ **Blog Content Writer** (Sub-Agent)
**File**: `agents/.claude/agents/blog-content-writer.md`  
**Command**: `/blog-write`  
**Purpose**: Write engaging, SEO-optimized blog posts from detailed outlines

#### **Core Competencies**
1. **Content Creation**: Write engaging, informative blog posts from detailed outlines
2. **SEO Optimization**: Naturally integrate keywords and optimize for search engines
3. **Reader Engagement**: Create content that holds attention and drives action
4. **Brand Voice**: Maintain consistent tone and style across all content
5. **Conversion Focus**: Write content that moves readers toward desired actions

#### **Tools Available**
- Read, Write, Edit, MultiEdit, WebSearch, Grep, Glob

#### **Writing Techniques**
- **Opening Hooks**: Statistics, questions, stories, problems, promises
- **Transition Techniques**: Bridge, question, contrast, time, summary transitions
- **Call-to-Action Examples**: Download, subscribe, comment, share, learn more
- **SEO Integration**: Natural keyword placement, featured snippet optimization

---

### 🔍 **Blog Reviewer** (Sub-Agent)
**File**: `agents/.claude/agents/blog-reviewer.md`  
**Command**: `/blog-review`  
**Purpose**: Review, edit, and optimize completed blog posts

#### **Core Competencies**
1. **Content Review**: Comprehensive analysis of blog post quality and effectiveness
2. **Editing & Polish**: Improve clarity, flow, and engagement
3. **SEO Optimization**: Enhance search engine visibility and ranking potential
4. **Grammar & Style**: Ensure professional, error-free content
5. **Performance Analysis**: Identify areas for improvement and optimization

#### **Tools Available**
- Read, Write, Edit, MultiEdit, WebSearch, Grep, Glob

#### **Review Checklist**
- **Content Quality**: Headline, introduction, structure, engagement, conclusion
- **SEO Optimization**: Keywords, meta information, internal links, technical SEO
- **Grammar & Style**: Grammar, spelling, consistency, readability
- **Engagement Elements**: Visual elements, social proof, call-to-actions

## 🚀 **Usage Instructions**

### **Complete Workflow (Recommended)**
```bash
# Use the master orchestrator for end-to-end blog creation
> /blog-orchestrate

# Provide comprehensive project brief:
- Project requirements and constraints
- Target audience and content goals
- Brand guidelines and quality standards
- SEO strategy and keyword targets
- Timeline and milestones
```

The orchestrator will manage the complete process:
1. **Delegate ideation** to blog-brainstormer
2. **Review and approve** brainstormed ideas
3. **Delegate outline creation** to blog-outline-writer
4. **Review and approve** detailed outlines
5. **Delegate content writing** to blog-content-writer
6. **Review and approve** draft content
7. **Delegate review/editing** to blog-reviewer
8. **Final approval** and publication preparation

### **Individual Agent Usage**
```bash
# For specific tasks, use individual agents:

# Generate blog ideas
> /blog-brainstorm
# Provide: Topic, target audience, content goals, SEO keywords

# Create detailed outline
> /blog-outline
# Provide: Approved topic, target audience, content type, SEO keywords

# Write full blog post
> /blog-write
# Provide: Approved outline, brand guidelines, tone preferences, SEO requirements

# Review and optimize
> /blog-review
# Provide: Completed content, target audience, SEO goals, quality standards
```

## 📁 **File Structure**

```
agents/
├── COMPANY_INFO.md                      # Brand context for all agents
└── .claude/
    ├── agents/
    │   ├── blog-orchestrator.md        # Master agent - workflow management
    │   ├── blog-brainstormer.md        # Sub-agent - ideation specialist
    │   ├── blog-outline-writer.md      # Sub-agent - outline creation
    │   ├── blog-content-writer.md      # Sub-agent - content writing
    │   └── blog-reviewer.md            # Sub-agent - review & editing
    └── commands/
        ├── blog-orchestrate.md         # /blog-orchestrate command
        ├── blog-brainstorm.md          # /blog-brainstorm command
        ├── blog-outline.md             # /blog-outline command
        ├── blog-write.md               # /blog-write command
        └── blog-review.md              # /blog-review command
```

## 🎯 **Quality Gates & Standards**

### **Orchestrator Quality Gates**
```yaml
ideation:
  - Strategic alignment with content goals
  - SEO keyword integration
  - Target audience fit
  - Content calendar placement

outline:
  - Logical content flow
  - SEO optimization
  - Engagement elements
  - Brand voice consistency

content:
  - Writing quality and engagement
  - SEO keyword integration
  - Brand voice consistency
  - Call-to-action effectiveness

review:
  - Grammar and style
  - SEO optimization
  - Readability and flow
  - Publication readiness
```

### **Content Standards**
- **Word Count**: 1,500-2,500 words for comprehensive posts
- **Reading Level**: Accessible to target audience
- **SEO Optimization**: 1-2% keyword density, natural integration
- **Engagement**: Clear structure, compelling hooks, strong conclusions
- **Brand Voice**: Consistent tone and style across all content

## 🔧 **Technical Setup**

### **Framework Status**
- ✅ Claude Sub-Agents CLI installed globally
- ✅ Project-scoped agents configured
- ✅ Master-sub-agent architecture implemented
- ✅ Custom agents created and documented

### **Available Commands**
```bash
# Master orchestrator (recommended)
/blog-orchestrate              # Complete workflow management

# Individual sub-agents (for specific tasks)
/blog-brainstorm              # Generate blog ideas
/blog-outline                 # Create detailed outlines
/blog-write                   # Write full blog posts
/blog-review                  # Review and optimize content

# Framework management
claude-agents list              # See all available agents
claude-agents list --installed  # See installed agents
claude-agents info <agent>      # Get agent details
```

## 💡 **Best Practices**

### **For Orchestrator Usage**
1. **Provide comprehensive briefs** - The more detail, the better the delegation
2. **Trust the workflow** - Let the orchestrator manage the process
3. **Review quality gates** - Ensure each phase meets your standards
4. **Maintain context** - The orchestrator preserves project requirements
5. **Measure performance** - Track how the workflow improves efficiency

### **For Individual Agent Usage**
1. **Start with clear goals** - Know your target audience and objectives
2. **Provide specific context** - The more detail, the better the output
3. **Iterate and refine** - Use feedback to improve agent capabilities
4. **Test different approaches** - Try various content types and styles
5. **Measure results** - Track engagement and SEO performance

### **Agent Selection Guide**
- **Use orchestrator for complex projects** - When you need strategic oversight
- **Use individual agents for quick tasks** - When you need specific expertise
- **Use brainstormer for content strategy** - When planning content calendar
- **Use outline writer for structure** - When you have a topic but need organization
- **Use content writer for creation** - When you have an outline but need full content
- **Use reviewer for polish** - When you have content but need optimization

## 🎉 **Success Metrics**

### **Engagement Metrics**
- **Time on Page**: Target 3+ minutes for comprehensive posts
- **Bounce Rate**: Target <60% for quality content
- **Scroll Depth**: Readers should reach 70%+ of content
- **Social Shares**: Industry-appropriate sharing rates
- **Comments**: Quality engagement and discussion

### **SEO Metrics**
- **Organic Traffic**: Month-over-month growth
- **Keyword Rankings**: Target top 10 positions
- **Click-through Rate**: From search results
- **Featured Snippets**: Answer box appearances
- **Backlinks**: Quality and quantity of inbound links

### **Conversion Metrics**
- **Lead Generation**: Email signups and downloads
- **Click-through Rate**: On internal links and CTAs
- **Engagement Rate**: Comments, shares, and interactions
- **Return Visitors**: Content that brings readers back

## 🚀 **Ready to Create Amazing Blog Content!**

Your blog agent team is ready with a **master-sub-agent architecture** that provides:
- **Strategic oversight** with the orchestrator
- **Specialized expertise** with individual sub-agents
- **Quality assurance** at every phase
- **Scalable workflow** that grows with your needs

**Start with `/blog-orchestrate` for complete end-to-end blog creation, or use individual agents for specific tasks. The choice is yours!**