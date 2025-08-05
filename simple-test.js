const puppeteer = require('puppeteer');

async function testBlogWorkflow() {
    console.log('🚀 Starting simplified blog workflow test...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        consoleLogs.push({ type, text });
        console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Track network requests
    const networkRequests = [];
    page.on('request', request => {
        if (request.url().includes('api') || request.url().includes('puter') || request.url().includes('claude')) {
            networkRequests.push({
                method: request.method(),
                url: request.url(),
                type: 'request'
            });
            console.log(`[REQUEST] ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('api') || response.url().includes('puter') || response.url().includes('claude')) {
            networkRequests.push({
                status: response.status(),
                url: response.url(),
                type: 'response'
            });
            console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        console.log('📱 Navigating to https://sealionryan.github.io/blog-writer/...');
        await page.goto('https://sealionryan.github.io/blog-writer/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('✅ Page loaded, waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check page state
        console.log('\n🔍 Checking page state...');
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                puterExists: typeof window.puter !== 'undefined',
                puterAIExists: window.puter && typeof window.puter.ai !== 'undefined',
                hasBlogTitleInput: !!document.getElementById('blog-title'),
                hasContextInput: !!document.getElementById('context'),
                hasStartWorkflowButton: !!document.getElementById('start-workflow'),
                hasSignInButton: !!document.getElementById('sign-in-btn'),
                authPromptVisible: !!document.getElementById('auth-prompt') && !document.getElementById('auth-prompt').classList.contains('hidden'),
                initStatusVisible: !!document.getElementById('initialization-status') && !document.getElementById('initialization-status').classList.contains('hidden'),
                formVisible: !!document.getElementById('blog-form') && !document.getElementById('blog-form').classList.contains('hidden')
            };
        });
        
        console.log('Page Info:', JSON.stringify(pageInfo, null, 2));
        
        // Look for any authentication UI
        if (pageInfo.authPromptVisible && pageInfo.hasSignInButton) {
            console.log('\n🔐 Sign-in prompt visible, attempting authentication...');
            await page.click('#sign-in-btn');
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else if (pageInfo.hasSignInButton) {
            console.log('\n🔐 Sign-in button available but not visible');
        } else {
            console.log('\n✅ No authentication required or already authenticated');
        }
        
        // Test basic form interaction if available
        if (pageInfo.hasBlogTitleInput && pageInfo.hasContextInput) {
            console.log('\n📝 Testing form interaction...');
            try {
                await page.type('#blog-title', 'Test Blog Post');
                await page.type('#context', 'Test context for API verification');
                console.log('✅ Form inputs working');
                
                if (pageInfo.hasStartWorkflowButton) {
                    console.log('🚀 Clicking start workflow button...');
                    await page.click('#start-workflow');
                    await new Promise(resolve => setTimeout(resolve, 8000));
                    console.log('✅ Start workflow button clicked, waiting for response...');
                }
            } catch (error) {
                console.log('❌ Form interaction failed:', error.message);
            }
        } else {
            console.log('\n❌ Form elements not available for testing');
        }
        
        // Final status check
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📊 Test Summary:');
        console.log('================');
        
        // Count error logs
        const errors = consoleLogs.filter(log => log.type === 'error');
        const warnings = consoleLogs.filter(log => log.type === 'warning');
        
        console.log(`Console Errors: ${errors.length}`);
        console.log(`Console Warnings: ${warnings.length}`);
        console.log(`Network Requests: ${networkRequests.filter(r => r.type === 'request').length}`);
        console.log(`Failed Requests: ${networkRequests.filter(r => r.type === 'response' && r.status >= 400).length}`);
        
        // Check for specific issues
        const hasJSHandleError = consoleLogs.some(log => log.text.includes('JSHandle'));
        const hasPuterAuthError = consoleLogs.some(log => log.text.includes('401') || log.text.includes('authentication'));
        const hasAPICallError = consoleLogs.some(log => log.text.includes('API') && log.type === 'error');
        
        console.log('\nSpecific Issues:');
        console.log(`JSHandle Errors: ${hasJSHandleError ? '❌ Found' : '✅ None'}`);
        console.log(`Auth Errors: ${hasPuterAuthError ? '❌ Found' : '✅ None'}`);
        console.log(`API Call Errors: ${hasAPICallError ? '❌ Found' : '✅ None'}`);
        
        console.log('\nPage Functionality:');
        console.log(`Puter Loaded: ${pageInfo.puterExists ? '✅ Yes' : '❌ No'}`);
        console.log(`Puter AI Available: ${pageInfo.puterAIExists ? '✅ Yes' : '❌ No'}`);
        console.log(`Form Elements: ${pageInfo.hasBlogTitleInput && pageInfo.hasContextInput ? '✅ Present' : '❌ Missing'}`);
        console.log(`Auth Prompt: ${pageInfo.authPromptVisible ? '🔐 Visible' : '✅ Hidden/Not needed'}`);
        console.log(`Form Visible: ${pageInfo.formVisible ? '✅ Yes' : '❌ No'}`);
        
        console.log('\n⏰ Keeping browser open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    await browser.close();
    console.log('\n🏁 Test completed.');
}

testBlogWorkflow().catch(console.error);