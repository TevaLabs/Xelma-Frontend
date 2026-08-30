import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useProfileStore
const mockLoadProfile = vi.fn();
const mockProfile = {
  avatarUrl: null,
  name: '',
  bio: '',
  twitterLink: '',
  streamerMode: false,
};

vi.mock('../store/useProfileStore', () => ({
  useProfileStore: vi.fn(),
}));

// Mock ProfileSettingsModal
vi.mock('../components/ProfileSettingsModal', () => ({
  default: ({ onClose, initialValues }: { onClose: () => void; initialValues: any }) => (
    <div data-testid="profile-settings-modal" data-initial-name={initialValues?.name}>
      <button data-testid="close-settings-modal" onClick={onClose}>
        Close Modal
      </button>
    </div>
  ),
}));

import Profile from './Profile';
import { useProfileStore } from '../store/useProfileStore';

const mockUseProfileStore = vi.mocked(useProfileStore);

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function mockStoreState(overrides: {
  profile?: typeof mockProfile | null;
  isLoading?: boolean;
  error?: string | null;
}) {
  const state = {
    profile: overrides.profile !== undefined ? overrides.profile : mockProfile,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    loadProfile: mockLoadProfile,
  };

  mockUseProfileStore.mockImplementation((selector: any) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the Profile heading', () => {
      mockStoreState({});
      renderWithRouter(<Profile />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Profile');
    });

    it('renders the subtitle text', () => {
      mockStoreState({});
      renderWithRouter(<Profile />);

      expect(
        screen.getByText(/Manage the name, avatar, bio, and public link shown across Xelma/i),
      ).toBeInTheDocument();
    });

    it('renders the Edit profile button', () => {
      mockStoreState({});
      renderWithRouter(<Profile />);

      expect(screen.getByRole('button', { name: /Edit profile/i })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when isLoading is true and profile is null', () => {
      mockStoreState({ isLoading: true, profile: null });
      renderWithRouter(<Profile />);

      expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
    });

    it('shows Edit button in header while profile is loading and null', () => {
      mockStoreState({ isLoading: true, profile: null });
      renderWithRouter(<Profile />);

      // The Edit profile button is in the page header, rendered before the
      // conditional loading block, so it still appears.
      expect(screen.getByRole('button', { name: /Edit profile/i })).toBeInTheDocument();
      // But the main profile content (name/avatar) should show the loading spinner
      expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
      expect(screen.queryByText('Anonymous Player')).toBeNull();
    });
  });

  describe('loaded state', () => {
    it('renders profile content when loaded', () => {
      mockStoreState({
        profile: { avatarUrl: null, name: 'TestUser', bio: 'Test bio', twitterLink: '', streamerMode: false },
        isLoading: false,
      });
      renderWithRouter(<Profile />);

      expect(screen.getByText('TestUser')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
    });

    it('shows "Anonymous Player" when no name is set', () => {
      mockStoreState({
        profile: { avatarUrl: null, name: '', bio: '', twitterLink: '', streamerMode: false },
        isLoading: false,
      });
      renderWithRouter(<Profile />);

      expect(screen.getByText('Anonymous Player')).toBeInTheDocument();
    });

    it('shows Streamer mode badge when streamerMode is enabled', () => {
      mockStoreState({
        profile: { avatarUrl: null, name: 'TestUser', bio: '', twitterLink: '', streamerMode: true },
        isLoading: false,
      });
      renderWithRouter(<Profile />);

      expect(screen.getByText('Streamer mode')).toBeInTheDocument();
    });

    it('shows prompt to personalize when no profile details exist', () => {
      mockStoreState({
        profile: { avatarUrl: null, name: '', bio: '', twitterLink: '', streamerMode: false },
        isLoading: false,
      });
      renderWithRouter(<Profile />);

      expect(screen.getByText(/Your profile is ready to personalize/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error message with retry button when error exists', () => {
      mockStoreState({
        profile: null,
        isLoading: false,
        error: 'Failed to load profile',
      });
      renderWithRouter(<Profile />);

      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('calls loadProfile on retry button click', () => {
      mockStoreState({
        profile: null,
        isLoading: false,
        error: 'Failed to load profile',
      });
      renderWithRouter(<Profile />);

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
      expect(mockLoadProfile).toHaveBeenCalled();
    });
  });

  describe('settings modal', () => {
    it('opens settings modal when Edit profile is clicked', () => {
      mockStoreState({
        profile: { avatarUrl: null, name: '', bio: '', twitterLink: '', streamerMode: false },
        isLoading: false,
      });
      renderWithRouter(<Profile />);

      fireEvent.click(screen.getByRole('button', { name: /Edit profile/i }));

      expect(screen.getByTestId('profile-settings-modal')).toBeInTheDocument();
    });

    it('closes settings modal when onClose is called', () => {
      mockStoreState({
        profile: { avatarUrl: null, name: '', bio: '', twitterLink: '', streamerMode: false },
        isLoading: false,
      });
      renderWithRouter(<Profile />);

      fireEvent.click(screen.getByRole('button', { name: /Edit profile/i }));
      expect(screen.getByTestId('profile-settings-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-settings-modal'));
      expect(screen.queryByTestId('profile-settings-modal')).toBeNull();
    });
  });

  describe('initialization', () => {
    it('calls loadProfile on mount', () => {
      mockStoreState({});
      renderWithRouter(<Profile />);

      expect(mockLoadProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('no network calls', () => {
    it('does not make real fetch calls', () => {
      mockStoreState({});
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      renderWithRouter(<Profile />);
      // All data comes from mocked store, no real fetch should occur
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });
});
