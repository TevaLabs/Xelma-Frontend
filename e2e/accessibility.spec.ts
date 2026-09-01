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
          rules: {
            'color-contrast': { enabled: false },
          },
        });
      });

      const seriousViolations = results.violations.filter((violation) =>
        violation.impact === 'serious' || violation.impact === 'critical',
      );

      expect(seriousViolations).toEqual([]);
    });
  }
});
