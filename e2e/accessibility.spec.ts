import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import axe from 'axe-core';

declare global {
  interface Window {
    axe: typeof axe;
  }
}

// Baseline of known accessibility violations.
// When a new violation appears that is NOT in this list the test fails.
// When a violation IS fixed (no longer in axe output) remove it from here
// so the baseline stays current.
//
// To regenerate the full baseline run:
//   UPDATE_BASELINE=1 npx playwright test e2e/accessibility
const BASELINE_PATH = resolve(__dirname, 'axe-baseline.json');

interface BaselineViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  /** Number of affected nodes in the baseline snapshot (informational only). */
  nodeCount: number;
}

function loadBaseline(): BaselineViolation[] {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as BaselineViolation[];
  } catch {
    return [];
  }
}

/** A stable key that identifies a violation regardless of node count changes. */
function violationKey(v: { id: string; impact: string }) {
  return `${v.id}::${v.impact}`;
}

const routes = [
  { name: 'Landing', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
] as const;

test.describe('E2E accessibility scan', () => {
  for (const route of routes) {
    test(`${route.name} has no new serious axe violations`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await page.addScriptTag({ content: axe.source });

      const results = await page.evaluate(async () => {
        return window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          },
        });
      });

      const seriousViolations = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );

      // Always attach full JSON so CI artifacts contain the detailed report
      test.info().attach('axe-results.json', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      });

      if (seriousViolations.length === 0) return;

      // When UPDATE_BASELINE is set, overwrite the baseline file and skip the assertion
      if (process.env.UPDATE_BASELINE) {
        const baseline: BaselineViolation[] = seriousViolations.map((v) => ({
          id: v.id,
          impact: v.impact ?? 'serious',
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodeCount: v.nodes.length,
        }));
        writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
        test.skip(true, 'Baseline updated — re-run without UPDATE_BASELINE to assert');
        return;
      }

      // Filter out baseline violations — only NEW ones cause failure
      const baseline = loadBaseline();
      const baselineKeys = new Set(baseline.map(violationKey));
      const newViolations = seriousViolations.filter(
        (v) => !baselineKeys.has(violationKey(v)),
      );

      // Report what was filtered (known) vs what is new
      const knownCount = seriousViolations.length - newViolations.length;
      if (knownCount > 0) {
        console.log(
          `Accessibility: ${knownCount} known violation(s) matched baseline (suppressed)`,
        );
      }

      if (newViolations.length > 0) {
        const summary = newViolations
          .map(
            (v) =>
              `- ${v.id} (${v.impact}) — ${v.nodes.length} nodes — ${v.description}`,
          )
          .join('\n');
        console.error(
          `Accessibility: ${newViolations.length} NEW serious/critical violation(s) on ${route.name}\n${summary}`,
        );

        expect(
          newViolations.length,
          `Accessibility: ${newViolations.length} NEW serious/critical violations on ${route.name} (not in baseline)`,
        ).toBe(0);
      }
    });
  }
});
