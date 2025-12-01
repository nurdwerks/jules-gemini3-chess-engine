const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const NYC_OUTPUT = path.join(ROOT_DIR, '.nyc_output');
const COVERAGE_DIR = path.join(ROOT_DIR, 'coverage');
const UNIFIED_DIR = path.join(COVERAGE_DIR, 'unified');
const REPORT_FILE = path.join(ROOT_DIR, 'COVERAGE_REPORT.md');

const skipTests = process.argv.includes('--skip-tests');

if (!skipTests) {
    // Ensure directories exist/clean them
    console.log('Cleaning coverage directories...');
    if (fs.existsSync(NYC_OUTPUT)) fs.rmSync(NYC_OUTPUT, { recursive: true, force: true });
    if (fs.existsSync(COVERAGE_DIR)) fs.rmSync(COVERAGE_DIR, { recursive: true, force: true });
    fs.mkdirSync(NYC_OUTPUT);

    // 1. Run Backend Tests (Jest)
    console.log('--------------------------------------------------');
    console.log('Running Backend Tests (Jest)...');
    console.log('--------------------------------------------------');
    try {
        execSync('npm run coverage', { stdio: 'inherit', cwd: ROOT_DIR });
    } catch (e) {
        console.warn('Jest tests failed or had issues. Proceeding with available coverage.');
    }

    // 2. Copy Jest coverage to .nyc_output
    const jestCoveragePath = path.join(COVERAGE_DIR, 'coverage-final.json');
    if (fs.existsSync(jestCoveragePath)) {
        console.log('Copying Jest coverage to .nyc_output...');
        fs.copyFileSync(jestCoveragePath, path.join(NYC_OUTPUT, 'jest-coverage.json'));
    } else {
        console.error('Jest coverage file not found at ' + jestCoveragePath);
    }

    // 3. Run E2E Tests (Playwright)
    console.log('--------------------------------------------------');
    console.log('Running E2E Tests (Playwright)...');
    console.log('--------------------------------------------------');

    // Start backend with coverage
    console.log('Starting backend with coverage...');
    const out = fs.openSync(path.join(ROOT_DIR, 'server.log'), 'w');
    const err = fs.openSync(path.join(ROOT_DIR, 'server.err'), 'w');
    const server = spawn('npx', ['nyc', '--silent', '--no-clean', 'node', 'src/app.js'], {
        cwd: ROOT_DIR,
        detached: true,
        stdio: ['ignore', out, err]
    });

    // Wait for server to be ready
    console.log('Waiting for server to start...');
    try {
        execSync('sleep 10');
    } catch (e) {}

    try {
        execSync('npm run test:e2e', { stdio: 'inherit', cwd: ROOT_DIR });
    } catch (e) {
        console.warn('E2E tests failed or had issues. Proceeding with available coverage.');
    } finally {
        // Kill server nicely to ensure coverage is written
        console.log('Stopping backend...');
        try {
            process.kill(-server.pid, 'SIGINT');
            // Give it time to write coverage
            execSync('sleep 5');
        } catch (e) {
            console.error('Error stopping server:', e);
        }
    }
} else {
    console.log('Skipping test execution as requested.');
}

// 4. Generate Unified Report
console.log('--------------------------------------------------');
console.log('Generating Unified Report...');
console.log('--------------------------------------------------');
try {
    execSync(`npx nyc report --reporter=html --reporter=text --reporter=json-summary --report-dir=${UNIFIED_DIR} --temp-dir=${NYC_OUTPUT}`, { stdio: 'inherit', cwd: ROOT_DIR });
} catch (e) {
    console.error('Failed to generate nyc report:', e);
}

// 5. Generate Markdown with Mermaid
console.log('Generating Markdown Report with Mermaid Diagrams...');
const summaryPath = path.join(UNIFIED_DIR, 'coverage-summary.json');
if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const markdown = generateMarkdown(summary);
    fs.writeFileSync(REPORT_FILE, markdown);
    console.log(`Report written to ${REPORT_FILE}`);
} else {
    console.error('Coverage summary not found!');
}

function generateMarkdown(summary) {
    let md = '# Unified Coverage Report\n\n';

    // Calculate totals
    const total = summary.total;
    const statements = total.statements.pct;
    const branches = total.branches.pct;
    const functions = total.functions.pct;
    const lines = total.lines.pct;

    md += '## Summary\n\n';
    md += `**Total Statement Coverage:** ${statements}%\n\n`;
    md += `| Category | Percentage | Covered/Total |\n`;
    md += `|---|---|---|\n`;
    md += `| Statements | ${statements}% | ${total.statements.covered}/${total.statements.total} |\n`;
    md += `| Branches | ${branches}% | ${total.branches.covered}/${total.branches.total} |\n`;
    md += `| Functions | ${functions}% | ${total.functions.covered}/${total.functions.total} |\n`;
    md += `| Lines | ${lines}% | ${total.lines.covered}/${total.lines.total} |\n\n`;

    // Diagrams
    md += '## Visualizations\n\n';

    md += '### Coverage Overview\n\n';
    md += '```mermaid\n';
    md += 'graph TD\n';

    const getHex = (pct) => {
        if (pct >= 80) return '#4caf50';
        if (pct >= 50) return '#ffeb3b';
        return '#f44336';
    }

    // Sort files by path
    const files = Object.keys(summary).filter(k => k !== 'total').sort();

    // Build tree
    const tree = {};

    files.forEach(file => {
        let relPath = path.relative(ROOT_DIR, file);
        if (relPath.startsWith('..')) return;
        if (!relPath.startsWith('src') && !relPath.startsWith('public')) return;

        const parts = relPath.split(path.sep);
        let current = tree;

        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = {
                    name: part,
                    path: parts.slice(0, index + 1).join('/'),
                    children: {},
                    coverage: null
                };
            }
            if (index === parts.length - 1) {
                current[part].coverage = summary[file].statements.pct;
            }
            current = current[part].children;
        });
    });

    let nodeIdCounter = 0;

    const traverse = (node, parentId) => {
        const id = `node${nodeIdCounter++}`;

        let label = node.name;
        let color = '#e0e0e0';

        if (node.coverage !== null) {
            label += ` <br/> ${node.coverage}%`;
            color = getHex(node.coverage);
        }

        md += `    ${id}["${label}"]\n`;
        // Apply style
        if (node.coverage !== null) {
             md += `    style ${id} fill:${color},stroke:#333,stroke-width:1px\n`;
        } else {
             md += `    style ${id} fill:${color},stroke:#333,stroke-width:1px,stroke-dasharray: 5 5\n`;
        }

        if (parentId) {
            md += `    ${parentId} --> ${id}\n`;
        }

        // Sort children for consistent output
        const childKeys = Object.keys(node.children).sort();
        childKeys.forEach(key => traverse(node.children[key], id));
    };

    // Traverse roots
    Object.keys(tree).sort().forEach(key => traverse(tree[key], null));

    md += '```\n\n';

    md += '### Coverage Pie Chart\n\n';
    md += '```mermaid\n';
    md += 'pie title Total Coverage Distribution\n';
    md += `    "Covered" : ${statements}\n`;
    md += `    "Uncovered" : ${(100 - statements).toFixed(2)}\n`;
    md += '```\n\n';

    return md;
}
