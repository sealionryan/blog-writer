/**
 * Blog Brainstormer Agent
 * Step 2: Generate 20 H2 headings + 3 intro + 3 conclusion options
 */

class BrainstormerAgent {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.name = 'Blog Brainstormer';
        this.role = 'brainstormer';
        this.agentType = 'brainstormer'; // For model selection
        this.preferredModel = 'claude-sonnet-4-20250514'; // Creative generation tasks
    }

    /**
     * Execute brainstorming step
     */
    async execute(context, inputs) {
        try {
            console.log('Blog Brainstormer starting...');

            const prompt = this.buildBrainstormPrompt(context, inputs);
            
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
                max_tokens: 3000,
                temperature: 0.8, // Higher creativity for brainstorming
                agentType: this.agentType
            });

            return this.parseBrainstormResponse(response);

        } catch (error) {
            console.error('Brainstormer failed:', error);
            throw new Error(`Brainstorming failed: ${error.message}`);
        }
    }

    /**
     * Build brainstorming prompt
     */
    buildBrainstormPrompt(context, inputs) {
        const projectBrief = context.previousOutputs['orchestrator']?.projectBrief || '';

        return `As the Blog Brainstormer for Vegas Improv Power, I need to generate diverse and creative heading options for this blog post.

PROJECT CONTEXT:
- Title: "${inputs.title}"
- Keywords: "${inputs.keywords}"
- Context: "${inputs.context}"
- Target Audience: Adults seeking personal growth and corporate teams

PROJECT BRIEF:
${projectBrief}

COMPANY FOCUS:
Vegas Improv Power teaches "Improv for Being a Human®" using Functional Improv® methodology. We focus on real-world applications, practical skill development, and personal growth through experiential learning.

BRAINSTORMING REQUIREMENTS:

**20 MAIN H2 HEADINGS** (for article content):
Generate 20 diverse H2 headings that could serve as main sections. Focus on:
- Practical applications and techniques
- Real-world scenarios and examples
- Skill development and personal growth
- Creative angles that avoid generic topics
- Different perspectives and approaches
- Actionable insights readers can apply immediately

**3 INTRODUCTION OPTIONS** (meta-descriptions only):
Provide 3 different intro approaches with brief descriptions:
- Hook-focused: Start with compelling statistics or questions
- Story-driven: Begin with relatable scenarios or case studies
- Problem-solution: Identify pain points and promise solutions

**3 CONCLUSION OPTIONS** (meta-descriptions only):
Provide 3 different conclusion approaches with brief descriptions:
- Call-to-action focused: Drive specific reader actions
- Summary and reflection: Synthesize key takeaways
- Forward-looking: Inspire continued growth and learning

IMPORTANT GUIDELINES:
- NO web browsing or research - avoid copycat content
- Focus on unique Vegas Improv Power perspectives
- Ensure H2s are diverse and non-repetitive
- Make headings specific and actionable
- Consider both individual and corporate applications
- Include beginner and advanced concepts

Please format your response clearly with numbered lists for each section.`;
    }

    /**
     * Parse brainstorming response
     */
    parseBrainstormResponse(response) {
        const result = {
            h2Options: [],
            introOptions: [],
            conclusionOptions: [],
            rawResponse: response
        };

        try {
            // Extract H2 headings
            const h2Section = this.extractSection(response, 'MAIN H2 HEADINGS', 'INTRODUCTION OPTIONS');
            if (h2Section) {
                result.h2Options = this.parseNumberedList(h2Section);
            }

            // Extract intro options
            const introSection = this.extractSection(response, 'INTRODUCTION OPTIONS', 'CONCLUSION OPTIONS');
            if (introSection) {
                result.introOptions = this.parseNumberedList(introSection);
            }

            // Extract conclusion options
            const conclusionSection = this.extractSection(response, 'CONCLUSION OPTIONS', null);
            if (conclusionSection) {
                result.conclusionOptions = this.parseNumberedList(conclusionSection);
            }

            // Validate we have enough options
            if (result.h2Options.length < 15) {
                console.warn(`Only generated ${result.h2Options.length} H2 options, expected 20`);
            }

            if (result.introOptions.length < 3) {
                console.warn(`Only generated ${result.introOptions.length} intro options, expected 3`);
            }

            if (result.conclusionOptions.length < 3) {
                console.warn(`Only generated ${result.conclusionOptions.length} conclusion options, expected 3`);
            }

        } catch (error) {
            console.error('Error parsing brainstorm response:', error);
            // Fallback: try to extract any numbered lists
            result.h2Options = this.parseNumberedList(response);
        }

        return result;
    }

    /**
     * Extract a section between two headers
     */
    extractSection(text, startHeader, endHeader) {
        try {
            const startPattern = new RegExp(`(?:${startHeader}|\\*\\*${startHeader}\\*\\*)`, 'i');
            const startMatch = text.search(startPattern);
            
            if (startMatch === -1) return null;

            let endMatch = text.length;
            if (endHeader) {
                const endPattern = new RegExp(`(?:${endHeader}|\\*\\*${endHeader}\\*\\*)`, 'i');
                const endPos = text.search(endPattern);
                if (endPos > startMatch) {
                    endMatch = endPos;
                }
            }

            return text.substring(startMatch, endMatch);
        } catch (error) {
            console.error('Error extracting section:', error);
            return null;
        }
    }

    /**
     * Parse numbered list from text
     */
    parseNumberedList(text) {
        if (!text) return [];

        const items = [];
        
        // Match numbered items (1., 2., etc.)
        const numberPattern = /^\s*(\d+)\.\s*(.+?)(?=\n\s*\d+\.|$)/gm;
        let match;
        
        while ((match = numberPattern.exec(text)) !== null) {
            const item = match[2].trim();
            if (item && item.length > 5) { // Filter out very short items
                items.push(item);
            }
        }

        // If no numbered items found, try bullet points
        if (items.length === 0) {
            const bulletPattern = /^\s*[-*•]\s*(.+?)(?=\n\s*[-*•]|$)/gm;
            while ((match = bulletPattern.exec(text)) !== null) {
                const item = match[1].trim();
                if (item && item.length > 5) {
                    items.push(item);
                }
            }
        }

        return items;
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        return `You are the Blog Brainstormer for Vegas Improv Power, specializing in generating creative and diverse content ideas that align with our "Improv for Being a Human®" philosophy.

ROLE RESPONSIBILITIES:
1. Topic Ideation: Generate blog post ideas based on trends, keywords, and audience needs
2. Content Strategy: Develop comprehensive content plans aligned with business goals
3. SEO Research: Identify high-value keywords and search opportunities
4. Audience Analysis: Understand target demographics and content preferences
5. Creative Thinking: Generate unique angles that avoid generic or obvious approaches

COMPANY CONTEXT:
${COMPANY_INFO}

BRAINSTORMING PRINCIPLES:
- Focus on practical applications over theoretical concepts
- Generate diverse perspectives and approaches
- Avoid generic, obvious, or overused topics
- Consider both individual and corporate applications
- Emphasize actionable insights and real-world benefits
- Maintain Vegas Improv Power's unique voice and methodology

QUALITY STANDARDS:
- Generate 20 diverse H2 headings for comprehensive coverage
- Provide 3 distinct intro and conclusion approaches
- Ensure all headings are specific and actionable
- Focus on unique insights rather than common knowledge
- Consider beginner through advanced skill levels

Your brainstorming should reflect Vegas Improv Power's innovative approach to using improv for personal and professional development.`;
    }

    /**
     * Validate brainstorming results
     */
    validateResults(results) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check H2 count
        if (results.h2Options.length < 15) {
            validation.errors.push(`Generated ${results.h2Options.length} H2 options, need at least 15`);
            validation.valid = false;
        }

        // Check for duplicate or very similar H2s
        const duplicates = this.findDuplicates(results.h2Options);
        if (duplicates.length > 0) {
            validation.warnings.push(`Potential duplicate H2s found: ${duplicates.join(', ')}`);
        }

        // Check intro options
        if (results.introOptions.length < 3) {
            validation.warnings.push(`Generated ${results.introOptions.length} intro options, expected 3`);
        }

        // Check conclusion options
        if (results.conclusionOptions.length < 3) {
            validation.warnings.push(`Generated ${results.conclusionOptions.length} conclusion options, expected 3`);
        }

        return validation;
    }

    /**
     * Find potential duplicates in H2 list
     */
    findDuplicates(h2s) {
        const duplicates = [];
        const seen = new Set();

        for (const h2 of h2s) {
            const normalized = h2.toLowerCase().replace(/[^\w\s]/g, '').trim();
            const words = normalized.split(/\s+/);
            const key = words.slice(0, 3).join(' '); // Compare first 3 words

            if (seen.has(key)) {
                duplicates.push(h2);
            } else {
                seen.add(key);
            }
        }

        return duplicates;
    }
}

// Export for use in workflow
window.BrainstormerAgent = BrainstormerAgent;