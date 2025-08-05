/**
 * Workflow Manager
 * Coordinates the entire blog creation workflow
 */

class WorkflowManager {
    constructor(apiClient, storageManager) {
        this.apiClient = apiClient;
        this.storage = storageManager;
        this.outputManager = new OutputManager();
        this.currentWorkflow = null;
        this.steps = [
            { id: 0, name: 'Content Planning', agent: 'content-planner' },
            { id: 1, name: 'Workflow Orchestration', agent: 'orchestrator' },
            { id: 2, name: 'Brainstorming', agent: 'brainstormer' },
            { id: 3, name: 'Outline Creation', agent: 'outline-writer' },
            { id: 4, name: 'H3 Suggestions', agent: 'content-writer' },
            { id: 5, name: 'Outline Finalization', agent: 'outline-writer' },
            { id: 6, name: 'Content Writing', agent: 'content-writer' },
            { id: 7, name: 'Content Review', agent: 'reviewer' },
            { id: 8, name: 'Revision', agent: 'content-writer' },
            { id: 9, name: 'Final Compilation', agent: 'orchestrator' }
        ];
        this.eventHandlers = {};
        this.abortController = null;
    }

    /**
     * Start a new workflow
     */
    async startWorkflow(inputs) {
        try {
            // Create new workflow
            const workflowId = this.storage.generateWorkflowId();
            this.currentWorkflow = {
                id: workflowId,
                status: 'running',
                inputs: inputs,
                steps: this.steps.map(step => ({
                    ...step,
                    status: 'pending',
                    output: null,
                    error: null,
                    startTime: null,
                    endTime: null
                })),
                startTime: Date.now(),
                endTime: null,
                finalOutput: null,
                metadata: {}
            };

            // Initialize output manager session
            const sessionId = this.outputManager.initializeSession(inputs);
            this.currentWorkflow.sessionId = sessionId;

            // Save initial state
            this.storage.saveWorkflow(workflowId, this.currentWorkflow);

            // Create abort controller for cancellation
            this.abortController = new AbortController();

            // Emit workflow started event
            this.emit('workflowStarted', { workflow: this.currentWorkflow });

            // Execute workflow steps
            await this.executeWorkflow();

            return this.currentWorkflow;
        } catch (error) {
            console.error('Workflow failed:', error);
            if (this.currentWorkflow) {
                this.currentWorkflow.status = 'error';
                this.currentWorkflow.error = error.message;
                this.currentWorkflow.endTime = Date.now();
                this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);
            }
            this.emit('workflowError', { error, workflow: this.currentWorkflow });
            throw error;
        }
    }

    /**
     * Execute the complete workflow
     */
    async executeWorkflow() {
        for (let i = 0; i < this.steps.length; i++) {
            // Check if workflow was aborted
            if (this.abortController?.signal.aborted) {
                throw new Error('Workflow was cancelled');
            }

            const step = this.currentWorkflow.steps[i];
            await this.executeStep(step, i);

            // Save progress after each step
            this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);

            // Update progress
            this.emit('progressUpdate', {
                step: i,
                total: this.steps.length,
                percentage: Math.round(((i + 1) / this.steps.length) * 100)
            });
        }

        // Mark workflow as completed
        this.currentWorkflow.status = 'completed';
        this.currentWorkflow.endTime = Date.now();

        // Generate organized outputs using Output Manager
        const organizedOutput = this.outputManager.generateOrganizedOutput();
        this.currentWorkflow.organizedOutput = organizedOutput;

        this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);
        
        this.emit('workflowCompleted', { 
            workflow: this.currentWorkflow, 
            organizedOutput: organizedOutput 
        });
    }

    /**
     * Execute a single step
     */
    async executeStep(step, stepIndex) {
        try {
            step.status = 'running';
            step.startTime = Date.now();
            
            // Get the appropriate agent
            const agent = this.getAgent(step.agent);
            if (!agent) {
                throw new Error(`Agent ${step.agent} not found`);
            }

            // Get the model that will be used for this agent
            const modelToUse = this.apiClient.getModelForAgent(agent.agentType || step.agent);
            
            // Start tracking in output manager
            this.outputManager.startStep(stepIndex, step.agent, modelToUse);
            
            this.emit('stepStarted', { step, stepIndex, modelUsed: modelToUse });

            // Prepare context for the agent
            const context = this.buildContext(stepIndex);

            // Execute the agent
            const result = await agent.execute(context, this.currentWorkflow.inputs);

            // Store the result
            step.output = result;
            step.status = 'completed';
            step.endTime = Date.now();

            // Complete tracking in output manager
            this.outputManager.completeStep(stepIndex, step.agent, result, modelToUse);

            this.emit('stepCompleted', { step, stepIndex, result, modelUsed: modelToUse });

        } catch (error) {
            step.status = 'error';
            step.error = error.message;
            step.endTime = Date.now();
            
            this.emit('stepError', { step, stepIndex, error });
            throw error;
        }
    }

    /**
     * Build context for an agent based on previous steps
     */
    buildContext(currentStepIndex) {
        const context = {
            workflowId: this.currentWorkflow.id,
            currentStep: currentStepIndex,
            totalSteps: this.steps.length,
            previousOutputs: {},
            companyInfo: COMPANY_INFO
        };

        // Add outputs from previous steps
        for (let i = 0; i < currentStepIndex; i++) {
            const prevStep = this.currentWorkflow.steps[i];
            if (prevStep.output) {
                context.previousOutputs[prevStep.agent] = prevStep.output;
            }
        }

        return context;
    }

    /**
     * Get agent instance
     */
    getAgent(agentName) {
        const agents = {
            'content-planner': window.ContentPlannerAgent,
            'orchestrator': window.OrchestratorAgent,
            'brainstormer': window.BrainstormerAgent,
            'outline-writer': window.OutlineWriterAgent,
            'content-writer': window.ContentWriterAgent,
            'reviewer': window.ReviewerAgent
        };

        const AgentClass = agents[agentName];
        if (AgentClass) {
            return new AgentClass(this.apiClient);
        }
        return null;
    }

    /**
     * Cancel the current workflow
     */
    cancelWorkflow() {
        if (this.abortController) {
            this.abortController.abort();
        }
        
        if (this.currentWorkflow) {
            this.currentWorkflow.status = 'cancelled';
            this.currentWorkflow.endTime = Date.now();
            this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);
        }

        this.emit('workflowCancelled', { workflow: this.currentWorkflow });
    }

    /**
     * Resume a workflow from a saved state
     */
    async resumeWorkflow(workflowId) {
        try {
            const savedWorkflow = this.storage.loadWorkflow(workflowId);
            if (!savedWorkflow) {
                throw new Error('Workflow not found');
            }

            this.currentWorkflow = savedWorkflow;
            
            // Find the last completed step
            let resumeFromStep = 0;
            for (let i = 0; i < this.currentWorkflow.steps.length; i++) {
                if (this.currentWorkflow.steps[i].status === 'completed') {
                    resumeFromStep = i + 1;
                } else {
                    break;
                }
            }

            if (resumeFromStep >= this.steps.length) {
                throw new Error('Workflow already completed');
            }

            // Reset steps from resume point
            for (let i = resumeFromStep; i < this.currentWorkflow.steps.length; i++) {
                this.currentWorkflow.steps[i].status = 'pending';
                this.currentWorkflow.steps[i].error = null;
            }

            this.currentWorkflow.status = 'running';
            this.abortController = new AbortController();

            this.emit('workflowResumed', { workflow: this.currentWorkflow, resumeFromStep });

            // Continue execution from resume point
            for (let i = resumeFromStep; i < this.steps.length; i++) {
                if (this.abortController?.signal.aborted) {
                    throw new Error('Workflow was cancelled');
                }

                const step = this.currentWorkflow.steps[i];
                await this.executeStep(step, i);
                this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);
                
                this.emit('progressUpdate', {
                    step: i,
                    total: this.steps.length,
                    percentage: Math.round(((i + 1) / this.steps.length) * 100)
                });
            }

            this.currentWorkflow.status = 'completed';
            this.currentWorkflow.endTime = Date.now();
            this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);
            
            this.emit('workflowCompleted', { workflow: this.currentWorkflow });

        } catch (error) {
            console.error('Failed to resume workflow:', error);
            if (this.currentWorkflow) {
                this.currentWorkflow.status = 'error';
                this.currentWorkflow.error = error.message;
                this.storage.saveWorkflow(this.currentWorkflow.id, this.currentWorkflow);
            }
            this.emit('workflowError', { error, workflow: this.currentWorkflow });
            throw error;
        }
    }

    /**
     * Get workflow status
     */
    getWorkflowStatus() {
        return this.currentWorkflow ? {
            id: this.currentWorkflow.id,
            status: this.currentWorkflow.status,
            currentStep: this.getCurrentStepIndex(),
            totalSteps: this.steps.length,
            progress: this.getProgress(),
            startTime: this.currentWorkflow.startTime,
            endTime: this.currentWorkflow.endTime,
            duration: this.getDuration()
        } : null;
    }

    /**
     * Get current step index
     */
    getCurrentStepIndex() {
        if (!this.currentWorkflow) return -1;
        
        for (let i = 0; i < this.currentWorkflow.steps.length; i++) {
            if (this.currentWorkflow.steps[i].status === 'running') {
                return i;
            }
        }
        
        // Find last completed step
        for (let i = this.currentWorkflow.steps.length - 1; i >= 0; i--) {
            if (this.currentWorkflow.steps[i].status === 'completed') {
                return i + 1;
            }
        }
        
        return 0;
    }

    /**
     * Get workflow progress percentage
     */
    getProgress() {
        if (!this.currentWorkflow) return 0;
        
        const completedSteps = this.currentWorkflow.steps.filter(step => step.status === 'completed').length;
        return Math.round((completedSteps / this.steps.length) * 100);
    }

    /**
     * Get workflow duration
     */
    getDuration() {
        if (!this.currentWorkflow || !this.currentWorkflow.startTime) return 0;
        
        const endTime = this.currentWorkflow.endTime || Date.now();
        return endTime - this.currentWorkflow.startTime;
    }

    /**
     * Event system
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get workflow results for download
     */
    getWorkflowResults() {
        if (!this.currentWorkflow || this.currentWorkflow.status !== 'completed') {
            return null;
        }

        const finalStep = this.currentWorkflow.steps[this.currentWorkflow.steps.length - 1];
        if (!finalStep.output) {
            return null;
        }

        return {
            blogPost: finalStep.output.blogPost,
            metadata: {
                workflow: this.currentWorkflow,
                generatedAt: new Date().toISOString(),
                inputs: this.currentWorkflow.inputs,
                steps: this.currentWorkflow.steps.map(step => ({
                    name: step.name,
                    agent: step.agent,
                    status: step.status,
                    duration: step.endTime - step.startTime,
                    outputLength: step.output ? JSON.stringify(step.output).length : 0
                })),
                totalDuration: this.getDuration(),
                wordCount: this.getWordCount(finalStep.output.blogPost)
            }
        };
    }

    /**
     * Get word count from text
     */
    getWordCount(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

// Export for use in other modules
window.WorkflowManager = WorkflowManager;