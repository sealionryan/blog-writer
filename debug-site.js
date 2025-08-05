const puppeteer = require('puppeteer');

async function debugBlogWorkflowSite() {
    const browser = await puppeteer.launch({
        headless: false, // Run in visible mode to see interactions
        devtools: true,  // Open DevTools for additional debugging
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();
    
    // Set up comprehensive logging
    const logs = [];
    const networkRequests = [];
    const errors = [];

    // Capture console messages
    page.on('console', msg => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: msg.type(),
            text: msg.text(),
            args: msg.args().length > 0 ? msg.args().map(arg => arg.toString()) : []
        };
        logs.push(logEntry);
        console.log(`[${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // Capture network requests
    page.on('request', request => {
        const timestamp = new Date().toISOString();
        const requestInfo = {
            timestamp,
            type: 'request',
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData()
        };
        networkRequests.push(requestInfo);
        console.log(`[${timestamp}] REQUEST: ${request.method()} ${request.url()}`);
    });

    // Capture network responses
    page.on('response', response => {
        const timestamp = new Date().toISOString();
        const responseInfo = {
            timestamp,
            type: 'response',
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers()
        };
        networkRequests.push(responseInfo);
        console.log(`[${timestamp}] RESPONSE: ${response.status()} ${response.url()}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
        const timestamp = new Date().toISOString();
        const errorInfo = {
            timestamp,
            type: 'page-error',
            message: error.message,
            stack: error.stack
        };
        errors.push(errorInfo);
        console.error(`[${timestamp}] PAGE ERROR: ${error.message}`);
    });

    // Capture request failures
    page.on('requestfailed', request => {
        const timestamp = new Date().toISOString();
        const failureInfo = {
            timestamp,
            type: 'request-failed',
            url: request.url(),
            failure: request.failure()
        };
        errors.push(failureInfo);
        console.error(`[${timestamp}] REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
    });

    try {
        console.log('=== Starting Blog Workflow Site Debug ===');
        console.log('Navigating to https://sealionryan.github.io/blog-writer/');
        
        // Navigate to the site
        await page.goto('https://sealionryan.github.io/blog-writer/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('Page loaded, waiting for initial scripts to execute...');
        await page.waitForTimeout(3000);

        // Check for specific elements and states
        console.log('=== Checking Page State ===');
        
        // Check if Puter is loaded
        const puterLoaded = await page.evaluate(() => {
            return typeof window.puter !== 'undefined';
        });
        console.log(`Puter loaded: ${puterLoaded}`);

        // Check for API client initialization
        const apiClientExists = await page.evaluate(() => {
            return typeof window.ApiClient !== 'undefined';
        });
        console.log(`ApiClient exists: ${apiClientExists}`);

        // Look for permission dialog or buttons
        const permissionElements = await page.$$eval('*', elements => {
            return elements
                .filter(el => el.textContent && el.textContent.toLowerCase().includes('permission'))
                .map(el => ({
                    tagName: el.tagName,
                    textContent: el.textContent.trim(),
                    className: el.className,
                    id: el.id
                }));
        });
        
        if (permissionElements.length > 0) {
            console.log('=== Permission Elements Found ===');
            permissionElements.forEach(el => console.log(JSON.stringify(el, null, 2)));
        }

        // Look for buttons that might trigger API initialization
        const buttons = await page.$$eval('button', buttons => {
            return buttons.map(btn => ({
                textContent: btn.textContent.trim(),
                className: btn.className,
                id: btn.id,
                disabled: btn.disabled
            }));
        });
        
        console.log('=== Buttons on Page ===');
        buttons.forEach(btn => console.log(JSON.stringify(btn, null, 2)));

        // Try to find and click any permission/auth buttons
        try {
            // Look for buttons containing "allow", "grant", "permission", etc.
            const authButtonSelectors = [
                'button:contains("Allow")',
                'button:contains("Grant")', 
                'button:contains("Permission")',
                'button:contains("Authorize")',
                'button:contains("Connect")',
                '[data-action="grant-permission"]',
                '.puter-permission-btn',
                '#grant-permission'
            ];

            for (const selector of authButtonSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        console.log(`Found potential auth button: ${selector}`);
                        await element.click();
                        console.log(`Clicked auth button: ${selector}`);
                        await page.waitForTimeout(2000);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
        } catch (e) {
            console.log('No auth buttons found or clickable');
        }

        // Wait for potential API initialization
        console.log('Waiting for API initialization...');
        await page.waitForTimeout(5000);

        // Check final state
        console.log('=== Final State Check ===');
        
        const finalState = await page.evaluate(() => {
            return {
                puterAvailable: typeof window.puter !== 'undefined',
                apiClientAvailable: typeof window.ApiClient !== 'undefined',
                workflowAvailable: typeof window.BlogWorkflow !== 'undefined',
                anyErrors: window.console ? window.console.errors : 'unknown'
            };
        });
        
        console.log('Final state:', JSON.stringify(finalState, null, 2));

        // Try to manually trigger API initialization if possible
        try {
            console.log('=== Attempting Manual API Initialization ===');
            const manualInitResult = await page.evaluate(async () => {
                if (window.ApiClient && window.ApiClient.initialize) {
                    try {
                        const result = await window.ApiClient.initialize();
                        return { success: true, result };
                    } catch (error) {
                        return { success: false, error: error.message, stack: error.stack };
                    }
                }
                return { success: false, error: 'ApiClient.initialize not available' };
            });
            
            console.log('Manual init result:', JSON.stringify(manualInitResult, null, 2));
        } catch (e) {
            console.log('Manual initialization failed:', e.message);
        }

        // Wait a bit more to catch any delayed operations
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error('Navigation or interaction error:', error);
        errors.push({
            timestamp: new Date().toISOString(),
            type: 'navigation-error',
            message: error.message,
            stack: error.stack
        });
    }

    // Generate comprehensive report
    console.log('\n=== COMPREHENSIVE DEBUG REPORT ===');
    
    console.log('\n--- CONSOLE LOGS ---');
    logs.forEach(log => {
        console.log(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.text}`);
    });

    console.log('\n--- NETWORK REQUESTS ---');
    networkRequests.forEach(req => {
        if (req.type === 'request') {
            console.log(`[${req.timestamp}] → ${req.method} ${req.url}`);
            if (req.postData) {
                console.log(`   POST DATA: ${req.postData.substring(0, 200)}...`);
            }
        } else {
            console.log(`[${req.timestamp}] ← ${req.status} ${req.url}`);
        }
    });

    console.log('\n--- ERRORS ---');
    errors.forEach(error => {
        console.log(`[${error.timestamp}] ${error.type.toUpperCase()}: ${error.message}`);
        if (error.stack) {
            console.log(`   STACK: ${error.stack}`);
        }
    });

    // Save detailed report to file
    const report = {
        timestamp: new Date().toISOString(),
        url: 'https://sealionryan.github.io/blog-writer/',
        logs,
        networkRequests,
        errors,
        summary: {
            totalLogs: logs.length,
            totalNetworkRequests: networkRequests.length,
            totalErrors: errors.length,
            keyFindings: []
        }
    };

    // Analyze key findings
    const initializingLogs = logs.filter(log => log.text.includes('Initializing'));
    const testingLogs = logs.filter(log => log.text.includes('Testing'));
    const errorLogs = logs.filter(log => log.type === 'error');
    const puterRequests = networkRequests.filter(req => req.url && req.url.includes('puter'));
    const claudeRequests = networkRequests.filter(req => req.url && req.url.includes('claude'));

    if (initializingLogs.length > 0) {
        report.summary.keyFindings.push(`Found ${initializingLogs.length} initialization messages`);
    }
    if (testingLogs.length > 0) {
        report.summary.keyFindings.push(`Found ${testingLogs.length} testing messages`);
    }
    if (errorLogs.length > 0) {
        report.summary.keyFindings.push(`Found ${errorLogs.length} console errors`);
    }
    if (puterRequests.length > 0) {
        report.summary.keyFindings.push(`Found ${puterRequests.length} Puter-related requests`);
    }
    if (claudeRequests.length > 0) {
        report.summary.keyFindings.push(`Found ${claudeRequests.length} Claude-related requests`);
    }

    // Keep browser open for manual inspection
    console.log('\n=== Browser kept open for manual inspection ===');
    console.log('Press Ctrl+C to close when done inspecting...');
    
    // Wait for manual interruption
    process.on('SIGINT', async () => {
        console.log('\nClosing browser...');
        await browser.close();
        
        // Write report to file
        const fs = require('fs');
        fs.writeFileSync('/Users/ryan/VS Code/blog-writer/debug-report.json', JSON.stringify(report, null, 2));
        console.log('Debug report saved to debug-report.json');
        
        process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});
}

// Run the debug function
debugBlogWorkflowSite().catch(console.error);