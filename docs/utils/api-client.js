/**
 * Claude API Client using Puter.js
 * Handles all communication with Claude AI
 */

class ClaudeAPIClient {
    constructor() {
        this.initialized = false;
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
        this.maxRetries = 3;
        this.defaultModel = 'claude-3-5-sonnet-20241022';
        
        // Intelligent model selection configuration
        this.modelConfig = {
            'content-planner': 'claude-3-opus-20240229',    // High-reasoning: Complex input analysis
            'orchestrator': 'claude-3-opus-20240229',       // High-reasoning: Strategic planning
            'outline-writer': 'claude-3-opus-20240229',     // High-reasoning: Content structuring
            'reviewer': 'claude-3-opus-20240229',           // High-reasoning: Quality assessment
            'brainstormer': 'claude-3-5-sonnet-20241022',   // Standard: Creative generation
            'content-writer': 'claude-3-5-sonnet-20241022'  // Standard: Content production
        };
        
        // Fallback model hierarchy
        this.fallbackModels = [
            'claude-3-5-sonnet-20241022',
            'claude-3-opus-20240229',
            'claude-3-haiku-20240307'
        ];
        
        // Model capabilities tracking
        this.modelCapabilities = {};
    }

    /**
     * Initialize the Puter.js client
     */
    async initialize() {
        try {
            // Wait for Puter to be available if it's still loading
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds max wait
            
            while (typeof puter === 'undefined' && attempts < maxAttempts) {
                await this.sleep(100);
                attempts++;
            }
            
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js failed to load. Please check your internet connection and try again.');
            }

            // Initialize Puter if it has an init method
            if (typeof puter.init === 'function') {
                await puter.init();
            }

            // Test connection with a simple request using direct API call
            console.log('Testing Claude API connection...');
            const testResponse = await this.testConnection();

            if (testResponse) {
                this.initialized = true;
                console.log('Claude API client initialized successfully');
                return true;
            } else {
                throw new Error('Connection test failed - unable to reach Claude API');
            }
        } catch (error) {
            console.error('Failed to initialize Claude API client:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Test the connection to Claude API
     */
    async testConnection() {
        try {
            const testMessages = [
                { role: 'user', content: 'Please respond with just "OK" to confirm connection.' }
            ];
            
            const response = await puter.ai.chat(testMessages, {
                model: this.defaultModel,
                max_tokens: 20,
                temperature: 0
            });
            
            console.log('Connection test response:', response);
            return response && (response.includes('OK') || response.includes('ok') || response.length > 0);
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Get the optimal model for a specific agent type
     */
    getModelForAgent(agentType) {
        return this.modelConfig[agentType] || this.defaultModel;
    }

    /**
     * Test model availability and performance
     */
    async testModel(modelName) {
        try {
            const testMessages = [
                { role: 'user', content: 'Please respond with just "OK" to test model availability.' }
            ];
            
            const response = await this.makeRequestWithModel(testMessages, modelName, { max_tokens: 10 });
            const available = response && response.trim().includes('OK');
            
            this.modelCapabilities[modelName] = {
                available,
                lastTested: Date.now(),
                responseTime: available ? Date.now() - this.lastRequestTime : null
            };
            
            return available;
        } catch (error) {
            this.modelCapabilities[modelName] = {
                available: false,
                lastTested: Date.now(),
                error: error.message
            };
            return false;
        }
    }

    /**
     * Get the best available model for an agent with fallback logic
     */
    async getBestAvailableModel(agentType) {
        const preferredModel = this.getModelForAgent(agentType);
        
        // Check if preferred model is available
        const isPreferredAvailable = await this.testModel(preferredModel);
        if (isPreferredAvailable) {
            return preferredModel;
        }
        
        // Try fallback models
        for (const fallbackModel of this.fallbackModels) {
            if (fallbackModel === preferredModel) continue; // Already tested
            
            const isAvailable = await this.testModel(fallbackModel);
            if (isAvailable) {
                console.warn(`Using fallback model ${fallbackModel} for agent ${agentType} (preferred: ${preferredModel})`);
                return fallbackModel;
            }
        }
        
        // If all else fails, return default
        console.error(`All models failed for agent ${agentType}, using default: ${this.defaultModel}`);
        return this.defaultModel;
    }

    /**
     * Make a request with a specific model
     */
    async makeRequestWithModel(messages, model, options = {}) {
        const requestOptions = {
            model: model,
            max_tokens: options.max_tokens || 4000,
            temperature: options.temperature || 0.7,
            ...options
        };

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
        }

        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.lastRequestTime = Date.now();
                
                const response = await puter.ai.chat(messages, requestOptions);
                
                if (response && typeof response === 'string') {
                    return response;
                } else if (response && response.content) {
                    return response.content;
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                lastError = error;
                console.warn(`API request attempt ${attempt} failed with model ${model}:`, error);
                
                if (attempt < this.maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                } else {
                    break;
                }
            }
        }

        throw new Error(`API request failed after ${this.maxRetries} attempts with model ${model}: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Make a request to Claude API with rate limiting and retry logic
     */
    async makeRequest(messages, options = {}) {
        if (!this.initialized) {
            const initSuccess = await this.initialize();
            if (!initSuccess) {
                throw new Error('API client not initialized');
            }
        }

        // Determine the best model to use
        let selectedModel;
        if (options.model) {
            selectedModel = options.model;
        } else if (options.agentType) {
            selectedModel = await this.getBestAvailableModel(options.agentType);
        } else {
            selectedModel = this.defaultModel;
        }

        return await this.makeRequestWithModel(messages, selectedModel, options);
    }

    /**
     * Create a streaming request (simulated for now)
     */
    async makeStreamingRequest(messages, options = {}, onChunk = null) {
        try {
            // For now, we'll simulate streaming by breaking the response into chunks
            const response = await this.makeRequest(messages, options);
            
            if (onChunk && typeof onChunk === 'function') {
                // Simulate streaming by sending chunks
                const words = response.split(' ');
                let currentChunk = '';
                
                for (let i = 0; i < words.length; i++) {
                    currentChunk += (i > 0 ? ' ' : '') + words[i];
                    
                    // Send chunk every 5-10 words
                    if (i % 7 === 0 || i === words.length - 1) {
                        onChunk(currentChunk);
                        currentChunk = '';
                        await this.sleep(100); // Small delay for visual effect
                    }
                }
            }
            
            return response;
        } catch (error) {
            console.error('Streaming request failed:', error);
            throw error;
        }
    }

    /**
     * Utility function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get API status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            rateLimitDelay: this.rateLimitDelay,
            lastRequestTime: this.lastRequestTime,
            puterAvailable: typeof puter !== 'undefined',
            modelConfig: this.modelConfig,
            modelCapabilities: this.modelCapabilities
        };
    }

    /**
     * Get model information for UI display
     */
    getModelInfo(agentType) {
        const preferredModel = this.getModelForAgent(agentType);
        const capabilities = this.modelCapabilities[preferredModel];
        
        return {
            preferredModel,
            isAvailable: capabilities?.available || null,
            lastTested: capabilities?.lastTested || null,
            responseTime: capabilities?.responseTime || null,
            agentType
        };
    }

    /**
     * Get all model configurations for dashboard
     */
    getAllModelConfigs() {
        return Object.keys(this.modelConfig).map(agentType => ({
            agentType,
            ...this.getModelInfo(agentType)
        }));
    }

    /**
     * Create a system message for agent context
     */
    createSystemMessage(agentRole, companyInfo, additionalContext = '') {
        return {
            role: 'system',
            content: `You are ${agentRole} for Vegas Improv Power - a Las Vegas-based company focused on "Improv for Being a Human®" using Functional Improv® methodology.

COMPANY CONTEXT:
${companyInfo}

ADDITIONAL CONTEXT:
${additionalContext}

Please maintain this brand voice and context in all your responses while executing your specific role.`
        };
    }

    /**
     * Format messages for agent communication
     */
    formatAgentMessages(systemPrompt, userInput, previousContext = '') {
        const messages = [];
        
        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        
        if (previousContext) {
            messages.push({
                role: 'user',
                content: `Previous context:\n${previousContext}\n\nCurrent task:\n${userInput}`
            });
        } else {
            messages.push({
                role: 'user',
                content: userInput
            });
        }
        
        return messages;
    }

    /**
     * Validate response quality
     */
    validateResponse(response, expectedLength = 100) {
        if (!response || typeof response !== 'string') {
            return { valid: false, error: 'Invalid response type' };
        }
        
        if (response.length < expectedLength) {
            return { valid: false, error: 'Response too short' };
        }
        
        if (response.toLowerCase().includes('error') || response.toLowerCase().includes('sorry')) {
            return { valid: false, error: 'Response indicates an error' };
        }
        
        return { valid: true };
    }
}

// Export for use in other modules
window.ClaudeAPIClient = ClaudeAPIClient;