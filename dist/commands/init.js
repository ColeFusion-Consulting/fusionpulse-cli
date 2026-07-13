import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
export async function initCommand() {
    const dir = process.cwd();
    const testDir = join(dir, 'fusionpulse-tests');
    if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
    }
    const envPath = join(dir, '.env');
    if (!existsSync(envPath)) {
        writeFileSync(envPath, `# FusionPulse CLI Configuration
OPENAI_API_KEY=your-key-here
# FUSIONPULSE_API_KEY=your-saas-api-key (optional, for cloud execution)
`, 'utf-8');
        console.log(' Created .env file (add your OpenAI API key)');
    }
    else {
        console.log(' .env already exists');
    }
    const configPath = join(dir, 'fusionpulse.config.json');
    if (!existsSync(configPath)) {
        writeFileSync(configPath, JSON.stringify({
            baseUrl: 'http://localhost:3000',
            testsDir: 'fusionpulse-tests',
            model: 'gpt-4o-mini',
            timeout: 30000,
        }, null, 2), 'utf-8');
        console.log(' Created fusionpulse.config.json');
    }
    console.log('\n FusionPulse CLI initialized!');
    console.log(' Next steps:');
    console.log('   1. Add your OpenAI API key to .env');
    console.log('   2. Run: fusionpulse generate "describe what to test"');
    console.log('   3. Run: fusionpulse run');
}
