# n8n Blog Creation Workflow Documentation

## Overview

This n8n workflow converts the 9-step blog creation process into an automated workflow that can be easily extended with additional nodes like Perplexity API integration for academic and medical references.

## Workflow Structure

### Node Types Used
- **Set Node**: Initialize workflow variables
- **OpenAI Node**: Each agent interaction using Claude/OpenAI models
- **Write Binary File Node**: Save final outputs
- **Sticky Note**: Documentation and integration points

### Flow Sequence

```
Step 1: Project Initiation (Set Node)
    ↓
Orchestrator: Create Project Brief (OpenAI Node)
    ↓
Step 2: H2 Generation - Brainstormer (OpenAI Node)
    ↓
[PERPLEXITY API INTEGRATION POINT] ← Add here
    ↓
Step 3: Outline Creation - Outline Writer (OpenAI Node)
    ↓
Step 4: H3 Suggestions - Content Writer (OpenAI Node)
    ↓
Step 5: Final Outline - Outline Writer (OpenAI Node)
    ↓
Step 6: Content Writing - Content Writer (OpenAI Node)
    ↓
Step 7: Review & Feedback - Reviewer (OpenAI Node)
    ↓
Step 8: Content Revision - Content Writer (OpenAI Node)
    ↓
Step 9: Final Compilation - Orchestrator (OpenAI Node)
    ↓
Save Blog Post (Write Binary File) + Save Metadata (Write Binary File)
```

## Input Parameters

The workflow starts with a **Set Node** that accepts these parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `search_term` | Keyword or working title | "improv for team building" |
| `context` | Background, tone, audience | "Business audience, focus on practical applications" |
| `keywords` | Optional CSV of target SEO terms | "team building, workplace communication, collaboration" |
| `allow_web` | Enable web research | "true" |

## Agent Nodes

### 1. Orchestrator: Create Project Brief
- **Model**: Claude-3-Sonnet
- **Function**: Analyze requirements and create strategic project brief
- **Output**: Project brief with strategic direction, audience analysis, content strategy

### 2. Step 2: H2 Generation (Brainstormer)
- **Model**: Claude-3-Sonnet
- **Function**: Generate 20 main H2s + 3 intro + 3 conclusion ideas
- **Output**: Structured list of content headings
- **Note**: This is where Perplexity API integration should be added

### 3. Step 3: Outline Creation (Outline Writer)
- **Model**: Claude-3-Sonnet
- **Function**: Select 5-10 H2s and order for logical flow
- **Output**: Raw Markdown outline structure

### 4. Step 4: H3 Suggestions (Content Writer)
- **Model**: Claude-3-Sonnet
- **Function**: Suggest 0-5 H3s per H2 when essential
- **Output**: H3 recommendations with rationale

### 5. Step 5: Final Outline (Outline Writer)
- **Model**: Claude-3-Sonnet
- **Function**: Incorporate H3s into final structure
- **Output**: Complete structured outline

### 6. Step 6: Content Writing (Content Writer)
- **Model**: Claude-3-Sonnet
- **Function**: Write complete blog post (1,500-2,500 words)
- **Output**: Full Markdown blog post

### 7. Step 7: Review & Feedback (Reviewer)
- **Model**: Claude-3-Sonnet
- **Function**: Comprehensive quality and SEO review
- **Output**: Detailed feedback with improvement recommendations

### 8. Step 8: Content Revision (Content Writer)
- **Model**: Claude-3-Sonnet
- **Function**: Revise content based on feedback
- **Output**: Revised, publication-ready blog post

### 9. Step 9: Final Compilation (Orchestrator)
- **Model**: Claude-3-Sonnet
- **Function**: Final QA and compile metadata
- **Output**: Final blog post + metadata file

## Output Files

The workflow generates two files:
1. **`[search-term].md`**: The final blog post
2. **`[search-term]-metadata.md`**: Complete workflow metadata

## Perplexity API Integration Point

### Recommended Placement
Insert Perplexity API nodes **after Step 2** (H2 Generation) and **before Step 3** (Outline Creation).

### Integration Strategy
```json
{
  "name": "Perplexity Research Enhancement",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.perplexity.ai/chat/completions",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{ $credentials.perplexityApi.apiKey }}",
      "Content-Type": "application/json"
    },
    "body": {
      "model": "llama-3.1-sonar-large-128k-online",
      "messages": [
        {
          "role": "user", 
          "content": "Find recent academic and medical references for these blog topics: {{ $('Step 2: H2 Generation (Brainstormer)').item.json.text }}. Focus on peer-reviewed sources from the last 3 years."
        }
      ]
    }
  }
}
```

### Enhanced H2 Processing Node
Add a processing node after Perplexity to merge research with H2s:

```json
{
  "name": "Merge Research with H2s",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "const h2Data = $('Step 2: H2 Generation (Brainstormer)').item.json.text;\nconst researchData = $json.choices[0].message.content;\n\n// Merge H2s with academic references\nconst enhancedH2s = `${h2Data}\\n\\n## Academic References\\n${researchData}`;\n\nreturn { enhancedH2s };"
  }
}
```

## Additional Enhancement Opportunities

### 1. Image Generation Node
Add after Step 6 (Content Writing):
```json
{
  "name": "Generate Featured Image",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.openai.com/v1/images/generations",
    "method": "POST"
  }
}
```

### 2. SEO Analysis Node
Add after Step 7 (Review):
```json
{
  "name": "SEO Analysis",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.semrush.com/analytics/v1/"
  }
}
```

### 3. Social Media Content Node
Add after Step 9 (Final Compilation):
```json
{
  "name": "Generate Social Posts",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "text": "Create social media posts for: {{ $json.text }}"
  }
}
```

## Usage Instructions

### 1. Import Workflow
1. Copy the JSON from `n8n-blog-workflow.json`
2. In n8n, go to Workflows → Import from JSON
3. Paste the JSON and save

### 2. Configure Credentials
- Set up OpenAI/Claude API credentials
- Add Perplexity API credentials (when adding that node)

### 3. Run Workflow
1. Execute the workflow
2. Fill in the input parameters in Step 1
3. Monitor execution through each step
4. Retrieve output files from the final nodes

### 4. Customize for Your Needs
- Modify prompts in OpenAI nodes
- Add additional processing nodes
- Integrate with your CMS or publishing platform

## Error Handling

Each node is configured with `onError: "stopWorkflow"` to halt execution if any step fails. Consider adding:

### Retry Logic
```json
{
  "parameters": {
    "rules": {
      "rule": [
        {
          "type": "retryOnHttpError",
          "properties": {
            "maxRetries": 3,
            "delayMs": 1000
          }
        }
      ]
    }
  }
}
```

### Alternative Paths
Add conditional nodes to handle different scenarios or fallback options.

## Performance Optimization

### 1. Parallel Execution
Some steps can be parallelized:
- Save Blog Post + Save Metadata (already implemented)
- Multiple research APIs can run in parallel

### 2. Caching
Implement caching for:
- Project briefs for similar topics
- Research results
- Common H2 patterns

### 3. Batch Processing
Consider batch nodes for:
- Multiple blog posts
- Bulk research queries
- Batch file operations

## Monitoring and Analytics

### Add Workflow Metrics
```json
{
  "name": "Log Metrics",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "const metrics = {\n  startTime: new Date(),\n  searchTerm: $('Step 1: Project Initiation').item.json.search_term,\n  wordCount: $json.text.split(' ').length,\n  h2Count: (($json.text || '').match(/##\\s/g) || []).length\n};\n\nconsole.log('Blog Workflow Metrics:', metrics);\nreturn metrics;"
  }
}
```

This n8n workflow provides a solid foundation for your blog creation process and makes it easy to add the Perplexity API integration and other enhancements you have in mind.