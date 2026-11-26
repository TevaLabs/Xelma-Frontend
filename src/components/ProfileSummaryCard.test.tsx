import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileSummaryCard from './ProfileSummaryCard';
import { useProfileStore } from '../store/useProfileStore';
import { useWalletStore } from '../store/useWalletStore';

vi.mock('../store/useProfileStore', () => ({ useProfileStore: vi.fn() }));
vi.mock('../store/useWalletStore', () => ({ useWalletStore: vi.fn() }));

vi.mock('./ProfileSettingsModal', () => ({
  default: ({ onClose, initialValues }: { onClose: () => void; initialValues?: { name?: string } }) => (
    <div role="dialog" aria-label="Profile settings" data-initial-name={initialValues?.name}>
      <button type="button" onClick={onClose}>
        Close modal
      </button>
    </div>
  ),
}));

const loadProfile = vi.fn().mockResolvedValue(undefined);

const baseProfile = {
  avatarUrl: null as string | null,
  name: 'Ada Lovelace',
  bio: 'First programmer',
  twitterLink: '',
  streamerMode: false,
};

function mockStores(overrides: {
  profile?: typeof baseProfile | null;
  isLoading?: boolean;
  error?: string | null;
} = {}) {
  const state = {
    profile: overrides.profile !== undefined ? overrides.profile : baseProfile,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    loadProfile,
  };
  vi.mocked(useProfileStore).mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as never);
  vi.mocked(useWalletStore).mockImplementation(((selector: (s: { publicKey: string }) => unknown) =>
    selector({ publicKey: 'GTESTADDRESS' })) as never);
}

function renderCard() {
  return render(
    <MemoryRouter>
      <ProfileSummaryCard />
    </MemoryRouter>,
  );
}

describe('ProfileSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStores();
  });

  it('loads the profile on mount', () => {
    renderCard();
    expect(loadProfile).toHaveBeenCalledTimes(1);
  });

  it('renders as a labelled glass card with name and bio', () => {
    renderCard();

    const card = screen.getByRole('region', { name: 'Your profile' });
    expect(card).toHaveClass('glass-card');
    expect(screen.getByTestId('profile-summary-name')).toHaveTextContent('Ada Lovelace');
    expect(screen.getByTestId('profile-summary-bio')).toHaveTextContent('First programmer');
  });

  it('falls back to a default name and bio prompt for an empty profile', () => {
    mockStores({ profile: { ...baseProfile, name: '', bio: '' } });
    renderCard();

    expect(screen.getByTestId('profile-summary-name')).toHaveTextContent('Anonymous Player');
    expect(screen.getByTestId('profile-summary-bio')).toHaveTextContent(/no bio yet/i);
  });

  it('shows an uploaded avatar with meaningful alt text', () => {
    mockStores({ profile: { ...baseProfile, avatarUrl: 'data:image/png;base64,abc' } });
    renderCard();

    expect(screen.getByRole('img', { name: "Ada Lovelace's avatar" })).toHaveAttribute(
      'src',
      'data:image/png;base64,abc',
    );
  });

  it('falls back to the identicon when no avatar is uploaded', () => {
    renderCard();
    expect(screen.queryByRole('img', { name: /'s avatar/ })).not.toBeInTheDocument();
  });

  it('renders a loading skeleton while the profile is loading', () => {
    mockStores({ profile: null, isLoading: true });
    renderCard();

    expect(screen.getByRole('region', { name: 'Your profile' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
  });

  it('shows the error with a retry action while keeping the summary', () => {
    mockStores({ error: 'Profile unavailable' });
    renderCard();

    expect(screen.getByRole('alert')).toHaveTextContent('Profile unavailable');
    expect(screen.getByTestId('profile-summary-name')).toHaveTextContent('Ada Lovelace');

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(loadProfile).toHaveBeenCalledTimes(2);
  });

  it('links to the full profile page', () => {
    renderCard();
    expect(screen.getByRole('link', { name: /view profile/i })).toHaveAttribute('href', '/profile');
  });

  it('opens and closes the edit modal with the current profile', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    const dialog = screen.getByRole('dialog', { name: /profile settings/i });
    expect(dialog).toHaveAttribute('data-initial-name', 'Ada Lovelace');

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
