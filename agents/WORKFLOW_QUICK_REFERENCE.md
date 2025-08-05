# Blog Creation Workflow - Quick Reference

## 🚀 **How to Start**

### **Complete Workflow (Recommended)**
```bash
> /blog-orchestrate

# Provide:
- Search term or blog post title (e.g., "what is improv")
- Meta-data description (context, background, lens)
- Target keywords list (optional)
```

The orchestrator will automatically manage the entire 9-step process.

---

## 📋 **9-Step Workflow Overview**

| Step | Agent | Task | Output |
|------|-------|------|--------|
| 1 | Orchestrator | Workflow kickoff | Project brief |
| 2 | Brainstormer | Generate 20 H2s + 3 intro + 3 conclusion | H2 list |
| 3 | Outline Writer | Select 5-10 H2s + order + select intro/conclusion | Raw outline |
| 4 | Content Writer | Suggest 0-5 H3s per H2 (only if needed) | Outline with H3s |
| 5 | Outline Writer | Finalize H2/H3 structure | Final outline |
| 6 | Content Writer | Write sections (H2s first, intro/conclusion last) | Complete blog |
| 7 | Reviewer | Review and provide feedback | Review feedback |
| 8 | Content Writer | Make revisions | Revised blog |
| 9 | Orchestrator | Compile final output | .md + metadata files |

---

## 🎯 **Key Requirements**

### **H2 Generation (Step 2)**
- **20 main H2s** for article content
- **3 intro H2s** (meta-description only)
- **3 conclusion H2s** (meta-description only)
- **NO web browsing** - avoid copycat content

### **Outline Creation (Step 3)**
- Select **5-10 H2s** for main content
- **NEVER include intro/conclusion H2s in final blog**
- Order for complete story flow
- Output: Raw Markdown outline

### **Content Creation (Step 6)**
- Write **main H2 sections first**
- **One H2 + H3s per call** for quality
- Write **intro last** (using intro H2 as meta-description)
- Write **conclusion last** (using conclusion H2 as meta-description)

### **H3 Guidelines**
- **0–5 H3s** per H2.
- Include an H3 **only** when it is essential to fully cover the sub-topic; 0 is acceptable for self-contained H2s.
- Fewer is better than fluff; avoid redundant or obvious sub-headings.

---

## 📄 **Output Files**

### **Blog Post** (`blog-post-title.md`)
```markdown
# [Blog Title]

[Intro paragraph(s)]

## [H2 1]
[Content for H2 1]

### [H3 1.1]
[Content for H3 1.1]

...

[Conclusion paragraph(s)]
```

### **Metadata** (`blog-post-title-metadata.md`)
- Complete workflow information
- All agent inputs/outputs
- Quality metrics
- Workflow analysis data

---

## 💡 **Pro Tips**

1. **Start with orchestrator** - Let it manage the complete process
2. **Provide detailed context** - The more info, the better the output
3. **Trust the workflow** - Each step builds on the previous
4. **Quality gates** - Each step has specific review criteria
5. **Metadata tracking** - Use for workflow optimization

---

## 🔧 **Troubleshooting**

### **If H2s aren't diverse enough**
- Ask brainstormer to focus on creative angles
- Request more topical authority coverage

### **If outline flow is weak**
- Ask outline writer to focus on story progression
- Request logical ordering from beginning to end

### **If content is too generic**
- Ask content writer to focus on unique insights
- Request more specific examples and details

### **If review finds issues**
- Use iteration loop (Step 8) to refine
- Send specific feedback to appropriate agent

---

## 🎉 **Ready to Create Amazing Blog Content!**

Your workflow is now fully documented and ready to use. Start with `/blog-orchestrate` and let the master agent guide you through the complete process! 