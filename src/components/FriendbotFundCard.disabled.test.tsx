import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWalletStore } from '../store/useWalletStore';

const PUBLIC_KEY = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

// Mock horizon to return IS_MAINNET = true for this test file
vi.mock('../lib/horizon', () => ({
  IS_MAINNET: true,
  HORIZON_URL: 'https://horizon.stellar.org',
}));

// Mock friendbot with FRIENDBOT_ENABLED as false
vi.mock('../lib/friendbot', async () => {
  const actual = await vi.importActual<typeof import('../lib/friendbot')>('../lib/friendbot');
  return {
    ...actual,
    FRIENDBOT_ENABLED: false,
  };
});

// Import after mocks are set up
import FriendbotFundCard from './FriendbotFundCard';

describe('FriendbotFundCard with Friendbot disabled (mainnet)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletStore.getState().reset();
  });

  it('hides when Friendbot is disabled on mainnet', () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: PUBLIC_KEY,
      balance: '0.50 XLM',
    });
    const { container } = render(<FriendbotFundCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
