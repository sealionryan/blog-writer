/**
 * Claude API Client using Direct Anthropic API
 * Handles all communication with Claude AI via direct API calls
 */

class ClaudeAPIClient {
    constructor() {
        this.initialized = false;
        this.apiKey = null;
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
        this.maxRetries = 3;
        this.defaultModel = 'claude-sonnet-4-20250514'; // Default to Sonnet for balanced performance
        
        // Intelligent model selection using correct model names
        this.modelConfig = {
            'content-planner': 'claude-opus-4-1-20250805',    // High-reasoning: Complex input analysis
            'orchestrator': 'claude-opus-4-1-20250805',       // High-reasoning: Strategic planning
            'outline-writer': 'claude-opus-4-1-20250805',     // High-reasoning: Content structuring
            'reviewer': 'claude-opus-4-1-20250805',           // High-reasoning: Quality assessment
            'brainstormer': 'claude-sonnet-4-20250514',       // Standard: Creative generation
            'content-writer': 'claude-sonnet-4-20250514'      // Standard: Content production
        };
        
        // Fallback model hierarchy
        this.fallbackModels = [
            'claude-sonnet-4-20250514',
            'claude-opus-4-1-20250805'
        ];
        
        // Model capabilities tracking
        this.modelCapabilities = {};
        
        // API endpoint options for CORS compatibility
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?'
        ];
        this.directEndpoint = 'https://api.anthropic.com/v1/messages';
        this.currentProxyIndex = 0;
        this.apiVersion = '2023-06-01';
    }

    /**
     * Initialize the API client
     */
    async initialize() {
        try {
            console.log('Initializing Claude API client...');
            
            // Get API key from form or localStorage
            this.apiKey = this.getApiKey();
            
            if (!this.apiKey) {
                throw new Error('API key required. Please enter your Anthropic API key.');
            }

            // Test the connection
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
            console.error('Failed to initialize Claude API client:', error.message || error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Get API key from form input or localStorage
     */
    getApiKey() {
        // First check the form input
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput && apiKeyInput.value.trim()) {
            const key = apiKeyInput.value.trim();
            
            // Save to localStorage if remember checkbox is checked
            const rememberCheckbox = document.getElementById('remember-key');
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('anthropic_api_key', key);
            }
            
            return key;
        }
        
        // Fallback to localStorage
        const savedKey = localStorage.getItem('anthropic_api_key');
        if (savedKey) {
            // Populate the form field if empty
            if (apiKeyInput && !apiKeyInput.value) {
                apiKeyInput.value = savedKey;
                // Check the remember checkbox since we loaded from storage
                const rememberCheckbox = document.getElementById('remember-key');
                if (rememberCheckbox) {
                    rememberCheckbox.checked = true;
                }
            }
            return savedKey;
        }
        
        return null;
    }

    /**
     * Test the connection to Claude API
     */
    async testConnection() {
        try {
            const testMessages = [
                {
                    role: 'user',
                    content: 'Please respond with just "OK" to confirm connection.'
                }
            ];
            
            const response = await this.makeDirectApiCall(testMessages, {
                model: this.defaultModel,
                max_tokens: 10
            });
            
            console.log('Connection test response:', response);
            
            // Check if we got a valid response
            if (response && response.content && response.content.length > 0) {
                const text = response.content[0].text || '';
                return text.toLowerCase().includes('ok') || text.length > 0;
            }
            
            return false;
        } catch (error) {
            console.error('Connection test failed:', error.message || error);
            return false;
        }
    }

    /**
     * Get current API endpoint (direct or via proxy)
     */
    getCurrentEndpoint() {
        if (this.currentProxyIndex >= 0 && this.currentProxyIndex < this.corsProxies.length) {
            return this.corsProxies[this.currentProxyIndex] + encodeURIComponent(this.directEndpoint);
        }
        return this.directEndpoint;
    }

    /**
     * Make a direct API call to Anthropic (with CORS proxy fallback)
     */
    async makeDirectApiCall(messages, options = {}) {
        // Separate system message from user/assistant messages
        let systemMessage = '';
        const userMessages = [];
        
        for (const message of messages) {
            if (message.role === 'system') {
                systemMessage = message.content;
            } else {
                userMessages.push(message);
            }
        }
        
        const requestBody = {
            model: options.model || this.defaultModel,
            max_tokens: options.max_tokens || 4000,
            temperature: options.temperature || 0.7,
            messages: userMessages
        };
        
        // Add system message as top-level parameter if present
        if (systemMessage) {
            requestBody.system = systemMessage;
        }

        let lastError;
        
        // Try direct call first, then proxies
        for (let attempt = -1; attempt < this.corsProxies.length; attempt++) {
            try {
                this.currentProxyIndex = attempt;
                const endpoint = this.getCurrentEndpoint();
                
                console.log(`Attempting API call via: ${attempt === -1 ? 'direct' : 'proxy ' + attempt}`);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': this.apiVersion,
                        ...(attempt === -1 ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {})
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error && errorData.error.message) {
                            errorMessage = errorData.error.message;
                        }
                    } catch (e) {
                        if (errorText) {
                            errorMessage += ` - ${errorText}`;
                        }
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                console.log(`API call successful via: ${attempt === -1 ? 'direct' : 'proxy ' + attempt}`);
                return data;
                
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt === -1 ? 'direct' : 'proxy ' + attempt} failed:`, error.message);
                
                // If it's a CORS error, try next proxy
                if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                    continue;
                }
                // If it's an API error (auth, rate limit, etc.), don't try other proxies
                throw error;
            }
        }
        
        throw new Error(`All connection attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
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
                {
                    role: 'user',
                    content: 'Please respond with just "OK" to test model availability.'
                }
            ];
            
            const response = await this.makeDirectApiCall(testMessages, {
                model: modelName,
                max_tokens: 10
            });
            
            const available = response && response.content && response.content.length > 0;
            
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
        
        // For now, just return the preferred model
        // TODO: Implement proper model testing and fallbacks
        return preferredModel;
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

        // Determine the model to use
        let selectedModel;
        if (options.model) {
            selectedModel = options.model;
        } else if (options.agentType) {
            selectedModel = this.getModelForAgent(options.agentType);
        } else {
            selectedModel = this.defaultModel;
        }

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
                
                const response = await this.makeDirectApiCall(messages, {
                    model: selectedModel,
                    max_tokens: options.max_tokens || 4000,
                    temperature: options.temperature || 0.7
                });
                
                // Extract the text content from the response
                if (response.content && response.content.length > 0) {
                    return response.content[0].text || '';
                }
                
                throw new Error('No content in API response');
                
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
     * Clear stored API key
     */
    clearApiKey() {
        localStorage.removeItem('anthropic_api_key');
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) {
            apiKeyInput.value = '';
        }
        const rememberCheckbox = document.getElementById('remember-key');
        if (rememberCheckbox) {
            rememberCheckbox.checked = false;
        }
        this.apiKey = null;
        this.initialized = false;
    }

    /**
     * Get API status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            hasApiKey: !!this.apiKey,
            rateLimitDelay: this.rateLimitDelay,
            lastRequestTime: this.lastRequestTime,
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
}

// Export for use in other modules
window.ClaudeAPIClient = ClaudeAPIClient;