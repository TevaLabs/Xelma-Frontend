import type { Guide, Tip } from '../../../types/education';

/**
 * Fixture data for the education endpoints (`/api/education/*`).
 * Kept in sync with the `Guide` / `Tip` types so the Learn page renders
 * realistic content when the API is mocked.
 */

export const mockGuides: Guide[] = [
  {
    id: 'guide-1',
    title: 'How to Predict Price Movements',
    description:
      'Learn the fundamentals of reading price action before placing your first UP/DOWN prediction.',
    category: 'Basics',
    readTime: '5 min',
    content:
      'Predicting markets is about reading signals, not guessing. Start with the chart, identify the trend, and always size your stake responsibly.',
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'guide-2',
    title: 'The Stellar Ecosystem, Explained',
    description:
      'Understand how Stellar powers Xelma and why it is the ideal network for prediction markets.',
    category: 'Stellar',
    readTime: '8 min',
    content:
      'Stellar settles transactions in seconds for fractions of a cent. Xelma builds on that foundation to run transparent, auditable prediction rounds.',
    externalLink: 'https://stellar.org',
    createdAt: '2026-07-15T14:30:00.000Z',
  },
  {
    id: 'guide-3',
    title: 'Precision Pools: Betting on the Exact Price',
    description:
      'A deep dive into precision predictions — how they work and when they pay off.',
    category: 'Strategy',
    readTime: '6 min',
    createdAt: '2026-08-02T11:15:00.000Z',
  },
];

export const mockTip: Tip = {
  id: 'tip-1',
  title: 'Follow the trend, not the noise',
  content:
    'Short-term volatility is normal — zoom out, identify the direction that matters, and trade it with discipline.',
  category: 'Strategy',
  createdAt: '2026-08-25T08:00:00.000Z',
};
