/**
 * Main Application
 * Coordinates the entire blog creation workflow interface
 */

class BlogWorkflowApp {
    constructor() {
        this.apiClient = null;
        this.storage = null;
        this.workflow = null;
        this.currentWorkflowId = null;
        
        // UI elements
        this.elements = {};
        
        // State
        this.isProcessing = false;
        this.currentStep = -1;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Blog Workflow App...');
            
            // Initialize services
            this.apiClient = new ClaudeAPIClient();
            this.storage = new StorageManager();
            this.workflow = new WorkflowManager(this.apiClient, this.storage);
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up workflow event handlers
            this.setupWorkflowHandlers();
            
            // Show initialization status
            this.elements.initializationStatus.classList.remove('hidden');
            this.elements.submitBtn.disabled = true;
            
            // Initialize API client with better error handling
            console.log('Initializing API client...');
            
            try {
                const apiInitialized = await this.apiClient.initialize();
                
                // Hide initialization status
                this.elements.initializationStatus.classList.add('hidden');
                
                if (!apiInitialized) {
                    // This shouldn't happen with the new implementation, but handle it
                    this.elements.apiKeyPrompt.classList.remove('hidden');
                    this.elements.submitBtn.disabled = true;
                    this.elements.apiKeyInput.focus();
                    return;
                }
            } catch (error) {
                // Hide initialization status
                this.elements.initializationStatus.classList.add('hidden');
                
                if (error.message.includes('API key required')) {
                    // Expected behavior - show API key prompt
                    console.log('API key required, showing prompt...');
                    this.elements.inputSection.classList.remove('hidden');
                    this.elements.errorSection.classList.add('hidden');
                    this.elements.apiKeyPrompt.classList.remove('hidden');
                    this.elements.submitBtn.disabled = true;
                    this.elements.apiKeyInput.focus();
                    return;
                } else {
                    // Unexpected error - show error message
                    this.elements.submitBtn.disabled = false;
                    this.showError(`Failed to initialize AI connection: ${error.message}\n\nPlease check your API key and try again.`);
                    return;
                }
            }
            
            this.elements.submitBtn.disabled = false;
            console.log('API client initialized successfully');
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.elements.initializationStatus.classList.add('hidden');
            
            // Don't show error for expected API key requirement
            if (!error.message.includes('API key required')) {
                this.showError('Application failed to start. Please refresh the page.');
            }
        }
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            // Form elements
            form: document.getElementById('blog-form'),
            titleInput: document.getElementById('blog-title'),
            keywordsInput: document.getElementById('keywords'),
            contextInput: document.getElementById('context'),
            allowWebInput: document.getElementById('allow-web'),
            submitBtn: document.getElementById('start-workflow'),
            validationMessage: document.getElementById('validation-message'),
            initializationStatus: document.getElementById('initialization-status'),
            apiKeyPrompt: document.getElementById('api-key-prompt'),
            apiKeyInput: document.getElementById('api-key'),
            rememberKeyInput: document.getElementById('remember-key'),
            
            // Section elements
            inputSection: document.querySelector('.input-section'),
            progressSection: document.getElementById('progress-section'),
            resultsSection: document.getElementById('results-section'),
            errorSection: document.getElementById('error-section'),
            
            // Progress elements
            progressFill: document.getElementById('progress-fill'),
            stepsContainer: document.getElementById('steps-container'),
            
            // Results elements
            finalTitle: document.getElementById('final-title'),
            wordCount: document.getElementById('word-count'),
            readingTime: document.getElementById('reading-time'),
            blogPreview: document.getElementById('blog-preview'),
            
            // Action buttons
            downloadComplete: document.getElementById('download-complete'),
            downloadMarkdown: document.getElementById('download-markdown'),
            downloadMetadata: document.getElementById('download-metadata'),
            copyToClipboard: document.getElementById('copy-to-clipboard'),
            startNew: document.getElementById('start-new'),
            retryWorkflow: document.getElementById('retry-workflow'),
            backToStart: document.getElementById('back-to-start'),
            
            // Error elements
            errorMessage: document.getElementById('error-message')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startWorkflow();
        });

        // Action buttons
        this.elements.downloadComplete.addEventListener('click', () => this.downloadCompletePackage());
        this.elements.downloadMarkdown.addEventListener('click', () => this.downloadMarkdown());
        this.elements.downloadMetadata.addEventListener('click', () => this.downloadMetadata());
        this.elements.copyToClipboard.addEventListener('click', () => this.copyToClipboard());
        this.elements.startNew.addEventListener('click', () => this.resetToStart());
        this.elements.retryWorkflow.addEventListener('click', () => this.retryWorkflow());
        this.elements.backToStart.addEventListener('click', () => this.resetToStart());

        // Input validation
        [this.elements.titleInput, this.elements.keywordsInput, this.elements.contextInput, this.elements.apiKeyInput].forEach(input => {
            input.addEventListener('input', () => this.validateInputs());
        });

        // API key input handling
        this.elements.apiKeyInput.addEventListener('input', () => {
            if (this.elements.apiKeyInput.value.trim()) {
                this.elements.apiKeyPrompt.classList.add('hidden');
                this.elements.submitBtn.disabled = false;
            }
        });
    }

    /**
     * Set up workflow event handlers
     */
    setupWorkflowHandlers() {
        this.workflow.on('workflowStarted', (data) => {
            console.log('Workflow started:', data.workflow.id);
            this.currentWorkflowId = data.workflow.id;
            this.showProgressSection();
        });

        this.workflow.on('stepStarted', (data) => {
            console.log(`Step ${data.stepIndex} started:`, data.step.name);
            this.updateStepStatus(data.stepIndex, 'running');
            this.currentStep = data.stepIndex;
        });

        this.workflow.on('stepCompleted', (data) => {
            console.log(`Step ${data.stepIndex} completed:`, data.step.name);
            this.updateStepStatus(data.stepIndex, 'completed');
            this.displayStepOutput(data.stepIndex, data.result);
        });

        this.workflow.on('stepError', (data) => {
            console.error(`Step ${data.stepIndex} failed:`, data.error);
            this.updateStepStatus(data.stepIndex, 'error');
            this.showStepError(data.stepIndex, data.error.message);
        });

        this.workflow.on('progressUpdate', (data) => {
            this.updateProgress(data.percentage);
        });

        this.workflow.on('workflowCompleted', (data) => {
            console.log('Workflow completed successfully');
            this.handleWorkflowComplete(data.workflow, data.organizedOutput);
        });

        this.workflow.on('workflowError', (data) => {
            console.error('Workflow failed:', data.error);
            this.showError(data.error.message);
        });

        this.workflow.on('workflowCancelled', (data) => {
            console.log('Workflow cancelled');
            this.showError('Workflow was cancelled');
        });
    }

    /**
     * Start the blog creation workflow
     */
    async startWorkflow() {
        try {
            if (this.isProcessing) return;

            // Validate inputs
            const validation = this.validateInputs();
            if (!validation.valid) {
                this.showValidationMessage(validation.message, 'error');
                return;
            }

            // Ensure API client is initialized
            if (!this.apiClient.initialized) {
                console.log('API client not initialized, attempting to initialize...');
                const initSuccess = await this.apiClient.initialize();
                if (!initSuccess) {
                    this.showError('API connection failed. Please refresh the page and try again.');
                    return;
                }
            }

            // Collect inputs
            const inputs = {
                title: this.elements.titleInput.value.trim(),
                keywords: this.elements.keywordsInput.value.trim(),
                context: this.elements.contextInput.value.trim(),
                allowWeb: this.elements.allowWebInput.checked
            };

            console.log('Starting workflow with inputs:', inputs);

            // Start processing
            this.isProcessing = true;
            this.elements.submitBtn.disabled = true;
            this.elements.submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Starting Workflow...';

            // Clear previous results
            this.clearPreviousResults();

            // Start the workflow
            await this.workflow.startWorkflow(inputs);

        } catch (error) {
            console.error('Failed to start workflow:', error);
            this.showError(`Failed to start workflow: ${error.message}\n\nPlease try refreshing the page or check the browser console for more details.`);
            this.resetUI();
        }
    }

    /**
     * Validate form inputs
     */
    /**
     * Handle API key validation and retry
     */
    async handleApiKeyRetry() {
        try {
            this.elements.apiKeyPrompt.classList.add('hidden');
            this.elements.initializationStatus.classList.remove('hidden');
            
            // Reinitialize API client with new key
            const apiInitialized = await this.apiClient.initialize();
            
            this.elements.initializationStatus.classList.add('hidden');
            
            if (apiInitialized) {
                this.elements.submitBtn.disabled = false;
                console.log('API key validated, client ready');
            } else {
                this.elements.apiKeyPrompt.classList.remove('hidden');
                this.showError('API key validation failed. Please check your key and try again.');
            }
        } catch (error) {
            console.error('API key validation failed:', error);
            this.elements.initializationStatus.classList.add('hidden');
            this.elements.apiKeyPrompt.classList.remove('hidden');
            this.showError('API key validation failed. Please check your key and try again.');
        }
    }

    /**
     * Input validation
     */
    validateInputs() {
        const title = this.elements.titleInput.value.trim();
        const keywords = this.elements.keywordsInput.value.trim();
        const context = this.elements.contextInput.value.trim();
        const apiKey = this.elements.apiKeyInput.value.trim();

        // Check if API key is provided
        if (!apiKey) {
            return {
                valid: false,
                message: 'Please enter your Anthropic API key.'
            };
        }

        // Validate API key format
        if (!apiKey.startsWith('sk-ant-')) {
            return {
                valid: false,
                message: 'API key should start with "sk-ant-". Please check your key.'
            };
        }

        // Check if at least one content field is provided
        if (!title && !keywords && !context) {
            return {
                valid: false,
                message: 'Please provide at least one of: title, keywords, or context.'
            };
        }

        // Additional validation
        if (title && title.length < 5) {
            return {
                valid: false,
                message: 'Blog title must be at least 5 characters long.'
            };
        }

        if (keywords && keywords.length < 3) {
            return {
                valid: false,
                message: 'Keywords must be at least 3 characters long.'
            };
        }

        if (context && context.length < 10) {
            return {
                valid: false,
                message: 'Context must be at least 10 characters long.'
            };
        }

        return { valid: true };
    }

    /**
     * Show validation message
     */
    showValidationMessage(message, type = 'error') {
        this.elements.validationMessage.textContent = message;
        this.elements.validationMessage.className = `validation-message ${type}`;
        this.elements.validationMessage.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.elements.validationMessage.classList.add('hidden');
        }, 5000);
    }

    /**
     * Show progress section
     */
    showProgressSection() {
        this.elements.inputSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.errorSection.classList.add('hidden');
        this.elements.progressSection.classList.remove('hidden');
        
        // Scroll to progress section
        this.elements.progressSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Update step status
     */
    updateStepStatus(stepIndex, status) {
        const stepElement = document.querySelector(`[data-step="${stepIndex}"]`);
        if (stepElement) {
            stepElement.className = `step ${status}`;
        }
    }

    /**
     * Display step output
     */
    displayStepOutput(stepIndex, result) {
        const stepElement = document.querySelector(`[data-step="${stepIndex}"]`);
        if (stepElement) {
            const outputElement = stepElement.querySelector('.step-output');
            if (outputElement && result) {
                // Format output based on step type
                let displayText = '';
                
                if (typeof result === 'object') {
                    if (result.projectBrief) {
                        displayText = result.projectBrief.substring(0, 200) + '...';
                    } else if (result.h2Options) {
                        displayText = `Generated ${result.h2Options.length} H2 options, ${result.introOptions?.length || 0} intro options, ${result.conclusionOptions?.length || 0} conclusion options`;
                    } else if (result.finalOutline) {
                        displayText = `Created outline with ${result.h2Count || 0} H2s and ${result.h3Count || 0} H3s`;
                    } else if (result.finalBlogPost) {
                        displayText = `Created blog post (${result.wordCount || 0} words, ${result.readingTime || 0} min read)`;
                    } else if (result.overallScore) {
                        displayText = `Review completed: ${result.overallScore}/10 score, ${result.criticalIssues?.length || 0} critical issues`;
                    } else {
                        displayText = JSON.stringify(result, null, 2).substring(0, 200) + '...';
                    }
                } else {
                    displayText = String(result).substring(0, 200) + '...';
                }
                
                outputElement.innerHTML = `<pre>${displayText}</pre>`;
                outputElement.classList.remove('hidden');
            }
        }
    }

    /**
     * Show step error
     */
    showStepError(stepIndex, errorMessage) {
        const stepElement = document.querySelector(`[data-step="${stepIndex}"]`);
        if (stepElement) {
            const outputElement = stepElement.querySelector('.step-output');
            if (outputElement) {
                outputElement.innerHTML = `<div style="color: var(--error-color);">❌ Error: ${errorMessage}</div>`;
                outputElement.classList.remove('hidden');
            }
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(percentage) {
        this.elements.progressFill.style.width = `${percentage}%`;
    }

    /**
     * Handle workflow completion
     */
    handleWorkflowComplete(workflow, organizedOutput) {
        if (organizedOutput) {
            this.displayResults(organizedOutput);
        } else {
            // Fallback to old method
            const results = this.workflow.getWorkflowResults();
            if (results) {
                this.displayResults(results);
            } else {
                this.showError('Workflow completed but no results were generated');
            }
        }
        this.resetUI();
    }

    /**
     * Display final results
     */
    displayResults(results) {
        // Handle both new organized output and legacy format
        let blogPost, wordCount, title;
        
        if (results.files && results.summary) {
            // New organized output format
            const mainFile = results.structure.mainFile;
            blogPost = results.files[mainFile];
            wordCount = results.summary.wordCount;
            title = results.summary.title;
        } else if (results.blogPost) {
            // Legacy format
            blogPost = results.blogPost;
            wordCount = results.metadata?.wordCount || this.getWordCount(blogPost);
            title = this.extractTitle(blogPost);
        } else {
            this.showError('No blog content found in results');
            return;
        }

        // Update title and metadata
        this.elements.finalTitle.textContent = title || 'Blog Post Complete';
        this.elements.wordCount.textContent = `${wordCount} words`;
        this.elements.readingTime.textContent = `${Math.ceil(wordCount / 200)} min read`;

        // Render blog content
        this.renderBlogContent(blogPost);

        // Store results for download
        this.currentResults = results;

        // Show results section
        this.showResultsSection();
    }

    /**
     * Extract title from blog post content
     */
    extractTitle(content) {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1] : null;
    }

    /**
     * Render blog content with markdown formatting
     */
    renderBlogContent(content) {
        // Simple markdown rendering for preview
        let html = content
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><h([123])>/g, '<h$1>')
            .replace(/<\/h([123])><\/p>/g, '</h$1>')
            .replace(/<p><ul>/g, '<ul>')
            .replace(/<\/ul><\/p>/g, '</ul>');

        this.elements.blogPreview.innerHTML = html;
    }

    /**
     * Show results section
     */
    showResultsSection() {
        this.elements.progressSection.classList.add('hidden');
        this.elements.errorSection.classList.add('hidden');
        this.elements.resultsSection.classList.remove('hidden');
        
        // Scroll to results
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Download functions
     */
    async downloadCompletePackage() {
        if (!this.currentResults) return;
        
        try {
            if (this.currentResults.files && this.currentResults.structure) {
                // New organized output format - create zip
                await this.downloadAsZip();
            } else {
                // Legacy format - download individual files
                this.downloadMarkdown();
                this.downloadMetadata();
            }
        } catch (error) {
            console.error('Failed to download complete package:', error);
            this.showError('Failed to create download package');
        }
    }

    async downloadAsZip() {
        const zip = new JSZip();
        const results = this.currentResults;
        
        // Add all files to the zip
        Object.keys(results.files).forEach(filename => {
            zip.file(filename, results.files[filename]);
        });
        
        // Add a README with summary
        const readmeContent = this.generateReadme(results.summary);
        zip.file('README.md', readmeContent);
        
        // Generate and download the zip
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipFilename = `${results.sessionId || 'blog-workflow'}.zip`;
        
        this.downloadFile(zipBlob, zipFilename, 'application/zip');
    }

    generateReadme(summary) {
        return `# Blog Workflow Output

## Summary
- **Title**: ${summary.title}
- **Word Count**: ${summary.wordCount} words
- **Processing Time**: ${summary.totalDuration}
- **Steps Completed**: ${summary.stepsCompleted}
- **Models Used**: ${summary.modelsUsed.join(', ')}
- **Quality Score**: ${summary.qualityScore}

## Files Included
- **Main Blog Post**: ${this.currentResults.structure.mainFile}
- **Metadata**: ${this.currentResults.structure.metadataFile}
- **Workflow Data**: ${this.currentResults.structure.workflowFile}
- **Step Details**: ${this.currentResults.structure.stepsFile}

## How to Use
1. The main blog post is ready for publication
2. Review the metadata file for SEO and performance insights
3. Use the workflow data for process optimization
4. Check step details for debugging or improvement insights

---
*Generated by Claude-Powered Blog Workflow • ${new Date().toISOString()}*
`;
    }

    downloadMarkdown() {
        if (!this.currentResults) return;
        
        let content, filename;
        
        if (this.currentResults.files && this.currentResults.structure) {
            // New organized output format
            const mainFile = this.currentResults.structure.mainFile;
            content = this.currentResults.files[mainFile];
            filename = mainFile;
        } else {
            // Legacy format
            content = this.currentResults.blogPost;
            filename = this.generateFilename() + '.md';
        }
        
        this.downloadFile(content, filename, 'text/markdown');
    }

    downloadMetadata() {
        if (!this.currentResults) return;
        
        let content, filename;
        
        if (this.currentResults.files && this.currentResults.structure) {
            // New organized output format
            const metadataFile = this.currentResults.structure.metadataFile;
            content = this.currentResults.files[metadataFile];
            filename = metadataFile;
        } else {
            // Legacy format
            content = JSON.stringify(this.currentResults.metadata, null, 2);
            filename = this.generateFilename() + '-metadata.json';
        }
        
        this.downloadFile(content, filename, content.includes('{') ? 'application/json' : 'text/markdown');
    }

    generateFilename() {
        const title = this.extractTitle(this.currentResults?.blogPost) || 'blog-post';
        return title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async copyToClipboard() {
        if (!this.currentResults) return;

        try {
            await navigator.clipboard.writeText(this.currentResults.blogPost);
            this.showValidationMessage('Blog post copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showValidationMessage('Failed to copy to clipboard', 'error');
        }
    }

    /**
     * Reset and error handling
     */
    resetToStart() {
        this.clearPreviousResults();
        this.resetUI();
        this.showInputSection();
    }

    retryWorkflow() {
        if (this.currentWorkflowId) {
            // TODO: Implement workflow retry logic
            this.resetToStart();
        }
    }

    showInputSection() {
        this.elements.progressSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.errorSection.classList.add('hidden');
        this.elements.inputSection.classList.remove('hidden');
    }

    showError(message) {
        // Handle multi-line error messages
        this.elements.errorMessage.innerHTML = message.replace(/\n/g, '<br>');
        this.elements.progressSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.inputSection.classList.add('hidden');
        this.elements.errorSection.classList.remove('hidden');
        this.resetUI();
        
        // Scroll to error section
        this.elements.errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    clearPreviousResults() {
        this.currentResults = null;
        this.currentStep = -1;
        
        // Reset progress bar
        this.elements.progressFill.style.width = '0%';
        
        // Reset all steps
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => {
            step.className = 'step';
            const output = step.querySelector('.step-output');
            if (output) {
                output.classList.add('hidden');
                output.innerHTML = '';
            }
        });
        
        // Clear validation messages
        this.elements.validationMessage.classList.add('hidden');
    }

    resetUI() {
        this.isProcessing = false;
        this.elements.submitBtn.disabled = false;
        this.elements.submitBtn.innerHTML = '<span class="btn-icon">🚀</span> Start Blog Creation Workflow';
    }

    /**
     * Helper: Get word count
     */
    getWordCount(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogApp = new BlogWorkflowApp();
});