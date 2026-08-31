import { expect, test } from '@playwright/test';
import axe from 'axe-core';
import fs from 'fs';
import path from 'path';

declare global {
  interface Window {
    axe: typeof axe;
  }
}

const routes = [
  { name: 'Landing', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
] as const;

const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'axe');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Optional baseline: path to JSON file with allowed violation signatures (id + selector)
const BASELINE_PATH = path.join(process.cwd(), 'test-results', 'axe-baseline.json');
let baseline: Array<{ id: string; selector?: string }> = [];
if (fs.existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    // ignore parse errors — treat as empty baseline
  }
}

test.describe('E2E accessibility scan', () => {
  for (const route of routes) {
    test(`${route.name} has no serious axe violations`, async ({ page }, testInfo) => {
      await page.goto(route.path);

      // Wait for app to render a stable root element (adjust selector to your app)
      await page.waitForSelector('#root, app-root, body > main, [data-testid="app-root"]', { timeout: 10000 });

      // give one short tick for dynamic content that may render after the selector appears
      await page.waitForTimeout(300);

      await page.addScriptTag({ content: axe.source });

      const results = await page.evaluate(async () => {
        return window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          },
          rules: {
            'color-contrast': { enabled: false },
            'link-in-text-block': { enabled: false },
          },
        });
      });

      // persist full results for triage
      const outputPath = path.join(RESULTS_DIR, `${route.name.replace(/\s+/g, '_')}.axe.json`);
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
      testInfo.attachments = testInfo.attachments || [];
      testInfo.attachments.push({ name: `axe-${route.name}`, path: outputPath, contentType: 'application/json' });

      const seriousViolations = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

      // Filter baseline-allowed violations (if baseline present)
      const filtered = seriousViolations.filter((v) => {
        const allowed = baseline.some((b) => {
          if (b.selector) {
            return v.id === b.id && v.nodes.some(n => n.target && n.target.join(' ').includes(b.selector));
          }
          return v.id === b.id;
        });
        return !allowed;
      });

      if (filtered.length > 0) {
        const summary = filtered.map(v => `- ${v.id} (${v.impact}): ${v.nodes.length} nodes`).join('\n');
        throw new Error(
          `Found ${filtered.length} serious/critical axe violations on ${route.name}:\n${summary}\n\nFull results saved to: ${outputPath}`
        );
      }

      expect(filtered.length).toBe(0);
    });
  }
});

