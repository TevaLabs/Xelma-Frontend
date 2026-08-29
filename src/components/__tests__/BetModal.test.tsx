import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BetModal from '../BetModal';
import { useWalletStore } from '../../store/useWalletStore';
import { useAuthStore } from '../../store/useAuthStore';
import { place_bet, place_precision_prediction } from '../../lib/xelma-contract';
import { predictionsApi } from '../../lib/api-client';

// Mock the contracts module
vi.mock('../../lib/xelma-contract', () => ({
  place_bet: vi.fn(),
  place_precision_prediction: vi.fn(),
  estimatePlaceBet: vi.fn().mockResolvedValue({
    baseFee: '0.0000100',
    resourceFee: '0.0000500',
    totalFee: '0.0000600',
    instructions: '100000',
    readBytes: '512',
    writeBytes: '256',
  }),
  estimatePrecisionPrediction: vi.fn().mockResolvedValue({
    baseFee: '0.0000100',
    resourceFee: '0.0000500',
    totalFee: '0.0000600',
    instructions: '100000',
    readBytes: '512',
    writeBytes: '256',
  }),
}));

// Mock the api-client module
vi.mock('../../lib/api-client', () => ({
  predictionsApi: {
    submit: vi.fn(),
  },
}));

describe('BetModal Component', () => {
  const defaultPrediction = {
    direction: 'UP' as const,
    stake: '15',
    isLegend: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default stores to connected and authenticated
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GUSER123',
      balance: '1000 XLM',
    });
    useAuthStore.setState({
      isAuthenticated: true,
    });
  });

  it('does not render when closed', () => {
    const { container } = render(
      <BetModal isOpen={false} onClose={vi.fn()} predictionData={defaultPrediction} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders confirmation screen with correct prediction details when open', () => {
    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
    );

    expect(screen.getByText('Confirm Prediction')).toBeInTheDocument();
    expect(screen.getByText('UP/DOWN Match')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
    expect(screen.getByText('15 XLM')).toBeInTheDocument();
  });

  it('renders precision prediction details when isLegend is true', () => {
    const legendPrediction = {
      direction: 'DOWN' as const,
      stake: '50',
      isLegend: true,
      exactPrice: '0.2295',
    };

    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={legendPrediction} />
    );

    expect(screen.getByText('Legend Mode (Precision)')).toBeInTheDocument();
    expect(screen.getByText('DOWN')).toBeInTheDocument();
    expect(screen.getByText('50 XLM')).toBeInTheDocument();
    expect(screen.getByText('$0.2295')).toBeInTheDocument();
  });

  it('prompts wallet connection and authentication if user is not connected', () => {
    // Set wallet to disconnected
    useWalletStore.setState({
      status: 'idle',
      publicKey: null,
    });

    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
    );

    expect(screen.getByText('Wallet & Auth Required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect & Authenticate' })).toBeInTheDocument();
  });

  it('ignores rapid double-clicks while the first transaction is pending', async () => {
    let resolveBet!: (value: { txHash: string; ledger: number }) => void;
    vi.mocked(place_bet).mockImplementation(
      () => new Promise((resolve) => { resolveBet = resolve; })
    );
    vi.mocked(predictionsApi.submit).mockResolvedValue({ id: 1 } as any);

    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(place_bet).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Preparing Transaction...')).toBeInTheDocument();
    });
    expect(predictionsApi.submit).not.toHaveBeenCalled();

    resolveBet({ txHash: 'tx_hash_double_click', ledger: 456 });

    await waitFor(() => {
      expect(predictionsApi.submit).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Prediction Submitted!')).toBeInTheDocument();
    });
  });

  it('executes smart contract and backend submit on confirmation', async () => {
    vi.mocked(place_bet).mockImplementation(async (pubkey, dir, stake, onStatus) => {
      if (onStatus) onStatus('preparing');
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        txHash: 'tx_hash_123',
        ledger: 456,
      };
    });
    vi.mocked(predictionsApi.submit).mockResolvedValue({
      id: 1,
    } as any);

    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    // Verify loading state is shown
    expect(await screen.findByText('Preparing Transaction...')).toBeInTheDocument();

    await waitFor(() => {
      expect(place_bet).toHaveBeenCalledWith('GUSER123', 'UP', '15', expect.any(Function));
      expect(predictionsApi.submit).toHaveBeenCalledWith({
        direction: 'UP',
        stake: '15',
        isLegend: false,
        exactPrice: undefined,
      });
      expect(screen.getByText('Prediction Submitted!')).toBeInTheDocument();
      expect(screen.getByText('View on StellarExpert')).toBeInTheDocument();
    });
  });

  it('triggers place_precision_prediction for legend predictions', async () => {
    const legendPrediction = {
      direction: 'DOWN' as const,
      stake: '10',
      isLegend: true,
      exactPrice: '1.25',
    };

    vi.mocked(place_precision_prediction).mockResolvedValue({
      txHash: 'tx_hash_legend',
      ledger: 789,
    });

    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={legendPrediction} />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(place_precision_prediction).toHaveBeenCalledWith('GUSER123', 'DOWN', '10', '1.25', expect.any(Function));
      expect(screen.getByText('Prediction Submitted!')).toBeInTheDocument();
    });
  });

  it('displays error and allows retry if smart contract fails', async () => {
    vi.mocked(place_bet).mockRejectedValue(new Error('User rejected Freighter signature'));

    render(
      <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getAllByText('Transaction Failed')[0]).toBeInTheDocument();
      expect(screen.getByText('User rejected Freighter signature')).toBeInTheDocument();
    });

    // Retry should be visible
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();
  });

  describe('open/close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <BetModal isOpen={true} onClose={onClose} predictionData={defaultPrediction} />
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(
        <BetModal isOpen={true} onClose={onClose} predictionData={defaultPrediction} />
      );

      const backdrop = container.querySelector('.bg-black\\/60');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not render when predictionData is null', () => {
      const { container } = render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('resets state when modal is reopened', () => {
      const { rerender } = render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      // Close modal
      rerender(
        <BetModal isOpen={false} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      // Reopen modal
      rerender(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      // Should show confirm step again
      expect(screen.getByText('Confirm Prediction')).toBeInTheDocument();
    });
  });

  describe('amount validation', () => {
    it('displays zero stake correctly', () => {
      const prediction = { ...defaultPrediction, stake: '0' };
      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={prediction} />
      );
      expect(screen.getByText('0 XLM')).toBeInTheDocument();
    });

    it('displays large stake amounts correctly', () => {
      const prediction = { ...defaultPrediction, stake: '1000000' };
      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={prediction} />
      );
      expect(screen.getByText('1000000 XLM')).toBeInTheDocument();
    });

    it('displays decimal stake amounts correctly', () => {
      const prediction = { ...defaultPrediction, stake: '10.5' };
      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={prediction} />
      );
      expect(screen.getByText('10.5 XLM')).toBeInTheDocument();
    });
  });

  describe('direction toggle', () => {
    it('displays UP direction with green color', () => {
      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      const directionElement = screen.getByText('UP');
      expect(directionElement).toBeInTheDocument();
      expect(directionElement).toHaveClass('text-green-400');
    });

    it('displays DOWN direction with red color', () => {
      const prediction = { ...defaultPrediction, direction: 'DOWN' as const };
      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={prediction} />
      );

      const directionElement = screen.getByText('DOWN');
      expect(directionElement).toBeInTheDocument();
      expect(directionElement).toHaveClass('text-red-400');
    });

    it('updates direction when predictionData changes', () => {
      const { rerender } = render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={{ ...defaultPrediction, direction: 'UP' as const }} />
      );

      expect(screen.getByText('UP')).toHaveClass('text-green-400');
      expect(screen.getByText('DOWN')).not.toHaveClass('text-red-400');

      rerender(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={{ ...defaultPrediction, direction: 'DOWN' as const }} />
      );

      expect(screen.getByText('DOWN')).toHaveClass('text-red-400');
      expect(screen.getByText('UP')).not.toHaveClass('text-green-400');
    });
  });


  describe('precision mode inputs', () => {
    it('lets users enter an exact price in precision mode before submitting', async () => {
      vi.mocked(place_precision_prediction).mockResolvedValue({ txHash: 'tx_hash_precision', ledger: 123 });
      vi.mocked(predictionsApi.submit).mockResolvedValue({ id: 2 } as any);

      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      fireEvent.click(screen.getByRole('tab', { name: 'Precision' }));
      fireEvent.change(screen.getByLabelText('Exact Price Target'), { target: { value: '0.4321' } });
      fireEvent.change(screen.getByLabelText('Stake'), { target: { value: '22.5' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(place_precision_prediction).toHaveBeenCalledWith('GUSER123', 'UP', '22.5', '0.4321', expect.any(Function));
        expect(predictionsApi.submit).toHaveBeenCalledWith({
          direction: 'UP',
          stake: '22.5',
          isLegend: true,
          exactPrice: '0.4321',
        });
      });
    });

    it('prevents empty precision submissions', () => {
      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={{ ...defaultPrediction, stake: '' }} />
      );

      fireEvent.click(screen.getByRole('tab', { name: 'Precision' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Enter a stake amount');
      expect(place_precision_prediction).not.toHaveBeenCalled();
    });
  });

  describe('disabled submit states', () => {
    it('shows wallet_required step when wallet is not connected', () => {
      useWalletStore.setState({
        status: 'idle',
        publicKey: null,
      });

      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      expect(screen.getByText('Wallet & Auth Required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Connect & Authenticate' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    });

    it('shows wallet_required step when not authenticated', () => {
      useAuthStore.setState({
        isAuthenticated: false,
      });

      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      expect(screen.getByText('Wallet & Auth Required')).toBeInTheDocument();
    });

    it('shows confirm step when wallet is connected and authenticated', () => {
      useWalletStore.setState({
        status: 'connected',
        publicKey: 'GUSER123',
        balance: '1000 XLM',
      });
      useAuthStore.setState({
        isAuthenticated: true,
      });

      render(
        <BetModal isOpen={true} onClose={vi.fn()} predictionData={defaultPrediction} />
      );

      expect(screen.getByText('Confirm Prediction')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
  });
});
