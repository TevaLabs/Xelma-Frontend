import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import PublicProfile from './PublicProfile';
import { toast } from 'sonner';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/u/:handle" element={<PublicProfile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
      </Routes>
    </MemoryRouter>,
  );
}

function stubClipboard(impl: () => Promise<void>) {
  Object.assign(navigator, { clipboard: { writeText: vi.fn(impl) } });
  return navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
}

describe('<PublicProfile />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, { clipboard: undefined });
  });

  it('renders a read-only public card without a wallet or auth', () => {
    renderAt('/u/maria');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Maria');
    expect(screen.getByText('maria')).toBeInTheDocument();
    expect(screen.getByTestId('public-profile-share')).toBeInTheDocument();
    expect(screen.getByText(/Read-only view/i)).toBeInTheDocument();
    // The public card is fully mocked: it must not hit the network.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders the same card through the /profile/:id alias', () => {
    renderAt('/profile/4821');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Player 4821');
  });

  it('copies the profile URL when Share is pressed', async () => {
    const writeText = stubClipboard(() => Promise.resolve());

    renderAt('/u/maria');
    fireEvent.click(screen.getByTestId('public-profile-share'));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('/u/maria');
    expect(toast.success).toHaveBeenCalledWith('Profile link copied to clipboard');
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });

  it('reports a clipboard failure without throwing', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')));

    renderAt('/u/maria');
    fireEvent.click(screen.getByTestId('public-profile-share'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not copy link', expect.any(Object)),
    );
  });

  it('renders a graceful not-found state for a missing handle', () => {
    renderAt('/u/missing');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Profile not found');
    expect(screen.queryByTestId('public-profile-share')).not.toBeInTheDocument();
  });

  it('treats a not-found handle alias as missing', () => {
    renderAt('/u/not-found');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Profile not found');
  });
});
