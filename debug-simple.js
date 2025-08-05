const puppeteer = require('puppeteer');

async function debugBlogWorkflowSite() {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    const logs = [];
    const networkRequests = [];
    const errors = [];

    // Capture all console messages
    page.on('console', msg => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: msg.type(),
            text: msg.text()
        };
        logs.push(logEntry);
        console.log(`[${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // Capture network activity
    page.on('request', request => {
        const timestamp = new Date().toISOString();
        networkRequests.push({
            timestamp,
            type: 'request',
            url: request.url(),
            method: request.method()
        });
        
        // Log important requests
        if (request.url().includes('puter') || request.url().includes('claude') || request.url().includes('api')) {
            console.log(`[${timestamp}] REQUEST: ${request.method()} ${request.url()}`);
        }
    });

    page.on('response', response => {
        const timestamp = new Date().toISOString();
        networkRequests.push({
            timestamp,
            type: 'response',
            url: response.url(),
            status: response.status()
        });
        
        // Log important responses
        if (response.url().includes('puter') || response.url().includes('claude') || response.url().includes('api')) {
            console.log(`[${timestamp}] RESPONSE: ${response.status()} ${response.url()}`);
        }
    });

    // Capture errors
    page.on('pageerror', error => {
        const timestamp = new Date().toISOString();
        errors.push({
            timestamp,
            type: 'page-error',
            message: error.message,
            stack: error.stack
        });
        console.error(`[${timestamp}] PAGE ERROR: ${error.message}`);
    });

    page.on('requestfailed', request => {
        const timestamp = new Date().toISOString();
        errors.push({
            timestamp,
            type: 'request-failed',
            url: request.url(),
            failure: request.failure()?.errorText
        });
        console.error(`[${timestamp}] REQUEST FAILED: ${request.url()}`);
    });

    try {
        console.log('=== Starting Blog Workflow Site Debug ===');
        
        // Navigate to the site
        await page.goto('https://sealionryan.github.io/blog-writer/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('Page loaded successfully');

        // Wait for initial script execution
        await page.waitForFunction(() => {
            return typeof window.puter !== 'undefined';
        }, { timeout: 10000 }).catch(() => {
            console.log('Puter did not load within 10 seconds');
        });

        // Check for key initialization messages
        console.log('=== Checking for initialization sequence ===');
        
        // Wait for API client initialization attempt
        await page.waitForFunction(() => {
            return window.console && window.console.logs && 
                   window.console.logs.some(log => log.includes('Initializing API client'));
        }, { timeout: 5000 }).catch(() => {
            console.log('API client initialization message not found');
        });

        // Check current state
        const currentState = await page.evaluate(() => {
            return {
                puterLoaded: typeof window.puter !== 'undefined',
                apiClientExists: typeof window.ApiClient !== 'undefined',
                workflowExists: typeof window.BlogWorkflow !== 'undefined',
                puterAuthenticated: window.puter ? window.puter.auth?.username : null,
                errors: window.lastError || null
            };
        });

        console.log('=== Current Application State ===');
        console.log(JSON.stringify(currentState, null, 2));

        // Try to trigger API test manually if possible
        try {
            console.log('=== Attempting Manual API Test ===');
            const apiTestResult = await page.evaluate(async () => {
                if (window.ApiClient && window.ApiClient.testConnection) {
                    try {
                        const result = await window.ApiClient.testConnection();
                        return { success: true, result };
                    } catch (error) {
                        return { 
                            success: false, 
                            error: error.message, 
                            stack: error.stack,
                            type: error.constructor.name
                        };
                    }
                }
                return { success: false, error: 'ApiClient.testConnection not available' };
            });
            
            console.log('Manual API test result:', JSON.stringify(apiTestResult, null, 2));
        } catch (e) {
            console.log('Could not perform manual API test:', e.message);
        }

        // Wait a bit more for any async operations
        console.log('Waiting for additional async operations...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Final state check
        const finalState = await page.evaluate(() => {
            return {
                readyState: document.readyState,
                puterAuth: window.puter ? {
                    authenticated: !!window.puter.auth?.username,
                    username: window.puter.auth?.username,
                    isSignedIn: window.puter.auth?.isSignedIn
                } : null,
                apiReady: window.ApiClient ? window.ApiClient.isReady : null,
                lastError: window.lastError || window.ApiClient?.lastError
            };
        });

        console.log('=== Final State ===');
        console.log(JSON.stringify(finalState, null, 2));

    } catch (error) {
        console.error('Error during debugging:', error);
        errors.push({
            timestamp: new Date().toISOString(),
            type: 'debug-error',
            message: error.message,
            stack: error.stack
        });
    }

    // Generate summary report
    console.log('\n=== DEBUG SUMMARY ===');
    
    const initLogs = logs.filter(log => 
        log.text.toLowerCase().includes('initializing') ||
        log.text.toLowerCase().includes('testing')
    );
    
    const errorLogs = logs.filter(log => log.type === 'error');
    const puterRequests = networkRequests.filter(req => req.url.includes('puter'));
    const authFailures = networkRequests.filter(req => 
        req.type === 'response' && req.status === 401
    );

    console.log(`\nInitialization logs found: ${initLogs.length}`);
    initLogs.forEach(log => console.log(`  - ${log.text}`));

    console.log(`\nError logs found: ${errorLogs.length}`);
    errorLogs.forEach(log => console.log(`  - ${log.text}`));

    console.log(`\nPuter requests: ${puterRequests.length}`);
    console.log(`Authentication failures (401s): ${authFailures.length}`);
    authFailures.forEach(req => console.log(`  - ${req.url}`));

    console.log(`\nTotal errors captured: ${errors.length}`);
    errors.forEach(error => console.log(`  - ${error.type}: ${error.message}`));

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        url: 'https://sealionryan.github.io/blog-writer/',
        summary: {
            initializationLogs: initLogs.length,
            errorLogs: errorLogs.length,
            puterRequests: puterRequests.length,
            authFailures: authFailures.length,
            totalErrors: errors.length
        },
        logs,
        networkRequests,
        errors
    };

    const fs = require('fs');
    fs.writeFileSync('/Users/ryan/VS Code/blog-writer/debug-report.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report saved to debug-report.json');

    console.log('\n=== Browser kept open for manual inspection ===');
    console.log('You can now manually interact with the page in the browser.');
    console.log('Press Ctrl+C when done to close and exit.');

    // Keep process alive until interrupted
    process.on('SIGINT', async () => {
        console.log('\nClosing browser and exiting...');
        await browser.close();
        process.exit(0);
    });

    // Keep alive
    await new Promise(() => {});
}

debugBlogWorkflowSite().catch(console.error);