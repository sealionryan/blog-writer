/**
 * Content Planning Assistant
 * Step 0: Analyzes user inputs and fills in missing information
 * This ensures we have title, keywords, and context before starting the main workflow
 */

class ContentPlannerAgent {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.name = 'Content Planning Assistant';
        this.role = 'content-planner';
        this.agentType = 'content-planner'; // For model selection
        this.preferredModel = 'claude-3-opus-20240229'; // High-reasoning: Complex input analysis
    }

    /**
     * Execute the content planning step
     */
    async execute(context, inputs) {
        try {
            console.log('Content Planning Assistant starting...');

            // Analyze what's missing
            const analysis = this.analyzeInputs(inputs);
            
            if (analysis.complete) {
                // All inputs provided, just validate and return
                return {
                    title: inputs.title,
                    keywords: inputs.keywords,
                    context: inputs.context,
                    allowWeb: inputs.allowWeb,
                    generated: [],
                    analysis: analysis
                };
            }

            // Generate missing pieces
            const completedInputs = await this.generateMissingInputs(inputs, analysis);
            
            return {
                ...completedInputs,
                analysis: analysis,
                generated: analysis.missing
            };

        } catch (error) {
            console.error('Content Planning Assistant failed:', error);
            throw new Error(`Content Planning failed: ${error.message}`);
        }
    }

    /**
     * Analyze what inputs are provided and what's missing
     */
    analyzeInputs(inputs) {
        const provided = [];
        const missing = [];

        // Check title
        if (inputs.title && inputs.title.trim()) {
            provided.push('title');
        } else {
            missing.push('title');
        }

        // Check keywords
        if (inputs.keywords && inputs.keywords.trim()) {
            provided.push('keywords');
        } else {
            missing.push('keywords');
        }

        // Check context
        if (inputs.context && inputs.context.trim()) {
            provided.push('context');
        } else {
            missing.push('context');
        }

        return {
            provided,
            missing,
            complete: missing.length === 0,
            hasAtLeastOne: provided.length > 0
        };
    }

    /**
     * Generate missing input fields using AI
     */
    async generateMissingInputs(inputs, analysis) {
        const result = {
            title: inputs.title || '',
            keywords: inputs.keywords || '',
            context: inputs.context || '',
            allowWeb: inputs.allowWeb !== undefined ? inputs.allowWeb : true
        };

        // Build the generation prompt
        const generationPrompt = this.buildGenerationPrompt(inputs, analysis);
        
        // Make API request
        const messages = [
            {
                role: 'system',
                content: this.getSystemPrompt()
            },
            {
                role: 'user',
                content: generationPrompt
            }
        ];

        const response = await this.apiClient.makeRequest(messages, {
            max_tokens: 1500,
            temperature: 0.7,
            agentType: this.agentType
        });

        // Parse the response
        const parsed = this.parseGenerationResponse(response);
        
        // Fill in missing fields
        if (analysis.missing.includes('title') && parsed.title) {
            result.title = parsed.title;
        }
        
        if (analysis.missing.includes('keywords') && parsed.keywords) {
            result.keywords = parsed.keywords;
        }
        
        if (analysis.missing.includes('context') && parsed.context) {
            result.context = parsed.context;
        }

        return result;
    }

    /**
     * Build the prompt for generating missing inputs
     */
    buildGenerationPrompt(inputs, analysis) {
        let prompt = `I need help completing the inputs for a blog post creation workflow. Here's what the user provided:\n\n`;

        // Add provided inputs
        if (inputs.title && inputs.title.trim()) {
            prompt += `TITLE: "${inputs.title}"\n`;
        }
        if (inputs.keywords && inputs.keywords.trim()) {
            prompt += `KEYWORDS: "${inputs.keywords}"\n`;
        }
        if (inputs.context && inputs.context.trim()) {
            prompt += `CONTEXT: "${inputs.context}"\n`;
        }

        prompt += `\nMISSING FIELDS: ${analysis.missing.join(', ')}\n\n`;

        prompt += `Please generate the missing fields based on what was provided. Consider that this is for Vegas Improv Power, which teaches "Improv for Being a Human®" using Functional Improv® methodology.\n\n`;

        prompt += `Generate ONLY the missing fields in this exact format:\n`;
        
        if (analysis.missing.includes('title')) {
            prompt += `TITLE: [generate a compelling blog post title]\n`;
        }
        if (analysis.missing.includes('keywords')) {
            prompt += `KEYWORDS: [generate 4-6 SEO keywords, comma-separated]\n`;
        }
        if (analysis.missing.includes('context')) {
            prompt += `CONTEXT: [generate audience, tone, and purpose description]\n`;
        }

        return prompt;
    }

    /**
     * Parse the AI response to extract generated fields
     */
    parseGenerationResponse(response) {
        const result = {};

        try {
            // Extract title
            const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
            if (titleMatch) {
                result.title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
            }

            // Extract keywords
            const keywordsMatch = response.match(/KEYWORDS:\s*(.+?)(?:\n|$)/i);
            if (keywordsMatch) {
                result.keywords = keywordsMatch[1].trim().replace(/^["']|["']$/g, '');
            }

            // Extract context
            const contextMatch = response.match(/CONTEXT:\s*(.+?)(?:\n|$)/i);
            if (contextMatch) {
                result.context = contextMatch[1].trim().replace(/^["']|["']$/g, '');
            }

        } catch (error) {
            console.error('Error parsing generation response:', error);
        }

        return result;
    }

    /**
     * Get system prompt for content planning
     */
    getSystemPrompt() {
        return `You are a Content Planning Assistant for Vegas Improv Power, a Las Vegas-based company that teaches "Improv for Being a Human®" using Functional Improv® methodology.

COMPANY CONTEXT:
Vegas Improv Power focuses on real-life applications of improv, helping adults develop practical skills like communication, leadership, emotional intelligence, creativity, and adaptability. The brand voice is professional yet playful, inclusive and supportive, growth-focused, human-centered, and holistic.

PRIMARY AUDIENCES:
- Adults seeking personal growth through practical skill development
- Corporate teams looking for innovative team building and professional development
- HR professionals and team leaders seeking collaboration solutions

CORE MESSAGING THEMES:
- Improv as a life skill, not just entertainment
- Real-world applications of improvisational techniques
- Personal development through experiential learning
- Building confidence, communication, and creativity
- The power of "Yes, And" thinking in daily life
- Community building and inclusive growth environments

When generating missing content fields, ensure they align with these brand values and target audiences. Focus on practical applications, personal growth, and real-world benefits of improv techniques.`;
    }

    /**
     * Validate the completed inputs
     */
    validateInputs(inputs) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Validate title
        if (!inputs.title || inputs.title.trim().length < 10) {
            validation.errors.push('Title must be at least 10 characters long');
            validation.valid = false;
        }

        if (inputs.title && inputs.title.length > 100) {
            validation.warnings.push('Title is quite long, consider shortening for better SEO');
        }

        // Validate keywords
        if (!inputs.keywords || inputs.keywords.trim().length < 5) {
            validation.errors.push('Keywords must be provided');
            validation.valid = false;
        }

        const keywordCount = inputs.keywords.split(',').filter(k => k.trim()).length;
        if (keywordCount < 2) {
            validation.warnings.push('Consider providing more keywords for better SEO coverage');
        }
        if (keywordCount > 10) {
            validation.warnings.push('Too many keywords may dilute SEO focus');
        }

        // Validate context
        if (!inputs.context || inputs.context.trim().length < 20) {
            validation.errors.push('Context must be at least 20 characters long');
            validation.valid = false;
        }

        return validation;
    }
}

// Export for use in workflow
window.ContentPlannerAgent = ContentPlannerAgent;