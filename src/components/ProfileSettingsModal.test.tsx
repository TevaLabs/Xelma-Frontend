import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProfileSettingsModal from './ProfileSettingsModal';
import { useProfileStore } from '../store/useProfileStore';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../store/useProfileStore');

const mockProfile = {
  avatarUrl: null,
  name: 'Ada Lovelace',
  bio: 'First programmer',
  twitterLink: 'https://x.com/ada',
  streamerMode: false,
};

const mockStore = {
  profile: mockProfile,
  isLoading: false,
  error: null,
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
};

describe('ProfileSettingsModal accessibility', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStore.profile = mockProfile;
    mockStore.isLoading = false;
    mockStore.error = null;
    mockStore.loadProfile = vi.fn().mockResolvedValue(undefined);
    mockStore.saveProfile = vi.fn().mockResolvedValue(true);

    vi.mocked(useProfileStore).mockImplementation((selector) => selector(mockStore));
  });

  it('renders dialog semantics with a label and description', async () => {
    render(<ProfileSettingsModal onClose={vi.fn()} />);

    await screen.findByLabelText('NAME');
    const dialog = screen.getByRole('dialog', { name: /profile settings/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'profile-settings-description');
  });

  it('focuses the first field and closes on Escape', async () => {
    const onClose = vi.fn();
    render(<ProfileSettingsModal onClose={onClose} />);

    const nameInput = await screen.findByLabelText('NAME');
    await waitFor(() => expect(nameInput).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside the modal while open', async () => {
    render(<ProfileSettingsModal onClose={vi.fn()} />);

    const nameInput = await screen.findByLabelText('NAME');
    const saveButton = screen.getByRole('button', { name: /save/i });

    await waitFor(() => expect(nameInput).toHaveFocus());

    saveButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: /close profile settings/i })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(saveButton).toHaveFocus();
  });

  it('restores focus to the trigger after close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open profile';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<ProfileSettingsModal onClose={vi.fn()} />);
    await screen.findByRole('dialog', { name: /profile settings/i });

    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('uses a semantic switch button for streamer mode', async () => {
    render(<ProfileSettingsModal onClose={vi.fn()} />);

    const switchControl = await screen.findByRole('switch', { name: /streamer mode/i });
    expect(switchControl.tagName).toBe('BUTTON');
    expect(switchControl).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(switchControl);

    expect(switchControl).toHaveAttribute('aria-checked', 'true');
  });

  it('validates file type on avatar upload', async () => {
    const { toast } = await import('sonner');
    render(<ProfileSettingsModal onClose={vi.fn()} />);

    const fileInput = await screen.findByLabelText(/UPLOAD & CROP/i);
    const invalidFile = new File(['text content'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(toast.error).toHaveBeenCalledWith('Invalid file type', expect.any(Object));
  });

  it('validates file size limit on avatar upload', async () => {
    const { toast } = await import('sonner');
    render(<ProfileSettingsModal onClose={vi.fn()} />);

    const fileInput = await screen.findByLabelText(/UPLOAD & CROP/i);
    const largeContent = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([largeContent], 'heavy.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(toast.error).toHaveBeenCalledWith('File too large', expect.any(Object));
  });

  describe('unsaved changes guard', () => {
    it('closes immediately when nothing has changed', async () => {
      const onClose = vi.fn();
      render(<ProfileSettingsModal onClose={onClose} />);
      await screen.findByLabelText('NAME');

      fireEvent.click(screen.getByRole('button', { name: /close profile settings/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('asks for confirmation before closing with unsaved edits', async () => {
      const onClose = vi.fn();
      render(<ProfileSettingsModal onClose={onClose} />);
      const nameInput = await screen.findByLabelText('NAME');

      fireEvent.change(nameInput, { target: { value: 'Grace Hopper' } });
      fireEvent.click(screen.getByRole('button', { name: /close profile settings/i }));

      expect(onClose).not.toHaveBeenCalled();
      const confirm = screen.getByRole('alertdialog', { name: /discard unsaved changes/i });
      expect(confirm).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /keep editing/i })).toHaveFocus(),
      );
    });

    it('keeps the edits when the user chooses to keep editing', async () => {
      const onClose = vi.fn();
      render(<ProfileSettingsModal onClose={onClose} />);
      const nameInput = await screen.findByLabelText('NAME');

      fireEvent.change(nameInput, { target: { value: 'Grace Hopper' } });
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.click(screen.getByRole('button', { name: /keep editing/i }));

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByLabelText('NAME')).toHaveValue('Grace Hopper');
    });

    it('dismisses the confirmation (not the modal) on a second Escape', async () => {
      const onClose = vi.fn();
      render(<ProfileSettingsModal onClose={onClose} />);
      const bioInput = await screen.findByLabelText('BIO');

      fireEvent.change(bioInput, { target: { value: 'Changed bio' } });
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes and resets the draft when the user discards changes', async () => {
      const onClose = vi.fn();
      render(<ProfileSettingsModal onClose={onClose} />);
      await screen.findByLabelText('NAME');

      fireEvent.click(screen.getByRole('switch', { name: /streamer mode/i }));
      fireEvent.mouseDown(document.querySelector('.fixed.inset-0') as Element);
      fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
      const draft = JSON.parse(localStorage.getItem('profile_settings_draft_v1') ?? '{}');
      expect(draft).toMatchObject({ name: 'Ada Lovelace', streamerMode: false });
    });

    it('does not prompt again once the user reverts their edits', async () => {
      const onClose = vi.fn();
      render(<ProfileSettingsModal onClose={onClose} />);
      const nameInput = await screen.findByLabelText('NAME');

      fireEvent.change(nameInput, { target: { value: 'Grace Hopper' } });
      fireEvent.change(nameInput, { target: { value: 'Ada Lovelace' } });
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
