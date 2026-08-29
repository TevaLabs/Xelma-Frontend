import { expect, test } from '@playwright/test';
import axe from 'axe-core';

declare global {
  interface Window {
    axe: typeof axe;
  }
}

const routes = [
  { name: 'Landing', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
] as const;

test.describe('E2E accessibility scan', () => {
  for (const route of routes) {
    test(`${route.name} has no serious axe violations`, async ({ page }) => {
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

      if (seriousViolations.length > 0) {
        // Attach full results so CI artifacts contain the detailed report
        test.info().attach('axe-results.json', {
          body: JSON.stringify(results, null, 2),
          contentType: 'application/json',
        });

        // Print a short summary for logs so it's immediately visible
        const summary = seriousViolations
          .map(
            (v) =>
              `- ${v.id} (${v.impact}) — ${v.nodes.length} nodes — ${v.description}`,
          )
          .join('\n');
        console.error(
          `Accessibility: ${seriousViolations.length} serious/critical violations\n${summary}`,
        );

        // Fail with a clear message (keeps the test failing but makes the cause obvious)
        expect(
          seriousViolations.length,
          `Accessibility: ${seriousViolations.length} serious/critical violations on ${route.name}`,
        ).toBe(0);
      }
    });
  }
});
