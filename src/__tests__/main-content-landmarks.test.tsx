import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// #934 — the skip link in App.tsx points at #main-content, so every primary
// route must render that landmark. This source-level guard keeps the contract
// intact across pages whose render trees differ substantially.
const landmarkPages = [
  'src/pages/Dashboard.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Connect.tsx',
  'src/pages/Learn.tsx',
  'src/pages/Settings.tsx',
  'src/pages/ComingSoonPage.tsx',
  'src/components/Leaderboard.tsx',
];

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('skip-to-content landmark (#934)', () => {
  it('keeps the skip link pointed at #main-content', () => {
    expect(source('src/App.tsx')).toContain('href="#main-content"');
  });

  it.each(landmarkPages)('%s renders the #main-content landmark', (page) => {
    expect(source(page)).toContain('id="main-content"');
  });
});
