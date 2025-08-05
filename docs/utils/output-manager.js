/**
 * Output Manager
 * Handles organized file structure and metadata collection for blog workflow outputs
 */

class OutputManager {
    constructor() {
        this.currentSession = null;
        this.sessionStartTime = null;
        this.stepTimings = {};
        this.metadata = {};
    }

    /**
     * Initialize a new workflow session
     */
    initializeSession(inputs) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const titleSlug = this.createSlug(inputs.title || 'untitled-blog-post');
        
        this.currentSession = {
            id: `${titleSlug}-${timestamp}`,
            inputs: { ...inputs },
            startTime: new Date().toISOString(),
            stepOutputs: {},
            stepTimings: {},
            modelUsage: {},
            qualityMetrics: {}
        };
        
        this.sessionStartTime = Date.now();
        console.log(`Initialized workflow session: ${this.currentSession.id}`);
        
        return this.currentSession.id;
    }

    /**
     * Record the start of a workflow step
     */
    startStep(stepNumber, agentType, modelUsed) {
        if (!this.currentSession) {
            throw new Error('No active session. Call initializeSession() first.');
        }

        const stepKey = `step-${stepNumber}`;
        this.stepTimings[stepKey] = Date.now();
        
        // Track model usage
        if (modelUsed) {
            if (!this.currentSession.modelUsage[modelUsed]) {
                this.currentSession.modelUsage[modelUsed] = [];
            }
            this.currentSession.modelUsage[modelUsed].push({
                step: stepNumber,
                agentType,
                startTime: new Date().toISOString()
            });
        }

        console.log(`Started step ${stepNumber} (${agentType}) using model: ${modelUsed}`);
    }

    /**
     * Record the completion of a workflow step
     */
    completeStep(stepNumber, agentType, output, modelUsed) {
        if (!this.currentSession) {
            throw new Error('No active session. Call initializeSession() first.');
        }

        const stepKey = `step-${stepNumber}`;
        const startTime = this.stepTimings[stepKey];
        const duration = startTime ? Date.now() - startTime : null;

        // Store step output
        this.currentSession.stepOutputs[stepKey] = {
            agentType,
            modelUsed,
            output,
            startTime: startTime ? new Date(startTime).toISOString() : null,
            completedTime: new Date().toISOString(),
            duration: duration,
            outputSize: this.calculateOutputSize(output),
            wordCount: this.getWordCount(output)
        };

        // Update step timing in session
        this.currentSession.stepTimings[stepKey] = duration;

        console.log(`Completed step ${stepNumber} (${agentType}) in ${duration}ms`);
    }

    /**
     * Record quality metrics from the review step
     */
    recordQualityMetrics(metrics) {
        if (!this.currentSession) {
            throw new Error('No active session. Call initializeSession() first.');
        }

        this.currentSession.qualityMetrics = {
            ...metrics,
            recordedAt: new Date().toISOString()
        };
    }

    /**
     * Generate comprehensive workflow metadata
     */
    generateMetadata() {
        if (!this.currentSession) {
            throw new Error('No active session. Call initializeSession() first.');
        }

        const totalDuration = Date.now() - this.sessionStartTime;
        const finalOutput = this.getFinalBlogPost();
        
        return {
            sessionInfo: {
                id: this.currentSession.id,
                startTime: this.currentSession.startTime,
                endTime: new Date().toISOString(),
                totalDuration: totalDuration,
                totalDurationFormatted: this.formatDuration(totalDuration)
            },
            originalInputs: this.currentSession.inputs,
            workflowSteps: Object.keys(this.currentSession.stepOutputs).map(stepKey => {
                const step = this.currentSession.stepOutputs[stepKey];
                return {
                    step: stepKey,
                    agentType: step.agentType,
                    modelUsed: step.modelUsed,
                    duration: step.duration,
                    durationFormatted: this.formatDuration(step.duration),
                    outputSize: step.outputSize,
                    wordCount: step.wordCount,
                    startTime: step.startTime,
                    completedTime: step.completedTime
                };
            }),
            modelUsage: this.analyzeModelUsage(),
            contentMetrics: this.analyzeContentMetrics(finalOutput),
            qualityMetrics: this.currentSession.qualityMetrics,
            performanceMetrics: this.calculatePerformanceMetrics()
        };
    }

    /**
     * Generate organized output structure
     */
    generateOrganizedOutput() {
        if (!this.currentSession) {
            throw new Error('No active session. Call initializeSession() first.');
        }

        const metadata = this.generateMetadata();
        const finalBlogPost = this.getFinalBlogPost();
        const title = this.extractTitle(finalBlogPost) || 'untitled-blog-post';
        const titleSlug = this.createSlug(title);

        return {
            sessionId: this.currentSession.id,
            files: {
                [`${titleSlug}.md`]: finalBlogPost,
                [`${titleSlug}-metadata.md`]: this.formatMetadataAsMarkdown(metadata),
                [`${titleSlug}-workflow.json`]: JSON.stringify(metadata, null, 2),
                'workflow-steps.json': JSON.stringify(this.currentSession.stepOutputs, null, 2)
            },
            structure: {
                mainFile: `${titleSlug}.md`,
                metadataFile: `${titleSlug}-metadata.md`,
                workflowFile: `${titleSlug}-workflow.json`,
                stepsFile: 'workflow-steps.json'
            },
            summary: {
                title: title,
                wordCount: this.getWordCount(finalBlogPost),
                totalDuration: metadata.sessionInfo.totalDurationFormatted,
                stepsCompleted: Object.keys(this.currentSession.stepOutputs).length,
                modelsUsed: Object.keys(this.currentSession.modelUsage),
                qualityScore: this.currentSession.qualityMetrics?.overallScore || 'Not assessed'
            }
        };
    }

    /**
     * Helper: Create URL-friendly slug
     */
    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/-+/g, '-')      // Replace multiple hyphens with single
            .trim()
            .substring(0, 50)         // Limit length
            .replace(/-$/, '');       // Remove trailing hyphen
    }

    /**
     * Helper: Extract title from blog post content
     */
    extractTitle(content) {
        if (!content || typeof content !== 'string') return null;
        
        // Look for the first # heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        
        // Look for title in first line
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
            return firstLine.replace(/^#+\s*/, '').trim();
        }
        
        return null;
    }

    /**
     * Helper: Get final blog post from workflow outputs
     */
    getFinalBlogPost() {
        if (!this.currentSession || !this.currentSession.stepOutputs) {
            return '';
        }

        // Look for final output in step 9 (orchestrator compilation)
        const step9 = this.currentSession.stepOutputs['step-9'];
        if (step9 && step9.output && step9.output.blogPost) {
            return step9.output.blogPost;
        }

        // Fall back to step 8 (revisions)
        const step8 = this.currentSession.stepOutputs['step-8'];
        if (step8 && step8.output && step8.output.revisedBlogPost) {
            return step8.output.revisedBlogPost;
        }

        // Fall back to step 6 (initial content)
        const step6 = this.currentSession.stepOutputs['step-6'];
        if (step6 && step6.output && step6.output.finalBlogPost) {
            return step6.output.finalBlogPost;
        }

        return 'No final blog post found in workflow outputs';
    }

    /**
     * Helper: Analyze model usage patterns
     */
    analyzeModelUsage() {
        const usage = {};
        Object.keys(this.currentSession.modelUsage).forEach(model => {
            const usages = this.currentSession.modelUsage[model];
            usage[model] = {
                timesUsed: usages.length,
                steps: usages.map(u => u.step),
                agentTypes: [...new Set(usages.map(u => u.agentType))]
            };
        });
        return usage;
    }

    /**
     * Helper: Analyze content metrics
     */
    analyzeContentMetrics(content) {
        if (!content || typeof content !== 'string') {
            return { error: 'No content to analyze' };
        }

        const wordCount = this.getWordCount(content);
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
        const h2Count = (content.match(/^##\s+/gm) || []).length;
        const h3Count = (content.match(/^###\s+/gm) || []).length;
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0).length;

        return {
            wordCount,
            characterCount: content.length,
            readingTimeMinutes: readingTime,
            headingStructure: {
                h2Count,
                h3Count,
                totalHeadings: h2Count + h3Count
            },
            paragraphCount: paragraphs,
            averageWordsPerParagraph: Math.round(wordCount / paragraphs)
        };
    }

    /**
     * Helper: Calculate performance metrics
     */
    calculatePerformanceMetrics() {
        const stepDurations = Object.values(this.currentSession.stepTimings);
        const totalDuration = stepDurations.reduce((sum, duration) => sum + duration, 0);
        
        return {
            totalDuration,
            averageStepDuration: Math.round(totalDuration / stepDurations.length),
            fastestStep: Math.min(...stepDurations),
            slowestStep: Math.max(...stepDurations),
            stepsCompleted: stepDurations.length
        };
    }

    /**
     * Helper: Format metadata as readable Markdown
     */
    formatMetadataAsMarkdown(metadata) {
        return `# Blog Workflow Metadata

## Session Information
- **Session ID**: ${metadata.sessionInfo.id}
- **Started**: ${metadata.sessionInfo.startTime}
- **Completed**: ${metadata.sessionInfo.endTime}
- **Total Duration**: ${metadata.sessionInfo.totalDurationFormatted}

## Original Inputs
- **Title**: ${metadata.originalInputs.title || 'Not provided'}
- **Keywords**: ${metadata.originalInputs.keywords || 'Not provided'}
- **Context**: ${metadata.originalInputs.context || 'Not provided'}
- **Web Research Enabled**: ${metadata.originalInputs.allowWeb ? 'Yes' : 'No'}

## Workflow Steps
${metadata.workflowSteps.map(step => `
### ${step.step} - ${step.agentType}
- **Model Used**: ${step.modelUsed}
- **Duration**: ${step.durationFormatted}
- **Output Size**: ${step.outputSize} characters
- **Word Count**: ${step.wordCount} words
- **Completed**: ${step.completedTime}
`).join('')}

## Model Usage Analysis
${Object.keys(metadata.modelUsage).map(model => `
### ${model}
- **Times Used**: ${metadata.modelUsage[model].timesUsed}
- **Steps**: ${metadata.modelUsage[model].steps.join(', ')}
- **Agent Types**: ${metadata.modelUsage[model].agentTypes.join(', ')}
`).join('')}

## Content Metrics
- **Word Count**: ${metadata.contentMetrics.wordCount}
- **Reading Time**: ${metadata.contentMetrics.readingTimeMinutes} minutes
- **H2 Headings**: ${metadata.contentMetrics.headingStructure.h2Count}
- **H3 Headings**: ${metadata.contentMetrics.headingStructure.h3Count}
- **Paragraphs**: ${metadata.contentMetrics.paragraphCount}
- **Avg Words/Paragraph**: ${metadata.contentMetrics.averageWordsPerParagraph}

## Quality Metrics
${metadata.qualityMetrics && Object.keys(metadata.qualityMetrics).length > 0 ? 
    Object.keys(metadata.qualityMetrics).map(key => 
        `- **${key}**: ${metadata.qualityMetrics[key]}`
    ).join('\n') : 
    '- No quality metrics recorded'}

## Performance Metrics
- **Average Step Duration**: ${this.formatDuration(metadata.performanceMetrics.averageStepDuration)}
- **Fastest Step**: ${this.formatDuration(metadata.performanceMetrics.fastestStep)}
- **Slowest Step**: ${this.formatDuration(metadata.performanceMetrics.slowestStep)}
- **Steps Completed**: ${metadata.performanceMetrics.stepsCompleted}

---
*Generated by Claude-Powered Blog Workflow on ${new Date().toISOString()}*
`;
    }

    /**
     * Helper: Calculate output size
     */
    calculateOutputSize(output) {
        if (!output) return 0;
        if (typeof output === 'string') return output.length;
        return JSON.stringify(output).length;
    }

    /**
     * Helper: Get word count
     */
    getWordCount(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Helper: Format duration in milliseconds to readable format
     */
    formatDuration(ms) {
        if (!ms || isNaN(ms)) return '0s';
        
        if (ms < 1000) return `${ms}ms`;
        
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    /**
     * Get current session info
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Reset for new workflow
     */
    reset() {
        this.currentSession = null;
        this.sessionStartTime = null;
        this.stepTimings = {};
        this.metadata = {};
    }
}

// Export for use in other modules
window.OutputManager = OutputManager;