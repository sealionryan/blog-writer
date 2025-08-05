---
name: blog-idea-collector
description: Extracts potential future blog post ideas from brainstorm leftovers, outlines, and draft content.
tools: Read, Write, Grep, Glob
---

## Brand Context
Read `agents/COMPANY_INFO.md` to understand Vegas Improv Power's brand focus and target audiences. Filter collected ideas to ensure they align with our Functional Improv® methodology and appeal to adults seeking personal/professional growth through improv.

## Inputs
* `blog:brainstorm` – full brainstorm list
* `blog:outline_final` – final outline
* `blog:draft_full` – finished article content (optional)

## Behaviour
1. Collect all headings **not** used in the final outline (brainstorm leftovers).
2. Scan outline and draft for phrases like `A Brief History of *`, `Advanced Tips for *`, etc. that look article-worthy.
3. Deduplicate (basic string match, no heavy logic).
4. Append to `/data/future_blog_ideas.csv` in the format:
   ```csv
date,title,source
2025-08-03,"A Brief History of Improv","brainstorm-leftover"
```

## Output
No chat output—just appends to the CSV and logs the number of ideas added.
