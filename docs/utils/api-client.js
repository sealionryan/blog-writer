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
        this.defaultModel = 'claude-sonnet-4-20250514'; // Default to Sonnet for balanced performance
        
        // Intelligent model selection for Puter.js using correct model names
        this.modelConfig = {
            'content-planner': 'claude-opus-4-1-20250805',    // High-reasoning: Complex input analysis
            'orchestrator': 'claude-opus-4-1-20250805',       // High-reasoning: Strategic planning
            'outline-writer': 'claude-opus-4-1-20250805',     // High-reasoning: Content structuring
            'reviewer': 'claude-opus-4-1-20250805',           // High-reasoning: Quality assessment
            'brainstormer': 'claude-sonnet-4-20250514',     // Standard: Creative generation
            'content-writer': 'claude-sonnet-4-20250514'    // Standard: Content production
        };
        
        // Fallback model hierarchy for Puter.js
        this.fallbackModels = [
            'claude-sonnet-4-20250514',
            'claude-opus-4-1-20250805'
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

            // Check if user is already authenticated
            console.log('Checking authentication status...');
            try {
                // Try a test call without authentication first
                const testResponse = await this.testConnection();
                if (testResponse) {
                    this.initialized = true;
                    console.log('Claude API client initialized successfully (already authenticated)');
                    return true;
                }
            } catch (error) {
                console.log('Initial test failed:', error.message);
                console.log('Authentication may be required');
            }

            // If test failed, user needs to authenticate
            console.log('Authentication required. Please sign in when prompted.');
            await this.authenticateUser();

            // Test connection after authentication
            console.log('Testing Claude API connection after authentication...');
            const testResponse = await this.testConnection();

            if (testResponse) {
                this.initialized = true;
                console.log('Claude API client initialized successfully');
                return true;
            } else {
                throw new Error('Connection test failed - unable to reach Claude API');
            }
        } catch (error) {
            console.error('Failed to initialize Claude API client:', error.message || error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Authenticate user with Puter.js
     */
    async authenticateUser() {
        try {
            console.log('Prompting user for authentication...');
            const authResult = await puter.auth.signIn();
            console.log('Authentication successful:', authResult);
            return true;
        } catch (error) {
            console.error('Authentication failed:', error.message || error);
            throw new Error('User authentication required to access AI services');
        }
    }

    /**
     * Test the connection to Claude API
     */
    async testConnection() {
        try {
            // Updated API call format for Puter.js - single prompt string instead of messages array
            const testPrompt = 'Please respond with just "OK" to confirm connection.';
            
            // Use Puter.js API call with model specification
            const response = await puter.ai.chat(testPrompt, {
                model: this.defaultModel
            });
            
            console.log('Raw connection test response:', response);
            console.log('Response type:', typeof response);
            console.log('Response constructor:', response?.constructor?.name);
            
            // Deep inspection of the response structure
            if (response && typeof response === 'object') {
                console.log('Response keys:', Object.keys(response));
                if (response.message) {
                    console.log('Response.message:', response.message);
                    console.log('Response.message type:', typeof response.message);
                    if (typeof response.message === 'object') {
                        console.log('Response.message keys:', Object.keys(response.message));
                        if (response.message.content) {
                            console.log('Response.message.content:', response.message.content);
                        }
                    }
                }
            }
            
            // Extract string content from response using unified helper
            const responseText = this.extractTextFromResponse(response);
            
            console.log('Extracted response text:', responseText);
            console.log('Response text type:', typeof responseText);
            
            // Debug: Show the actual array contents
            if (Array.isArray(responseText)) {
                console.log('Array contents:', responseText);
                console.log('First element:', responseText[0]);
                if (responseText[0] && responseText[0].message) {
                    console.log('First element message:', responseText[0].message);
                }
                // Should not reach here anymore with proper extraction
                console.error('responseText is still an array after extraction fix');
                return false;
            }
            
            if (typeof responseText === 'string') {
                return responseText.length > 0 && (responseText.includes('OK') || responseText.includes('ok') || responseText.length > 2);
            } else {
                console.error('responseText is not a string:', typeof responseText);
                return false;
            }
        } catch (error) {
            console.error('Connection test failed:', error.message || error);
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
            const testPrompt = 'Please respond with just "OK" to test model availability.';
            
            const response = await this.makeRequestWithModel(testPrompt, modelName);
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
                error: error.message || error
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
     * Convert messages array to single prompt string for Puter.js
     */
    convertMessagesToPrompt(messages) {
        let prompt = '';
        for (const message of messages) {
            if (message.role === 'system') {
                prompt += `System: ${message.content}\n\n`;
            } else if (message.role === 'user') {
                prompt += `User: ${message.content}\n\n`;
            } else if (message.role === 'assistant') {
                prompt += `Assistant: ${message.content}\n\n`;
            }
        }
        return prompt.trim();
    }

    /**
     * Make a request with a specific model
     */
    async makeRequestWithModel(messages, model, options = {}) {
        const requestOptions = {
            model: 'claude', // Puter.js uses simplified model names
            stream: false,
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
                
                // Convert messages array to single prompt string
                const prompt = Array.isArray(messages) ? this.convertMessagesToPrompt(messages) : messages;
                
                // Use Puter.js API call with model specification
                const response = await puter.ai.chat(prompt, {
                    model: model
                });
                
                // Extract string content from response using helper
                const responseText = this.extractTextFromResponse(response);
                
                if (!responseText) {
                    throw new Error('Invalid or empty response format');
                }

                return responseText;
            } catch (error) {
                lastError = error;
                console.warn(`API request attempt ${attempt} failed:`, error.message || error);
                
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

        throw new Error(`API request failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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
     * Extract text string from API response object
     */
    extractTextFromResponse(response) {
        if (Array.isArray(response) && response.length > 0) {
            const first = response[0];
            // Handle [{type:'text', text:'...'}] - Puter's Claude response format
            if (first && first.type === 'text' && typeof first.text === 'string') {
                return first.text;
            }
            // Handle [{role:'assistant', content:'...'}]
            if (first && typeof first.content === 'string') {
                return first.content;
            }
            // Handle [{message:{content:'...'}}]
            if (first && first.message && typeof first.message.content === 'string') {
                return first.message.content;
            }
            // Fallback: concatenate any stringifiable bits we can find
            return response.map(r => {
                if (r.type === 'text' && typeof r.text === 'string') return r.text;
                if (typeof r.content === 'string') return r.content;
                if (r.message && typeof r.message.content === 'string') return r.message.content;
                return '';
            }).join('\n');
        } else if (typeof response === 'string') {
            return response;
        } else if (response && typeof response.content === 'string') {
            return response.content;
        } else if (response && response.message && Array.isArray(response.message.content)) {
            // Handle response.message.content = [{type:'text', text:'...'}]
            const content = response.message.content;
            if (content.length > 0 && content[0].type === 'text' && typeof content[0].text === 'string') {
                return content[0].text;
            }
        } else if (response && response.message && typeof response.message.content === 'string') {
            return response.message.content;
        } else if (response && typeof response.message === 'string') {
            return response.message;
        } else if (response && typeof response.text === 'string') {
            return response.text;
        } else if (response && typeof response.toString === 'function') {
            return response.toString();
        } else {
            console.warn('Could not extract text from response:', response);
            return String(response || '');
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