/**
 * Blog Reviewer Agent
 * Step 7: Review content and provide comprehensive feedback
 */

class ReviewerAgent {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.name = 'Blog Reviewer';
        this.role = 'reviewer';
        this.agentType = 'reviewer'; // For model selection
        this.preferredModel = 'claude-3-opus-20240229'; // High-reasoning: Quality assessment
    }

    /**
     * Execute review step
     */
    async execute(context, inputs) {
        try {
            console.log('Blog Reviewer starting...');

            const contentOutput = context.previousOutputs['content-writer'];
            const projectBrief = context.previousOutputs['orchestrator']?.projectBrief || '';

            if (!contentOutput || !contentOutput.finalBlogPost) {
                throw new Error('No blog content found for review');
            }

            const prompt = this.buildReviewPrompt(context, inputs, contentOutput, projectBrief);
            
            const messages = [
                {
                    role: 'system',
                    content: this.getSystemPrompt()
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 3000,
                temperature: 0.5,
                agentType: this.agentType
            });

            return this.parseReviewResponse(response, contentOutput);

        } catch (error) {
            console.error('Reviewer failed:', error);
            throw new Error(`Content review failed: ${error.message}`);
        }
    }

    /**
     * Build comprehensive review prompt
     */
    buildReviewPrompt(context, inputs, contentOutput, projectBrief) {
        return `As the Blog Reviewer for Vegas Improv Power, I need to conduct a comprehensive quality review of this blog post.

PROJECT CONTEXT:
- Original Title: "${inputs.title}"
- Target Keywords: "${inputs.keywords}"
- Audience Context: "${inputs.context}"

PROJECT BRIEF:
${projectBrief}

BLOG POST TO REVIEW:
${contentOutput.finalBlogPost}

CONTENT METRICS:
- Word Count: ${contentOutput.wordCount || 'Unknown'}
- Reading Time: ${contentOutput.readingTime || 'Unknown'} minutes
- SEO Analysis: ${JSON.stringify(contentOutput.seoAnalysis || {}, null, 2)}

COMPREHENSIVE REVIEW REQUIRED:

**1. CONTENT QUALITY ASSESSMENT**
- **Headline**: Compelling, SEO-optimized, brand-aligned?
- **Introduction**: Strong hook, clear value proposition, sets expectations?
- **Main Content**: Logical flow, comprehensive coverage, engaging writing?
- **Conclusion**: Strong summary, clear CTA, leaves lasting impression?

**2. SEO OPTIMIZATION REVIEW**
- **Primary Keywords**: Natural integration, appropriate density?
- **Secondary Keywords**: Supporting terms included?
- **Meta Elements**: Title, headings optimized for search?
- **Internal Linking**: Opportunities for Vegas Improv Power content connections?
- **Featured Snippet**: Potential for answer box optimization?

**3. BRAND VOICE & MESSAGING**
- **Vegas Improv Power Voice**: Professional yet playful tone maintained?
- **"Improv for Being a Human®"**: Philosophy appropriately integrated?
- **Functional Improv®**: Methodology referenced where relevant?
- **Target Audience**: Content appropriate for adults seeking personal growth?
- **Value Proposition**: Clear benefits and practical applications?

**4. ENGAGEMENT & READABILITY**
- **Structure**: Clear headings, scannable paragraphs, logical flow?
- **Examples**: Concrete, relatable scenarios and case studies?
- **Actionability**: Clear takeaways readers can implement?
- **Visual Elements**: Opportunities for images, charts, or callouts?
- **Social Proof**: Credibility indicators and authority building?

**5. CONVERSION OPTIMIZATION**
- **Call-to-Actions**: Clear, compelling, strategically placed?
- **Lead Generation**: Opportunities for email capture or engagement?
- **Next Steps**: Clear path for continued engagement?

**REVIEW OUTPUT FORMAT:**
1. **OVERALL SCORE**: Rate 1-10 with brief justification
2. **STRENGTHS**: What works well (be specific)
3. **CRITICAL ISSUES**: Must-fix problems that impact quality
4. **IMPROVEMENT OPPORTUNITIES**: Suggestions for enhancement
5. **SEO RECOMMENDATIONS**: Specific optimization suggestions
6. **BRAND ALIGNMENT**: How well it represents Vegas Improv Power
7. **REVISION PRIORITIES**: Ranked list of most important changes

**REVIEW STANDARDS:**
- Target score: 8+ for publication readiness
- Focus on practical, actionable feedback
- Prioritize reader value and brand alignment
- Consider both SEO and human engagement
- Maintain Vegas Improv Power's quality standards

Please provide detailed, specific feedback that will guide effective revisions.`;
    }

    /**
     * Parse review response
     */
    parseReviewResponse(response, contentOutput) {
        const result = {
            overallScore: 0,
            strengths: [],
            criticalIssues: [],
            improvements: [],
            seoRecommendations: [],
            brandAlignment: '',
            revisionPriorities: [],
            feedback: response,
            publicationReady: false,
            reviewSummary: ''
        };

        try {
            // Extract overall score
            const scoreMatch = response.match(/(?:OVERALL SCORE|SCORE)[\s\S]*?(\d+(?:\.\d+)?)/i);
            if (scoreMatch) {
                result.overallScore = parseFloat(scoreMatch[1]);
                result.publicationReady = result.overallScore >= 8;
            }

            // Extract sections
            result.strengths = this.extractSection(response, 'STRENGTHS');
            result.criticalIssues = this.extractSection(response, 'CRITICAL ISSUES');
            result.improvements = this.extractSection(response, 'IMPROVEMENT OPPORTUNITIES');
            result.seoRecommendations = this.extractSection(response, 'SEO RECOMMENDATIONS');
            result.revisionPriorities = this.extractSection(response, 'REVISION PRIORITIES');

            // Extract brand alignment
            const brandMatch = response.match(/BRAND ALIGNMENT[\s\S]*?(?=\n\n\*\*|$)/i);
            if (brandMatch) {
                result.brandAlignment = brandMatch[0].replace(/BRAND ALIGNMENT[:\s]*/i, '').trim();
            }

            // Generate summary
            result.reviewSummary = this.generateReviewSummary(result);

        } catch (error) {
            console.error('Error parsing review response:', error);
        }

        return result;
    }

    /**
     * Extract bulleted or numbered sections from review
     */
    extractSection(text, sectionHeader) {
        const items = [];
        
        try {
            const sectionPattern = new RegExp(`\\*\\*${sectionHeader}\\*\\*([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`, 'i');
            const sectionMatch = text.match(sectionPattern);
            
            if (sectionMatch) {
                const content = sectionMatch[1];
                
                // Extract numbered or bulleted items
                const itemPatterns = [
                    /^\s*\d+\.\s*(.+?)(?=\n\s*\d+\.|$)/gm,
                    /^\s*[-*•]\s*(.+?)(?=\n\s*[-*•]|$)/gm
                ];

                for (const pattern of itemPatterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        const item = match[1].trim();
                        if (item.length > 10) { // Filter out very short items
                            items.push(item);
                        }
                    }
                    if (items.length > 0) break; // Use first successful pattern
                }
            }
        } catch (error) {
            console.error(`Error extracting ${sectionHeader}:`, error);
        }

        return items;
    }

    /**
     * Generate review summary
     */
    generateReviewSummary(reviewData) {
        let summary = `Review Score: ${reviewData.overallScore}/10\n`;
        
        if (reviewData.publicationReady) {
            summary += "✅ Content is publication-ready\n";
        } else {
            summary += "⚠️ Content needs revisions before publication\n";
        }

        if (reviewData.criticalIssues.length > 0) {
            summary += `🔴 ${reviewData.criticalIssues.length} critical issues to address\n`;
        }

        if (reviewData.improvements.length > 0) {
            summary += `🟡 ${reviewData.improvements.length} opportunities for improvement\n`;
        }

        if (reviewData.strengths.length > 0) {
            summary += `✨ ${reviewData.strengths.length} notable strengths identified\n`;
        }

        return summary.trim();
    }

    /**
     * Validate review quality
     */
    validateReview(reviewData) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check if score was extracted
        if (reviewData.overallScore === 0) {
            validation.warnings.push('Overall score not found in review');
        }

        // Check for critical sections
        if (reviewData.criticalIssues.length === 0 && reviewData.overallScore < 8) {
            validation.warnings.push('Low score but no critical issues identified');
        }

        // Check feedback completeness
        if (!reviewData.feedback || reviewData.feedback.length < 500) {
            validation.errors.push('Review feedback appears incomplete');
            validation.valid = false;
        }

        // Check for specific feedback
        if (reviewData.strengths.length === 0 && reviewData.improvements.length === 0) {
            validation.warnings.push('Review lacks specific actionable feedback');
        }

        return validation;
    }

    /**
     * Generate publication checklist
     */
    generatePublicationChecklist(reviewData) {
        const checklist = [];

        // Based on review score
        if (reviewData.overallScore >= 8) {
            checklist.push('✅ Content quality meets publication standards');
        } else {
            checklist.push('❌ Address quality issues before publication');
        }

        // Based on critical issues
        if (reviewData.criticalIssues.length === 0) {
            checklist.push('✅ No critical issues identified');
        } else {
            checklist.push(`❌ Resolve ${reviewData.criticalIssues.length} critical issues`);
        }

        // SEO checklist items
        checklist.push('📊 Verify keyword optimization');
        checklist.push('🔗 Add internal links to relevant Vegas Improv Power content');
        checklist.push('📱 Test mobile responsiveness');
        checklist.push('🎯 Confirm target audience alignment');
        checklist.push('🔄 Final proofread for grammar and style');

        return checklist;
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        return `You are the Blog Reviewer for Vegas Improv Power, specializing in comprehensive content quality assessment and optimization recommendations.

ROLE RESPONSIBILITIES:
1. Content Review: Comprehensive analysis of blog post quality and effectiveness
2. Editing & Polish: Improve clarity, flow, and engagement
3. SEO Optimization: Enhance search engine visibility and ranking potential
4. Grammar & Style: Ensure professional, error-free content
5. Brand Alignment: Verify consistency with Vegas Improv Power voice and values

COMPANY CONTEXT:
${COMPANY_INFO}

REVIEW STANDARDS:
- **Content Quality**: Engaging, informative, well-structured
- **SEO Optimization**: Keyword integration, search visibility
- **Brand Voice**: Professional yet playful, inclusive, growth-focused
- **Audience Value**: Practical takeaways for personal/professional development
- **Publication Readiness**: Score 8+ required for immediate publication

REVIEW FOCUS AREAS:
1. **Strategic Alignment**: Does content support Vegas Improv Power's mission?
2. **Reader Value**: Will the target audience find this genuinely helpful?
3. **SEO Performance**: Is it optimized for search without keyword stuffing?
4. **Engagement**: Does it hold attention and inspire action?
5. **Brand Consistency**: Does it sound like Vegas Improv Power?

Your reviews should provide specific, actionable feedback that improves both content quality and business impact while maintaining our commitment to authentic personal development through improv.`;
    }
}

// Export for use in workflow
window.ReviewerAgent = ReviewerAgent;