import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
export async function runCommand(options) {
    const dir = process.cwd();
    const configPath = join(dir, 'fusionpulse.config.json');
    let testDir = 'fusionpulse-tests';
    if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        testDir = config.testsDir || testDir;
    }
    const testDirFull = join(dir, testDir);
    if (!existsSync(testDirFull)) {
        console.error(` No test directory found at ${testDir}`);
        console.error('   Run: fusionpulse init');
        process.exit(1);
    }
    let files;
    if (options.file) {
        files = [join(dir, options.file)];
    }
    else {
        files = readdirSync(testDirFull)
            .filter(f => f.endsWith('.spec.ts') || f.endsWith('.spec.js'))
            .map(f => join(testDirFull, f));
    }
    if (files.length === 0) {
        console.error(' No test files found');
        console.error('   Run: fusionpulse generate "describe what to test"');
        process.exit(1);
    }
    console.log(` Running ${files.length} test(s)...`);
    const playwrightArgs = [
        'npx',
        'playwright',
        'test',
        ...files,
        '--project=chromium',
    ];
    if (options.headed) {
        playwrightArgs.push('--headed');
    }
    try {
        execSync(playwrightArgs.join(' '), {
            cwd: dir,
            stdio: 'inherit',
            env: { ...process.env, BASE_URL: process.env.BASE_URL || 'http://localhost:3000' },
        });
    }
    catch {
        console.error(' Some tests failed');
        process.exit(1);
    }
}
// readFileSync already imported above
