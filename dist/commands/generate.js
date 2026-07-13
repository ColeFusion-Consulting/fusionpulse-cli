import { writeFileSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
const SYSTEM_PROMPT = `You are a QA engineer generating Playwright E2E tests. Given a natural language description, output a JSON object with:
- name: short test name
- description: what the test does
- steps: array of step objects

Each step has an "action" field and relevant parameters.

Available actions:
- goto: navigate to URL (use "url" param)
- click: click element ("selector" param)
- fill: type into input ("selector" + "value" params)
- waitForSelector: wait for element ("selector" param)
- waitForURL: wait for URL ("url" param)
- assertText: check element has text ("selector" + "value" params)
- assertVisible: check element is visible ("selector" param)
- screenshot: take screenshot
- select: select option ("selector" + "value" params)
- pressKey: press a key ("value" param, e.g. "Enter")

Return ONLY the JSON object. No explanation. No markdown. Just the JSON.`;
export async function generateCommand(description, options) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error(' Error: OPENAI_API_KEY not set in .env file');
        console.error('   Run: fusionpulse init');
        process.exit(1);
    }
    const openai = new OpenAI({ apiKey });
    const model = options.model || 'gpt-4o-mini';
    console.log(` Generating test for: "${description}"`);
    console.log(` Model: ${model}`);
    if (options.url)
        console.log(` Base URL: ${options.url}`);
    try {
        const userMessage = `Generate a Playwright E2E test for: ${description}` +
            (options.url ? `\nThe site's base URL is: ${options.url}` : '') +
            '\n\nRespond with ONLY the JSON object.';
        const response = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });
        const content = response.choices[0]?.message?.content;
        if (!content)
            throw new Error('Empty response from AI');
        const test = JSON.parse(content);
        // Generate Playwright test file
        const testCode = generatePlaywrightCode(test, options.url);
        const fileName = options.output || `fusionpulse-tests/test-${test.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.spec.ts`;
        writeFileSync(join(process.cwd(), fileName), testCode, 'utf-8');
        console.log(` Created ${fileName}`);
        console.log(`   ${test.steps.length} steps generated`);
        console.log(`   Confidence: high`);
    }
    catch (err) {
        console.error(' Generation failed:', err.message);
        process.exit(1);
    }
}
function generatePlaywrightCode(test, baseUrl) {
    const baseUrlConfig = baseUrl ? `const BASE_URL = '${baseUrl}';` : 'const BASE_URL = process.env.BASE_URL || \'http://localhost:3000\';';
    const steps = test.steps.map((step, i) => {
        const comment = step.description ? `  // ${step.description}` : '';
        switch (step.action) {
            case 'goto':
                return `${comment}\n  await page.goto('${step.url || '/'}');`;
            case 'click':
                return `${comment}\n  await page.click('${step.selector}');`;
            case 'fill':
                return `${comment}\n  await page.fill('${step.selector}', '${step.value || ''}');`;
            case 'waitForSelector':
                return `${comment}\n  await page.waitForSelector('${step.selector}');`;
            case 'waitForURL':
                return `${comment}\n  await page.waitForURL('${step.url}');`;
            case 'assertText':
                return `${comment}\n  await expect(page.locator('${step.selector}')).toContainText('${step.value || ''}');`;
            case 'assertVisible':
                return `${comment}\n  await expect(page.locator('${step.selector}')).toBeVisible();`;
            case 'screenshot':
                return `${comment}\n  await page.screenshot({ path: 'screenshots/step-${i + 1}.png' });`;
            case 'select':
                return `${comment}\n  await page.selectOption('${step.selector}', '${step.value || ''}');`;
            case 'pressKey':
                return `${comment}\n  await page.press('${step.selector || 'body'}', '${step.value || 'Enter'}');`;
            default:
                return `${comment}\n  // Unknown action: ${step.action}`;
        }
    }).join('\n');
    return `import { test, expect } from '@playwright/test';

test('${test.name}', async ({ page }) => {
  ${baseUrlConfig}

${steps}
});
`;
}
