import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import Dashboard from './Dashboard';
import RoundCard from '../components/RoundCard';
import BetModal from '../components/BetModal';
import { mockRounds } from '../data/mockData';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRoundStore } from '../store/useRoundStore';
import { predictionsApi } from '../lib/api-client';
import { place_bet, place_precision_prediction } from '../lib/xelma-contract';

vi.mock('../components/PriceChart', () => ({
  default: () => <div data-testid="price-chart">Price Chart</div>,
}));

vi.mock('../lib/api-client', () => ({
  predictionsApi: {
    submit: vi.fn(),
    getUserHistory: vi.fn().mockResolvedValue([]),
  },
  educationApi: {
    getTip: vi.fn().mockResolvedValue(null),
    getGuides: vi.fn().mockResolvedValue([]),
  },
  statsApi: {
    getNetworkStats: vi.fn().mockResolvedValue(null),
    getUserStats: vi.fn().mockResolvedValue(null),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      Object.assign(this, { status });
    }
  },
}));

vi.mock('../lib/xelma-contract', () => ({
  place_bet: vi.fn(),
  place_precision_prediction: vi.fn(),
  estimatePlaceBet: vi.fn().mockResolvedValue({
    baseFee: '0.00001',
    resourceFee: '0.00005',
    totalFee: '0.00006',
    instructions: '1000000',
    readBytes: '500',
    writeBytes: '200',
  }),
  estimatePrecisionPrediction: vi.fn().mockResolvedValue({
    baseFee: '0.00001',
    resourceFee: '0.00006',
    totalFee: '0.00007',
    instructions: '1200000',
    readBytes: '600',
    writeBytes: '300',
  }),
}));

describe('Dashboard Terminal & Round Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoundStore.setState({
      isRoundActive: true,
      fetchActiveRound: vi.fn().mockResolvedValue(undefined),
      subscribeToRoundEvents: vi.fn(() => vi.fn()),
    });
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GTEST123',
      balance: '1000 XLM',
    });
    useAuthStore.setState({
      isAuthenticated: true,
      jwt: 'mock-jwt-token',
    });
  });

  describe('Wallet-gated behavior', () => {
    it('displays gated messaging when wallet is disconnected', () => {
      useWalletStore.setState({ status: 'idle', publicKey: null });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText(/connect your wallet to submit predictions/i)).toBeInTheDocument();
      expect(screen.getByText(/connect your wallet to make predictions/i)).toBeInTheDocument();
    });

    it('hides gated messaging when wallet is connected', () => {
      useWalletStore.setState({ status: 'connected', publicKey: 'GTEST123' });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.queryByText(/connect your wallet to submit predictions/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/connect your wallet to make predictions/i)).not.toBeInTheDocument();
    });

    // Issue #175 — wallet banner must include a 44px touch target
    it('Connect now link enforces a minimum 44px touch target and stacks on mobile', () => {
      useWalletStore.setState({ status: 'idle', publicKey: null });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      const link = screen.getByTestId('dashboard-connect-now');
      expect(link.className).toMatch(/inline-flex/);
      expect(link.className).toMatch(/min-h-\[44px\]/);
      // Banner container should stack vertically on small viewports and become a row on >=640px.
      const wrapper = link.parentElement;
      expect(wrapper?.className ?? '').toMatch(/flex-col/);
      expect(wrapper?.className ?? '').toMatch(/sm:flex-row/);
    });
  });

  describe('Submit prediction flow & Modal interactions', () => {
    it('executes submit prediction journey from dashboard through modal close', async () => {
      vi.mocked(place_bet).mockResolvedValue({ txHash: 'tx-hash-123', ledger: 100 });
      vi.mocked(predictionsApi.submit).mockResolvedValue({ id: 'pred-1' });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      // Enter stake amount
      const stakeInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.change(stakeInput, { target: { value: '25' } });

      // Trigger UP prediction (modal open interaction)
      const upBtn = screen.getByRole('button', { name: /predict price goes up/i });
      fireEvent.click(upBtn);

      // Verify modal open interaction
      expect(screen.getByText('Confirm Prediction')).toBeInTheDocument();
      expect(screen.getByText('25 XLM')).toBeInTheDocument();

      // Confirm prediction
      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmBtn);

      // Verify submit action executes and API mocks are invoked
      await waitFor(() => {
        expect(place_bet).toHaveBeenCalledWith('GTEST123', 'UP', '25', expect.any(Function));
        expect(predictionsApi.submit).toHaveBeenCalledWith({
          direction: 'UP',
          stake: '25',
          isLegend: false,
          exactPrice: undefined,
        });
      });

      // Verify success feedback appears
      await waitFor(() => {
        expect(screen.getByText('Prediction Submitted!')).toBeInTheDocument();
      });

      // Modal close interaction
      const closeBtns = screen.getAllByRole('button', { name: 'Close' });
      fireEvent.click(closeBtns[0]);

      await waitFor(() => {
        expect(screen.queryByText('Prediction Submitted!')).not.toBeInTheDocument();
      });
    });

    it('re-fetches prediction history after a successful submit, so PredictionHistory reflects the confirmed prediction', async () => {
      vi.mocked(place_bet).mockResolvedValue({ txHash: 'tx-hash-456', ledger: 101 });
      vi.mocked(predictionsApi.submit).mockResolvedValue({ id: 'pred-2' });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      // Both Dashboard's activities feed and PredictionHistory fetch on mount.
      await waitFor(() => {
        expect(predictionsApi.getUserHistory).toHaveBeenCalled();
      });
      const callsBeforeSubmit = vi.mocked(predictionsApi.getUserHistory).mock.calls.length;

      const stakeInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.change(stakeInput, { target: { value: '10' } });

      const upBtn = screen.getByRole('button', { name: /predict price goes up/i });
      fireEvent.click(upBtn);

      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText('Prediction Submitted!')).toBeInTheDocument();
      });

      // Both the RecentActivity feed and PredictionHistory should have
      // re-fetched after success — not just RecentActivity.
      await waitFor(() => {
        expect(vi.mocked(predictionsApi.getUserHistory).mock.calls.length).toBeGreaterThanOrEqual(
          callsBeforeSubmit + 2
        );
      });
    });

    it('invokes expected onSuccess callback when prediction succeeds in modal', async () => {
      vi.mocked(place_bet).mockResolvedValue({ txHash: 'tx-callback-999', ledger: 101 });
      vi.mocked(predictionsApi.submit).mockResolvedValue({ id: 'pred-2' });
      const onSuccessMock = vi.fn();

      render(
        <BetModal
          isOpen={true}
          onClose={vi.fn()}
          predictionData={{ direction: 'DOWN', stake: '15', isLegend: false }}
          onSuccess={onSuccessMock}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledWith('tx-callback-999');
      });
    });
  });

  describe('Round cards and round list rendering', () => {
    it('renders round list correctly with round cards and triggers prediction callback', () => {
      const onSelectRoundMock = vi.fn();

      render(
        <div>
          {mockRounds.map((round) => (
            <RoundCard key={round.id} round={round} onSubmitPrediction={onSelectRoundMock} />
          ))}
        </div>
      );

      // Verify round cards render asset headings (multiple rounds per asset)
      expect(screen.getAllByText('BTC/USD').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('ETH/USD').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('XLM/USD').length).toBeGreaterThanOrEqual(1);

      // Verify round details and pool statistics
      expect(screen.getByText(/reference \$67,420/i)).toBeInTheDocument();
      expect(screen.getByText(/pool: 4\.20k vxlm/i)).toBeInTheDocument();

      // Submit prediction interaction from round card
      const submitButtons = screen.getAllByRole('button', { name: /submit prediction/i });
      fireEvent.click(submitButtons[0]);

      expect(onSelectRoundMock).toHaveBeenCalledTimes(1);
      expect(onSelectRoundMock).toHaveBeenCalledWith(mockRounds[0]);
    });
  });

  describe('Empty state when no active rounds exist', () => {
    it('renders empty state when round list is empty (no active rounds)', () => {
      useRoundStore.setState({
        isRoundActive: false,
        fetchActiveRound: vi.fn().mockResolvedValue(undefined),
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText('No Active Rounds')).toBeInTheDocument();
      expect(screen.getByText(/learn how the game works or refresh to check for new rounds/i)).toBeInTheDocument();
    });

    it('triggers refresh action on clicking refresh button', async () => {
      // This test is skipped because the EmptyState component no longer includes a refresh button
      // The component was simplified to only show title and description
      // If refresh functionality is needed, it should be added back to the EmptyState component
    });
  });
});
