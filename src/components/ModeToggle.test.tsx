import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModeToggle from './ModeToggle';
import '../i18n';

describe('ModeToggle', () => {
  it('renders correctly with Practice mode active', () => {
    render(
      <ModeToggle
        mode="practice"
        onChangeMode={vi.fn()}
        isWalletConnected={true}
        onPromptConnect={vi.fn()}
      />
    );

    const practiceBtn = screen.getByTestId('mode-practice-btn');
    const onChainBtn = screen.getByTestId('mode-onchain-btn');

    expect(practiceBtn).toHaveAttribute('aria-checked', 'true');
    expect(onChainBtn).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('practice-risk-free-label')).toHaveTextContent(
      'virtual xLM, no on-chain risk'
    );
  });

  it('renders correctly with On-Chain mode active', () => {
    render(
      <ModeToggle
        mode="on-chain"
        onChangeMode={vi.fn()}
        isWalletConnected={true}
        onPromptConnect={vi.fn()}
      />
    );

    const practiceBtn = screen.getByTestId('mode-practice-btn');
    const onChainBtn = screen.getByTestId('mode-onchain-btn');

    expect(practiceBtn).toHaveAttribute('aria-checked', 'false');
    expect(onChainBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('switches to practice mode when Practice chip is clicked', () => {
    const onChangeMode = vi.fn();
    render(
      <ModeToggle
        mode="on-chain"
        onChangeMode={onChangeMode}
        isWalletConnected={true}
        onPromptConnect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('mode-practice-btn'));
    expect(onChangeMode).toHaveBeenCalledWith('practice');
  });

  it('switches to on-chain mode when On-Chain chip is clicked and wallet is connected', () => {
    const onChangeMode = vi.fn();
    render(
      <ModeToggle
        mode="practice"
        onChangeMode={onChangeMode}
        isWalletConnected={true}
        onPromptConnect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('mode-onchain-btn'));
    expect(onChangeMode).toHaveBeenCalledWith('on-chain');
  });

  it('triggers onPromptConnect and does NOT switch mode when wallet is disconnected', () => {
    const onChangeMode = vi.fn();
    const onPromptConnect = vi.fn();
    render(
      <ModeToggle
        mode="practice"
        onChangeMode={onChangeMode}
        isWalletConnected={false}
        onPromptConnect={onPromptConnect}
      />
    );

    fireEvent.click(screen.getByTestId('mode-onchain-btn'));
    expect(onPromptConnect).toHaveBeenCalledTimes(1);
    expect(onChangeMode).not.toHaveBeenCalled();
  });
});
