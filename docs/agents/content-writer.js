/**
 * Blog Content Writer Agent
 * Step 4: Suggest H3 subheadings (0-5 per H2, only if essential)
 * Step 6: Write complete blog content (H2s first, intro/conclusion last)
 * Step 8: Make revisions based on reviewer feedback
 */

class ContentWriterAgent {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.name = 'Blog Content Writer';
        this.role = 'content-writer';
        this.agentType = 'content-writer'; // For model selection
        this.preferredModel = 'claude-sonnet-4-20250514'; // Content production tasks
    }

    /**
     * Execute content writing step
     */
    async execute(context, inputs) {
        try {
            console.log('Blog Content Writer starting...');

            if (context.currentStep === 4) {
                // Step 4: Suggest H3 subheadings
                return await this.suggestH3s(context, inputs);
            } else if (context.currentStep === 6) {
                // Step 6: Write complete blog content
                return await this.writeContent(context, inputs);
            } else if (context.currentStep === 8) {
                // Step 8: Make revisions based on feedback
                return await this.makeRevisions(context, inputs);
            } else {
                throw new Error(`Content Writer called at unexpected step: ${context.currentStep}`);
            }

        } catch (error) {
            console.error('Content Writer failed:', error);
            throw new Error(`Content writing failed: ${error.message}`);
        }
    }

    /**
     * Suggest H3 subheadings for each H2
     */
    async suggestH3s(context, inputs) {
        const outlineOutput = context.previousOutputs['outline-writer'];

        if (!outlineOutput || !outlineOutput.selectedH2s) {
            throw new Error('No outline found for H3 suggestions');
        }

        const prompt = `As the Blog Content Writer for Vegas Improv Power, I need to suggest H3 subheadings for each H2 section.

PROJECT CONTEXT:
- Title: "${inputs.title}"
- Keywords: "${inputs.keywords}"
- Context: "${inputs.context}"

CURRENT OUTLINE:
${outlineOutput.rawOutline || 'Outline not available'}

SELECTED H2 HEADINGS:
${outlineOutput.selectedH2s.map((h2, index) => `${index + 1}. ${h2}`).join('\n')}

H3 SUGGESTION TASK:
For each H2 heading, determine if H3 subheadings would be beneficial:

**CRITICAL H3 GUIDELINES:**
- **0-5 H3s per H2** maximum
- Include an H3 **ONLY** when it is essential to fully cover the sub-topic
- **0 H3s is perfectly acceptable** for self-contained H2 sections
- Fewer is better than fluff - avoid redundant or obvious sub-headings
- H3s should represent distinct, substantial sub-topics
- Each H3 should warrant at least 100-150 words of content

**EVALUATION CRITERIA:**
For each H2, ask:
1. Does this topic have distinct, substantial sub-topics?
2. Would readers benefit from the content being broken down?
3. Are there natural divisions in the subject matter?
4. Would the H2 be too long/complex without sub-divisions?

If the answer to most questions is NO, recommend 0 H3s.

**OUTPUT FORMAT:**
For each H2, provide:
- H2 title
- Recommended number of H3s (0-5)
- If H3s recommended, list them with brief rationale
- If 0 H3s, brief explanation why the H2 is self-contained

Focus on Vegas Improv Power's practical, real-world approach to improv applications.`;

        const messages = [
            {
                role: 'system',
                content: this.getSystemPrompt()
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await this.apiClient.makeRequest(messages, {
            max_tokens: 2000,
            temperature: 0.6,
            agentType: this.agentType
        });

        return this.parseH3Suggestions(response, outlineOutput.selectedH2s);
    }

    /**
     * Write complete blog content
     */
    async writeContent(context, inputs) {
        const finalOutline = context.previousOutputs['outline-writer'];
        const projectBrief = context.previousOutputs['orchestrator']?.projectBrief || '';

        if (!finalOutline || !finalOutline.finalOutline) {
            throw new Error('No final outline available for content writing');
        }

        const prompt = `As the Blog Content Writer for Vegas Improv Power, I need to write the complete blog post following the finalized outline.

PROJECT CONTEXT:
- Title: "${inputs.title}"
- Keywords: "${inputs.keywords}"
- Target: ${inputs.context}

PROJECT BRIEF:
${projectBrief}

FINAL OUTLINE TO FOLLOW:
${finalOutline.finalOutline}

CONTENT WRITING REQUIREMENTS:

**WRITING ORDER:**
1. Write ALL main H2 sections first (complete each H2 + H3s)
2. Write introduction LAST (using selected intro approach as guide)
3. Write conclusion LAST (using selected conclusion approach as guide)

**CONTENT STANDARDS:**
- **Word Count**: Target 1,500-2,500 words total
- **Vegas Improv Power Voice**: Professional yet playful, inclusive, growth-focused
- **Practical Focus**: Real-world applications over theoretical concepts
- **Engagement**: Compelling examples, stories, and actionable insights
- **SEO Integration**: Natural keyword placement (1-2% density)
- **Structure**: Clear headings, scannable paragraphs, logical flow

**WRITING TECHNIQUES:**
- Start each H2 with a clear topic statement
- Include practical examples and real-world scenarios
- Use Vegas Improv Power's "Yes, And" philosophy where appropriate
- Add actionable takeaways readers can implement immediately
- Connect concepts to both personal and professional applications
- Maintain conversational yet authoritative tone

**VEGAS IMPROV POWER ELEMENTS TO INCLUDE:**
- Functional Improv® methodology references
- "Improv for Being a Human®" philosophy
- Experiential learning approach
- Community and inclusive growth focus
- Real-world skill development emphasis

Please write the complete blog post in clean Markdown format, following the outline structure exactly.`;

        const messages = [
            {
                role: 'system',
                content: this.getSystemPrompt()
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await this.apiClient.makeRequest(messages, {
            max_tokens: 4000,
            temperature: 0.7,
            agentType: this.agentType
        });

        return {
            finalBlogPost: response,
            wordCount: this.getWordCount(response),
            readingTime: this.estimateReadingTime(response),
            seoAnalysis: this.analyzeSEO(response, inputs.keywords),
            contentStructure: this.analyzeStructure(response)
        };
    }

    /**
     * Make revisions based on reviewer feedback
     */
    async makeRevisions(context, inputs) {
        const contentOutput = context.previousOutputs['content-writer'];
        const reviewOutput = context.previousOutputs['reviewer'];

        if (!contentOutput || !reviewOutput) {
            throw new Error('Missing content or review output for revisions');
        }

        const prompt = `As the Blog Content Writer, I need to revise the blog post based on the reviewer's feedback.

ORIGINAL BLOG POST:
${contentOutput.finalBlogPost || 'Content not found'}

REVIEWER FEEDBACK:
${reviewOutput.feedback || reviewOutput.reviewFeedback || 'No feedback provided'}

REVISION REQUIREMENTS:
1. **Address All Feedback**: Make specific changes requested by the reviewer
2. **Maintain Quality**: Keep the overall structure and quality intact
3. **Preserve Brand Voice**: Ensure Vegas Improv Power voice remains consistent
4. **Improve Weak Areas**: Focus on sections that need the most improvement
5. **SEO Optimization**: Enhance keyword integration if needed
6. **Reader Experience**: Improve clarity, flow, and engagement

**REVISION APPROACH:**
- Make targeted improvements rather than wholesale changes
- Preserve strong sections while enhancing weak ones
- Ensure all feedback points are addressed
- Maintain the overall structure and outline compliance
- Double-check for any new issues introduced during revision

Please provide the complete revised blog post in clean Markdown format.`;

        const messages = [
            {
                role: 'system',
                content: this.getSystemPrompt()
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await this.apiClient.makeRequest(messages, {
            max_tokens: 4000,
            temperature: 0.6,
            agentType: this.agentType
        });

        return {
            revisedBlogPost: response,
            revisionsSummary: this.summarizeRevisions(contentOutput.finalBlogPost, response),
            wordCount: this.getWordCount(response),
            readingTime: this.estimateReadingTime(response),
            finalSEOAnalysis: this.analyzeSEO(response, inputs.keywords)
        };
    }

    /**
     * Parse H3 suggestions from response
     */
    parseH3Suggestions(response, selectedH2s) {
        const suggestions = {};
        
        try {
            // For each H2, try to extract H3 suggestions
            for (const h2 of selectedH2s) {
                const h2Pattern = new RegExp(`(?:${this.escapeRegex(h2)}|\\*\\*${this.escapeRegex(h2)}\\*\\*)([\\s\\S]*?)(?=\\n\\n|\\n(?:[A-Z]|\\d+\\.|\\*\\*)|$)`, 'i');
                const match = response.match(h2Pattern);
                
                if (match) {
                    const content = match[1];
                    const h3s = this.extractH3sFromContent(content);
                    suggestions[h2] = {
                        h3s: h3s,
                        reasoning: content.trim()
                    };
                } else {
                    suggestions[h2] = {
                        h3s: [],
                        reasoning: 'No specific suggestions found'
                    };
                }
            }
        } catch (error) {
            console.error('Error parsing H3 suggestions:', error);
        }

        return {
            h3Suggestions: suggestions,
            rawResponse: response,
            totalH3s: Object.values(suggestions).reduce((sum, item) => sum + item.h3s.length, 0)
        };
    }

    /**
     * Extract H3s from content section
     */
    extractH3sFromContent(content) {
        const h3s = [];
        
        // Look for numbered lists or bullet points that could be H3s
        const patterns = [
            /^\s*\d+\.\s*(.+?)(?=\n|$)/gm,
            /^\s*[-*•]\s*(.+?)(?=\n|$)/gm,
            /(?:H3:|###)\s*(.+?)(?=\n|$)/gm
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const h3 = match[1].trim();
                if (h3.length > 5 && !h3.toLowerCase().includes('h3')) {
                    h3s.push(h3);
                }
            }
            if (h3s.length > 0) break; // Use first successful pattern
        }

        return h3s.slice(0, 5); // Max 5 H3s per H2
    }

    /**
     * Utility functions
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getWordCount(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    estimateReadingTime(text) {
        const wordCount = this.getWordCount(text);
        const wordsPerMinute = 200;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    analyzeSEO(content, keywords) {
        if (!content || !keywords) return {};

        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        const contentLower = content.toLowerCase();
        const wordCount = this.getWordCount(content);

        const analysis = {
            wordCount,
            keywordAnalysis: {}
        };

        for (const keyword of keywordList) {
            const occurrences = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
            const density = wordCount > 0 ? (occurrences / wordCount * 100).toFixed(2) : 0;
            
            analysis.keywordAnalysis[keyword] = {
                occurrences,
                density: `${density}%`,
                optimal: density >= 0.5 && density <= 2.5
            };
        }

        return analysis;
    }

    analyzeStructure(content) {
        const h1Count = (content.match(/^#\s/gm) || []).length;
        const h2Count = (content.match(/^##\s/gm) || []).length;
        const h3Count = (content.match(/^###\s/gm) || []).length;
        const paragraphs = content.split('\n\n').filter(p => p.trim()).length;

        return {
            h1Count,
            h2Count,
            h3Count,
            paragraphCount: paragraphs,
            averageWordsPerParagraph: Math.round(this.getWordCount(content) / paragraphs)
        };
    }

    summarizeRevisions(original, revised) {
        const originalWords = this.getWordCount(original);
        const revisedWords = this.getWordCount(revised);
        const wordChange = revisedWords - originalWords;

        return {
            originalWordCount: originalWords,
            revisedWordCount: revisedWords,
            wordChange: wordChange,
            changePercentage: originalWords > 0 ? ((wordChange / originalWords) * 100).toFixed(1) : 0
        };
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        return `You are the Blog Content Writer for Vegas Improv Power, specializing in creating engaging, SEO-optimized blog posts that embody our "Improv for Being a Human®" philosophy.

ROLE RESPONSIBILITIES:
1. Content Creation: Write engaging, informative blog posts from detailed outlines
2. SEO Optimization: Naturally integrate keywords and optimize for search engines
3. Reader Engagement: Create content that holds attention and drives action
4. Brand Voice: Maintain consistent tone and style across all content
5. Conversion Focus: Write content that moves readers toward desired actions

COMPANY CONTEXT:
${COMPANY_INFO}

WRITING PRINCIPLES:
- Professional yet playful voice that balances expertise with joy of discovery
- Focus on practical applications over theoretical concepts
- Include real-world examples and actionable insights
- Emphasize experiential learning and personal growth
- Connect improv techniques to daily life applications
- Use inclusive language that welcomes all experience levels

CONTENT STANDARDS:
- Target 1,500-2,500 words for comprehensive posts
- SEO keyword integration (1-2% density, naturally placed)
- Clear structure with scannable headings and paragraphs
- Compelling hooks and strong conclusions with clear CTAs
- Practical takeaways readers can implement immediately
- Examples and stories that illustrate key concepts

Your writing should inspire readers to embrace improv as a life skill while providing concrete tools for personal and professional development.`;
    }
}

// Export for use in workflow
window.ContentWriterAgent = ContentWriterAgent;