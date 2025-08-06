#!/usr/bin/env node

/**
 * Test script for Direct Anthropic API integration
 * Tests the new API client implementation with environment variables
 */

// Load environment variables from .env file
require('dotenv').config();

const API_KEY = process.env.ANTHROPIC_API_KEY;
const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

// Model names to test
const MODELS = {
    'content-planner': 'claude-opus-4-1-20250805',
    'orchestrator': 'claude-opus-4-1-20250805',
    'outline-writer': 'claude-opus-4-1-20250805',
    'reviewer': 'claude-opus-4-1-20250805',
    'brainstormer': 'claude-sonnet-4-20250514',
    'content-writer': 'claude-sonnet-4-20250514'
};

async function testApiCall(model, testName) {
    console.log(`\n🧪 Testing ${testName} (${model})...`);
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': API_VERSION
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 50,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: `You are testing ${testName} for Vegas Improv Power. Please respond with "✅ ${testName} working correctly" to confirm the model is functioning.`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ ${testName} failed: ${response.status} ${response.statusText}`);
            console.error(`Error details: ${errorText}`);
            return false;
        }

        const data = await response.json();
        
        if (data.content && data.content.length > 0) {
            const responseText = data.content[0].text;
            console.log(`✅ ${testName} response: ${responseText}`);
            return true;
        } else {
            console.error(`❌ ${testName} failed: No content in response`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ ${testName} failed: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Anthropic API Integration Tests...');
    console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 12) + '...' : 'NOT FOUND'}`);
    
    if (!API_KEY) {
        console.error('❌ ANTHROPIC_API_KEY not found in environment variables.');
        console.error('Please ensure your .env file contains: ANTHROPIC_API_KEY=your-key-here');
        process.exit(1);
    }

    let passedTests = 0;
    let totalTests = Object.keys(MODELS).length;

    // Test each model/agent combination
    for (const [agentType, model] of Object.entries(MODELS)) {
        const success = await testApiCall(model, agentType);
        if (success) passedTests++;
        
        // Small delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Anthropic API integration is working correctly.');
        console.log('\n✨ Ready to deploy the web interface with direct API calls!');
    } else {
        console.log('⚠️  Some tests failed. Check the error messages above.');
        process.exit(1);
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});