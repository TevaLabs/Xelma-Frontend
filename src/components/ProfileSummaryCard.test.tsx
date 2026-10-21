import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSummaryCard from './ProfileSummaryCard';
import { useProfileStore } from '../store/useProfileStore';
import { useWalletStore } from '../store/useWalletStore';

vi.mock('../store/useProfileStore', async (importActual) => {
  const actual = await importActual<typeof import('../store/useProfileStore')>();
  return { ...actual, useProfileStore: vi.fn() };
});

vi.mock('../store/useWalletStore', async (importActual) => {
  const actual = await importActual<typeof import('../store/useWalletStore')>();
  return { ...actual, useWalletStore: vi.fn() };
});

vi.mock('./IdenticonAvatar', () => ({
  default: ({ address, name }: { address?: string; name?: string }) => (
    <div data-testid="identicon-avatar">
      {address && <span data-testid="avatar-address">{address}</span>}
      {name && <span data-testid="avatar-name">{name}</span>}
    </div>
  ),
}));

vi.mock('./ProfileSettingsModal', () => ({
  default: ({ onClose, initialValues }: { onClose: () => void; initialValues?: any }) => (
    <div data-testid="profile-settings-modal">
      <button onClick={onClose}>Close Modal</button>
      {initialValues && <span data-testid="modal-initial-values">true</span>}
    </div>
  ),
}));

interface ProfileStateOverrides {
  profile?: { name?: string; bio?: string; avatarUrl?: string } | null;
  isLoading?: boolean;
  error?: string | null;
}

function setProfileState({ profile = null, isLoading = false, error = null }: ProfileStateOverrides = {}) {
  const state = {
    profile,
    isLoading,
    error,
    loadProfile: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(useProfileStore).mockImplementation((selector: any) =>
    typeof selector === 'function' ? selector(state) : state,
  );
}

function setWalletState({ publicKey = null }: { publicKey?: string | null } = {}) {
  const state = {
    publicKey,
  };
  vi.mocked(useWalletStore).mockImplementation((selector: any) =>
    typeof selector === 'function' ? selector(state) : state,
  );
}

describe('ProfileSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setProfileState();
    setWalletState();
  });

  describe('loading state', () => {
    it('renders loading skeleton when loading and no profile exists', () => {
      setProfileState({ isLoading: true, profile: null });
      render(<ProfileSummaryCard />);

      // Check for sr-only loading text
      expect(screen.getByText('Loading profile…')).toBeInTheDocument();
      // Check for skeleton animation class
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message when there is an error', () => {
      setProfileState({ error: 'Failed to load profile' });
      render(<ProfileSummaryCard />);

      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('profile display', () => {
    it('renders display name from profile', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      const { container } = render(<ProfileSummaryCard />);

      const heading = container.querySelector('h2');
      expect(heading).toHaveTextContent('Test User');
    });

    it('renders "Anonymous Player" when profile name is empty', () => {
      setProfileState({ profile: { name: '', bio: '' } });
      const { container } = render(<ProfileSummaryCard />);

      // Check that the heading contains "Anonymous Player"
      const heading = container.querySelector('h2');
      expect(heading).toHaveTextContent('Anonymous Player');
    });

    it('renders bio when present', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'This is my bio' } });
      render(<ProfileSummaryCard />);

      expect(screen.getByText('This is my bio')).toBeInTheDocument();
    });

    it('does not render bio section when bio is empty', () => {
      setProfileState({ profile: { name: 'Test User', bio: '' } });
      render(<ProfileSummaryCard />);

      expect(screen.queryByText('This is my bio')).not.toBeInTheDocument();
    });

    it('renders avatar image when avatarUrl is present', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio', avatarUrl: 'https://example.com/avatar.jpg' } });
      const { container } = render(<ProfileSummaryCard />);

      const avatar = container.querySelector('img');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(avatar).toHaveAttribute('alt', '');
    });

    it('renders identicon when avatarUrl is not present', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      setWalletState({ publicKey: 'GTEST123' });
      render(<ProfileSummaryCard />);

      expect(screen.getByTestId('identicon-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-address')).toHaveTextContent('GTEST123');
    });
  });

  describe('edit button and modal', () => {
    it('renders edit button', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      render(<ProfileSummaryCard />);

      const editButton = screen.getByRole('button', { name: /edit profile settings/i });
      expect(editButton).toBeInTheDocument();
    });

    it('opens ProfileSettingsModal when edit button is clicked', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      render(<ProfileSummaryCard />);

      const editButton = screen.getByRole('button', { name: /edit profile settings/i });
      fireEvent.click(editButton);

      expect(screen.getByTestId('profile-settings-modal')).toBeInTheDocument();
    });

    it('passes profile data as initialValues to modal', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      render(<ProfileSummaryCard />);

      const editButton = screen.getByRole('button', { name: /edit profile settings/i });
      fireEvent.click(editButton);

      expect(screen.getByTestId('modal-initial-values')).toBeInTheDocument();
    });

    it('closes modal when onClose is called', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      render(<ProfileSummaryCard />);

      const editButton = screen.getByRole('button', { name: /edit profile settings/i });
      fireEvent.click(editButton);

      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('profile-settings-modal')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on the section', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      render(<ProfileSummaryCard />);

      const section = screen.getByLabelText('Your profile');
      expect(section).toBeInTheDocument();
    });

    it('sets aria-busy during loading', () => {
      setProfileState({ isLoading: true, profile: null });
      render(<ProfileSummaryCard />);

      const section = screen.getByLabelText('Your profile');
      expect(section).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('glass-card styling', () => {
    it('applies glass-card class for dark terminal theme', () => {
      setProfileState({ profile: { name: 'Test User', bio: 'Test bio' } });
      const { container } = render(<ProfileSummaryCard />);

      const section = container.querySelector('.glass-card');
      expect(section).toBeInTheDocument();
    });
  });
});
