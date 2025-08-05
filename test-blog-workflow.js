const puppeteer = require('puppeteer');

async function testBlogWorkflow() {
    const browser = await puppeteer.launch({ 
        headless: false, // Keep visible to see what's happening
        devtools: true,  // Open devtools to monitor console/network
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    console.log('🚀 Starting blog workflow test...\n');
    
    // Monitor console logs
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Monitor network requests
    page.on('request', request => {
        if (request.url().includes('api') || request.url().includes('puter')) {
            console.log(`[NETWORK REQUEST] ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('api') || response.url().includes('puter')) {
            console.log(`[NETWORK RESPONSE] ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        console.log('📱 Navigating to blog workflow site...');
        await page.goto('https://sealionryan.github.io/blog-writer/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('✅ Page loaded successfully\n');
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 Checking for authentication elements...');
        
        // Check if sign-in button exists
        const signInButton = await page.$('#puter-signin');
        if (signInButton) {
            console.log('🔐 Sign-in button found, clicking...');
            await signInButton.click();
            
            // Wait for authentication to complete
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('✅ Authentication flow initiated\n');
        } else {
            console.log('ℹ️  No sign-in button found - checking if already authenticated\n');
        }
        
        // Check for any JSHandle errors by looking at console logs
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📝 Testing blog creation form...');
        
        // Look for the main form elements
        const titleInput = await page.$('#search-term');
        const contextInput = await page.$('#context');
        const createButton = await page.$('#create-blog');
        
        if (titleInput && contextInput && createButton) {
            console.log('✅ Form elements found');
            
            // Fill in test data
            console.log('📝 Filling in test data...');
            await titleInput.type('Test Blog Post');
            await contextInput.type('This is a test blog post to verify the API integration works correctly.');
            
            console.log('🚀 Submitting blog creation request...');
            await createButton.click();
            
            // Wait and monitor for API calls
            console.log('⏳ Waiting for API response...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Check for any error messages
            const errorMsg = await page.$('.error-message');
            if (errorMsg) {
                const errorText = await page.evaluate(el => el.textContent, errorMsg);
                console.log(`❌ Error message found: ${errorText}`);
            }
            
            // Check for success indicators
            const successMsg = await page.$('.success-message');
            if (successMsg) {
                const successText = await page.evaluate(el => el.textContent, successMsg);
                console.log(`✅ Success message found: ${successText}`);
            }
            
        } else {
            console.log('❌ Form elements not found');
            console.log(`Title input: ${!!titleInput}`);
            console.log(`Context input: ${!!contextInput}`);
            console.log(`Create button: ${!!createButton}`);
        }
        
        // Get final status
        console.log('\n📊 Final Test Results:');
        
        // Check if puter is properly initialized
        const puterStatus = await page.evaluate(() => {
            return {
                puterExists: typeof window.puter !== 'undefined',
                puterReady: window.puter && typeof window.puter.ai !== 'undefined',
                authStatus: window.puter && window.puter.auth ? 'available' : 'not available'
            };
        });
        
        console.log('Puter Status:', puterStatus);
        
        // Check current page state
        const pageState = await page.evaluate(() => {
            return {
                title: document.title,
                readyState: document.readyState,
                hasErrors: document.querySelector('.error-message') !== null,
                hasSuccess: document.querySelector('.success-message') !== null
            };
        });
        
        console.log('Page State:', pageState);
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
    
    console.log('\n⏰ Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close when finished reviewing');
    
    // Keep browser open for manual inspection
    await new Promise(() => {}); // Infinite wait
}

// Run the test
testBlogWorkflow().catch(console.error);