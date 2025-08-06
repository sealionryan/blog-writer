/**
 * Blog Outline Writer Agent
 * Step 3: Select 5-10 best H2s and create structured outline
 * Step 5: Finalize H2/H3 structure after H3 suggestions
 */

class OutlineWriterAgent {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.name = 'Blog Outline Writer';
        this.role = 'outline-writer';
        this.agentType = 'outline-writer'; // For model selection
        this.preferredModel = 'claude-opus-4-1-20250805'; // High-reasoning: Content structuring
    }

    /**
     * Execute outline writing step
     */
    async execute(context, inputs) {
        try {
            console.log('Blog Outline Writer starting...');

            if (context.currentStep === 3) {
                // Step 3: Create initial outline from brainstormed H2s
                return await this.createInitialOutline(context, inputs);
            } else if (context.currentStep === 5) {
                // Step 5: Finalize outline with H3 suggestions
                return await this.finalizeOutline(context, inputs);
            } else {
                throw new Error(`Outline Writer called at unexpected step: ${context.currentStep}`);
            }

        } catch (error) {
            console.error('Outline Writer failed:', error);
            throw new Error(`Outline creation failed: ${error.message}`);
        }
    }

    /**
     * Create initial outline from brainstormed H2s
     */
    async createInitialOutline(context, inputs) {
        const brainstormOutput = context.previousOutputs['brainstormer'];
        const projectBrief = context.previousOutputs['orchestrator']?.projectBrief || '';

        if (!brainstormOutput || !brainstormOutput.h2Options) {
            throw new Error('No brainstorming results found');
        }

        const prompt = `As the Blog Outline Writer for Vegas Improv Power, I need to select the best H2 headings and create a structured outline.

PROJECT CONTEXT:
- Title: "${inputs.title}"
- Keywords: "${inputs.keywords}"
- Target: ${inputs.context}

PROJECT BRIEF:
${projectBrief}

AVAILABLE H2 OPTIONS (${brainstormOutput.h2Options.length} total):
${brainstormOutput.h2Options.map((h2, index) => `${index + 1}. ${h2}`).join('\n')}

AVAILABLE INTRO OPTIONS:
${brainstormOutput.introOptions.map((intro, index) => `${index + 1}. ${intro}`).join('\n')}

AVAILABLE CONCLUSION OPTIONS:
${brainstormOutput.conclusionOptions.map((conclusion, index) => `${index + 1}. ${conclusion}`).join('\n')}

OUTLINE REQUIREMENTS:

**SELECT 5-10 H2 HEADINGS** from the brainstormed options that:
- Create a complete, logical story flow from beginning to end
- Cover the topic comprehensively without being repetitive
- Progress from foundational concepts to advanced applications
- Include both theoretical understanding and practical implementation
- Appeal to our target audience of adults seeking personal growth

**ORDER FOR STORY PROGRESSION:**
Arrange selected H2s in logical order that:
- Starts with context or foundational concepts
- Builds understanding progressively
- Includes practical applications and examples
- Ends with implementation or advanced concepts

**SELECT INTRO AND CONCLUSION:**
- Choose 1 intro approach that best hooks the target audience
- Choose 1 conclusion approach that drives desired action

**CREATE STRUCTURED OUTLINE:**
Format as clean Markdown with:
- Selected H2s in proper order
- Brief description of what each H2 will cover
- Logical flow between sections
- Estimated word count per section

IMPORTANT: Do NOT include intro/conclusion H2s in the main content flow. These are separate from the main H2 structure.

Please provide your complete outline with reasoning for your selections.`;

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
            max_tokens: 2500,
            temperature: 0.6,
            agentType: this.agentType
        });

        return this.parseInitialOutlineResponse(response, brainstormOutput);
    }

    /**
     * Finalize outline with H3 suggestions
     */
    async finalizeOutline(context, inputs) {
        const outlineOutput = context.previousOutputs['outline-writer'];
        const h3Suggestions = context.previousOutputs['content-writer'];

        if (!outlineOutput || !h3Suggestions) {
            throw new Error('Missing previous outline or H3 suggestions');
        }

        const prompt = `As the Blog Outline Writer, I need to finalize the complete H2/H3 structure incorporating the H3 suggestions.

CURRENT OUTLINE:
${outlineOutput.rawOutline || 'Outline not found'}

H3 SUGGESTIONS RECEIVED:
${JSON.stringify(h3Suggestions.h3Suggestions || {}, null, 2)}

FINALIZATION TASK:
1. **Review H3 Suggestions**: Evaluate which H3s are essential vs. optional
2. **Apply Quality Filter**: Include H3s only when they add significant value
3. **Maintain Structure**: Ensure logical flow within each H2 section
4. **Optimize for Readability**: Balance detail with scannability
5. **Create Final Outline**: Complete Markdown structure ready for content creation

REMEMBER: H3 Guidelines
- **0-5 H3s per H2** maximum
- Include H3 only when essential to fully cover the sub-topic
- Self-contained H2s with 0 H3s are perfectly acceptable
- Fewer is better than fluff - avoid redundant or obvious sub-headings

Please provide the complete final outline in clean Markdown format, ready for the content writer to use.`;

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
            temperature: 0.5,
            agentType: this.agentType
        });

        // Ensure response is a string
        const outlineText = typeof response === 'string' ? response : 
                           (response?.content || response?.text || String(response) || '');

        console.log('Outline response type:', typeof response);
        console.log('Processed outline text:', outlineText);

        return {
            finalOutline: outlineText,
            h2Count: this.countH2s(outlineText),
            h3Count: this.countH3s(outlineText),
            estimatedWordCount: this.estimateWordCount(outlineText),
            outlineStructure: this.parseOutlineStructure(outlineText)
        };
    }

    /**
     * Parse initial outline response
     */
    parseInitialOutlineResponse(response, brainstormOutput) {
        const result = {
            selectedH2s: [],
            selectedIntro: '',
            selectedConclusion: '',
            rawOutline: response,
            selectionReasoning: '',
            estimatedWordCount: 0
        };

        try {
            // Extract selected H2s
            const h2Matches = response.match(/##\s+(.+?)(?=\n|$)/g);
            if (h2Matches) {
                result.selectedH2s = h2Matches.map(match => 
                    match.replace(/^##\s+/, '').trim()
                );
            }

            // Extract intro and conclusion selections
            const introMatch = response.match(/(?:INTRO|INTRODUCTION)[\s\S]*?(\d+)\./i);
            if (introMatch && brainstormOutput.introOptions) {
                const introIndex = parseInt(introMatch[1]) - 1;
                if (introIndex >= 0 && introIndex < brainstormOutput.introOptions.length) {
                    result.selectedIntro = brainstormOutput.introOptions[introIndex];
                }
            }

            const conclusionMatch = response.match(/(?:CONCLUSION)[\s\S]*?(\d+)\./i);
            if (conclusionMatch && brainstormOutput.conclusionOptions) {
                const conclusionIndex = parseInt(conclusionMatch[1]) - 1;
                if (conclusionIndex >= 0 && conclusionIndex < brainstormOutput.conclusionOptions.length) {
                    result.selectedConclusion = brainstormOutput.conclusionOptions[conclusionIndex];
                }
            }

            // Extract reasoning
            const reasoningMatch = response.match(/(?:REASONING|RATIONALE|SELECTION)[\s\S]*?(?=\n\n|\n#|$)/i);
            if (reasoningMatch) {
                result.selectionReasoning = reasoningMatch[0].trim();
            }

            // Estimate word count
            result.estimatedWordCount = this.estimateWordCount(response);

        } catch (error) {
            console.error('Error parsing initial outline response:', error);
        }

        return result;
    }

    /**
     * Parse outline structure
     */
    parseOutlineStructure(outline) {
        const structure = [];
        const lines = outline.split('\n');
        let currentH2 = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            // H2 heading
            if (trimmed.startsWith('## ')) {
                currentH2 = {
                    title: trimmed.replace('## ', ''),
                    h3s: []
                };
                structure.push(currentH2);
            }
            // H3 heading
            else if (trimmed.startsWith('### ') && currentH2) {
                currentH2.h3s.push(trimmed.replace('### ', ''));
            }
        }

        return structure;
    }

    /**
     * Count H2s in outline
     */
    countH2s(outline) {
        const matches = outline.match(/^##\s+/gm);
        return matches ? matches.length : 0;
    }

    /**
     * Count H3s in outline
     */
    countH3s(outline) {
        const matches = outline.match(/^###\s+/gm);
        return matches ? matches.length : 0;
    }

    /**
     * Estimate word count based on outline
     */
    estimateWordCount(outline) {
        const h2Count = this.countH2s(outline);
        const h3Count = this.countH3s(outline);
        
        // Rough estimation: 200-400 words per H2, 100-200 per H3, plus intro/conclusion
        const baseWordsPerH2 = 300;
        const baseWordsPerH3 = 150;
        const introWords = 200;
        const conclusionWords = 200;
        
        return (h2Count * baseWordsPerH2) + (h3Count * baseWordsPerH3) + introWords + conclusionWords;
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        return `You are the Blog Outline Writer for Vegas Improv Power, specializing in creating structured, logical content outlines that guide readers through a complete learning journey.

ROLE RESPONSIBILITIES:
1. Outline Expansion: Transform brief ideas into detailed content structures
2. Content Flow: Create logical progression and narrative arcs
3. SEO Integration: Embed keywords naturally throughout the outline
4. Engagement Optimization: Structure content for maximum reader retention
5. Conversion Focus: Design outlines that drive reader action

COMPANY CONTEXT:
${COMPANY_INFO}

OUTLINE PRINCIPLES:
- Start with foundational concepts and build progressively
- Create clear narrative flow from problem to solution
- Balance theoretical understanding with practical application
- Include both individual and organizational perspectives
- Ensure each section adds unique value without repetition
- Design for scannability with clear headings and logical progression

QUALITY STANDARDS:
- Select 5-10 H2s that create a complete story
- Order sections for logical learning progression
- Include practical applications and real-world examples
- Maintain Vegas Improv Power's brand voice and methodology
- Design for 1,500-2,500 word target length
- Optimize for both SEO and reader engagement

Your outlines should guide readers through a transformative learning experience that embodies Vegas Improv Power's "Improv for Being a Human®" philosophy.`;
    }

    /**
     * Validate outline quality
     */
    validateOutline(outline) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        const h2Count = this.countH2s(outline.rawOutline || outline.finalOutline || '');
        const h3Count = this.countH3s(outline.rawOutline || outline.finalOutline || '');

        // Check H2 count
        if (h2Count < 5) {
            validation.errors.push(`Only ${h2Count} H2s selected, need at least 5`);
            validation.valid = false;
        }
        if (h2Count > 10) {
            validation.warnings.push(`${h2Count} H2s selected, consider reducing for better focus`);
        }

        // Check H3 density
        const avgH3sPerH2 = h2Count > 0 ? h3Count / h2Count : 0;
        if (avgH3sPerH2 > 3) {
            validation.warnings.push(`High H3 density (${avgH3sPerH2.toFixed(1)} per H2), consider simplifying`);
        }

        // Check estimated length
        const estimatedWords = this.estimateWordCount(outline.rawOutline || outline.finalOutline || '');
        if (estimatedWords < 1200) {
            validation.warnings.push(`Estimated ${estimatedWords} words, may be too short for comprehensive coverage`);
        }
        if (estimatedWords > 3000) {
            validation.warnings.push(`Estimated ${estimatedWords} words, may be too long for reader engagement`);
        }

        return validation;
    }
}

// Export for use in workflow
window.OutlineWriterAgent = OutlineWriterAgent;