/**
 * Blog Workflow Orchestrator Agent
 * Master agent that manages the complete blog creation workflow
 */

// Company Information Constant
const COMPANY_INFO = `Vegas Improv Power is a Las Vegas-based company that revolutionizes traditional improv by focusing on real-life applications and personal growth. Our tagline "Improv for Being a Human®" reflects our core belief that improvisational theater is a powerful tool for personal development, enhancing communication skills, and helping people navigate life's unpredictable moments with confidence and creativity.

We utilize our proprietary Functional Improv® methodology, which combines learning with play to develop a comprehensive range of life skills including communication, leadership, emotional intelligence, creativity, and adaptability. Our offerings span from individual classes for personal growth to bespoke corporate workshops designed to address specific organizational challenges around team building, communication, and public speaking.

We create an inclusive, supportive community where adults of all experience levels can rediscover the joy of play while developing practical skills that enhance both personal and professional success. Our approach addresses the whole person - fostering creativity and innovation, improving mental and physical well-being, and building cultural and social awareness through experiential learning that participants immediately apply to their daily lives.

BRAND VOICE GUIDELINES:
- Professional yet playful: Balance expertise with the joy of discovery
- Inclusive and supportive: Welcome all experience levels and backgrounds
- Growth-focused: Emphasize practical applications and real-world benefits
- Human-centered: Focus on authentic personal development over performance
- Holistic: Address the whole person - personal, professional, and wellness aspects

TARGET AUDIENCES:
Primary: Adults seeking personal growth through practical skill development
Secondary: Corporate teams and organizations looking for innovative team building and professional development
Tertiary: HR professionals and team leaders seeking evidence-based collaboration solutions

CORE MESSAGING THEMES:
- Improv as a life skill, not just entertainment
- Real-world applications of improvisational techniques
- Personal development through experiential learning
- Building confidence, communication, and creativity
- The power of "Yes, And" thinking in daily life
- Community building and inclusive growth environments`;

class OrchestratorAgent {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.name = 'Blog Workflow Orchestrator';
        this.role = 'orchestrator';
        this.agentType = 'orchestrator'; // For model selection
        this.preferredModel = 'claude-opus-4-1-20250805'; // High-reasoning tasks
    }

    /**
     * Execute orchestrator step
     */
    async execute(context, inputs) {
        try {
            console.log('Blog Workflow Orchestrator starting...');

            if (context.currentStep === 1) {
                // Step 1: Initial workflow setup and project brief
                return await this.initializeWorkflow(context, inputs);
            } else if (context.currentStep === 9) {
                // Step 9: Final compilation
                return await this.compileResults(context, inputs);
            } else {
                throw new Error(`Orchestrator called at unexpected step: ${context.currentStep}`);
            }

        } catch (error) {
            console.error('Orchestrator failed:', error);
            throw new Error(`Workflow orchestration failed: ${error.message}`);
        }
    }

    /**
     * Initialize the workflow with project brief
     */
    async initializeWorkflow(context, inputs) {
        const prompt = `As the Blog Workflow Orchestrator for Vegas Improv Power, I'm setting up a comprehensive blog creation workflow.

PROJECT INPUTS:
- Title: "${inputs.title}"
- Keywords: "${inputs.keywords}"
- Context: "${inputs.context}"
- Web Research: ${inputs.allowWeb ? 'Enabled' : 'Disabled'}

COMPANY CONTEXT:
${COMPANY_INFO}

Please create a detailed PROJECT BRIEF that will guide all subsequent agents. Include:

1. **Content Strategy**: How this blog post fits into Vegas Improv Power's content goals
2. **Target Audience Analysis**: Primary audience, their needs, and pain points
3. **Content Goals**: What we want readers to learn, feel, and do
4. **SEO Strategy**: Primary/secondary keywords and search intent
5. **Quality Standards**: Word count, tone, structure requirements
6. **Success Metrics**: How we'll measure this post's effectiveness

Format your response as a structured project brief that other agents can reference.`;

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

        return {
            projectBrief: response,
            workflowPhase: 'initialization',
            nextSteps: [
                'Brainstorming 20 H2 headings',
                'Creating structured outline',
                'Writing compelling content',
                'Review and optimization'
            ],
            qualityGates: {
                brainstorming: 'Diverse, creative H2s that avoid generic topics',
                outline: 'Logical flow with clear story progression',
                content: 'Engaging writing with practical takeaways',
                review: 'Publication-ready quality with strong SEO'
            }
        };
    }

    /**
     * Compile final results
     */
    async compileResults(context, inputs) {
        // Get outputs from previous steps
        const brainstormOutput = context.previousOutputs['brainstormer'];
        const outlineOutput = context.previousOutputs['outline-writer'];
        const contentOutput = context.previousOutputs['content-writer'];
        const reviewOutput = context.previousOutputs['reviewer'];

        // Get the final content (after revisions)
        const finalContent = this.extractFinalContent(contentOutput, reviewOutput);

        const prompt = `As the Blog Workflow Orchestrator, I'm compiling the final deliverables for this blog post workflow.

WORKFLOW SUMMARY:
- Original inputs: Title "${inputs.title}", Keywords "${inputs.keywords}"
- Brainstorming generated ${this.countH2s(brainstormOutput)} H2 options
- Outline selected ${this.countSelectedH2s(outlineOutput)} final H2s
- Content creation produced ${this.getWordCount(finalContent)} words
- Review process completed with quality approval

FINAL BLOG CONTENT:
${finalContent}

Please provide:

1. **FINAL BLOG POST**: Clean, formatted Markdown ready for publication
2. **METADATA SUMMARY**: 
   - Word count and reading time
   - SEO keyword optimization score
   - Content quality assessment
   - Target audience alignment
3. **PUBLICATION CHECKLIST**: Items to verify before publishing
4. **PERFORMANCE PREDICTIONS**: Expected engagement and SEO performance

Format as a complete deliverable package.`;

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
            temperature: 0.4,
            agentType: this.agentType
        });

        // Parse the response to extract blog post and metadata
        const parsed = this.parseCompilationResponse(response, finalContent);

        return {
            blogPost: parsed.blogPost || finalContent,
            metadata: parsed.metadata,
            publicationChecklist: parsed.checklist,
            performancePredictions: parsed.predictions,
            workflowSummary: {
                totalSteps: 10,
                completedAt: new Date().toISOString(),
                originalInputs: inputs,
                finalWordCount: this.getWordCount(parsed.blogPost || finalContent),
                processingTime: this.calculateProcessingTime(context)
            }
        };
    }

    /**
     * Extract final content from content writer output
     */
    extractFinalContent(contentOutput, reviewOutput) {
        // Look for revised content first, then fall back to original
        if (reviewOutput && reviewOutput.revisedContent) {
            return reviewOutput.revisedContent;
        }
        
        if (contentOutput && contentOutput.finalBlogPost) {
            return contentOutput.finalBlogPost;
        }
        
        if (contentOutput && contentOutput.content) {
            return contentOutput.content;
        }
        
        return 'Content not found';
    }

    /**
     * Parse compilation response
     */
    parseCompilationResponse(response, fallbackContent) {
        const result = {
            blogPost: fallbackContent,
            metadata: {},
            checklist: [],
            predictions: {}
        };

        try {
            // Extract final blog post (look for markdown content)
            const blogPostMatch = response.match(/(?:FINAL BLOG POST|# .+?\n)([\s\S]*?)(?=\n\n(?:METADATA|PUBLICATION|PERFORMANCE|\d+\.|$))/i);
            if (blogPostMatch) {
                result.blogPost = blogPostMatch[1].trim();
            }

            // Extract metadata
            const metadataMatch = response.match(/METADATA SUMMARY[\s\S]*?(?=\n\n(?:PUBLICATION|PERFORMANCE|\d+\.|$))/i);
            if (metadataMatch) {
                result.metadata.summary = metadataMatch[0];
            }

            // Extract checklist
            const checklistMatch = response.match(/PUBLICATION CHECKLIST[\s\S]*?(?=\n\n(?:PERFORMANCE|\d+\.|$))/i);
            if (checklistMatch) {
                result.checklist = checklistMatch[0];
            }

            // Extract predictions
            const predictionsMatch = response.match(/PERFORMANCE PREDICTIONS[\s\S]*$/i);
            if (predictionsMatch) {
                result.predictions.summary = predictionsMatch[0];
            }

        } catch (error) {
            console.error('Error parsing compilation response:', error);
        }

        return result;
    }

    /**
     * Helper methods
     */
    countH2s(brainstormOutput) {
        if (!brainstormOutput || !brainstormOutput.h2Options) return 0;
        return brainstormOutput.h2Options.length || 0;
    }

    countSelectedH2s(outlineOutput) {
        if (!outlineOutput || !outlineOutput.selectedH2s) return 0;
        return outlineOutput.selectedH2s.length || 0;
    }

    getWordCount(content) {
        if (!content || typeof content !== 'string') return 0;
        return content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    calculateProcessingTime(context) {
        // This would be calculated based on step timestamps
        return 'Processing time calculation not implemented';
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        return `You are the Blog Workflow Orchestrator for Vegas Improv Power, responsible for managing the complete blog creation workflow with strategic oversight and quality assurance.

ROLE RESPONSIBILITIES:
1. Workflow Orchestration: Manage the complete blog creation process end-to-end
2. Sub-Agent Coordination: Delegate tasks to specialized agents while maintaining oversight
3. Quality Assurance: Ensure consistent quality and brand standards across all content
4. Project Management: Track progress, manage timelines, and handle dependencies
5. Content Strategy: Align individual blog posts with broader content strategy

COMPANY CONTEXT:
${COMPANY_INFO}

QUALITY STANDARDS:
- Word Count: 1,500-2,500 words for comprehensive posts
- Reading Level: Accessible to target audience
- SEO Optimization: 1-2% keyword density, natural integration
- Engagement: Clear structure, compelling hooks, strong conclusions
- Brand Voice: Consistent tone and style across all content

You provide strategic oversight while leveraging specialized expertise from sub-agents at each phase of the content creation process.`;
    }
}

// Export for use in workflow
window.OrchestratorAgent = OrchestratorAgent;
window.COMPANY_INFO = COMPANY_INFO;