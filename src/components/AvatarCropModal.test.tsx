import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AvatarCropModal from './AvatarCropModal';

describe('AvatarCropModal', () => {
  const dummySrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('renders crop modal with controls', async () => {
    render(<AvatarCropModal imageSrc={dummySrc} onCropComplete={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('CROP YOUR AVATAR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Crop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<AvatarCropModal imageSrc={dummySrc} onCropComplete={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates scale when zoom range slider is changed', () => {
    render(<AvatarCropModal imageSrc={dummySrc} onCropComplete={vi.fn()} onClose={vi.fn()} />);

    const zoomInput = screen.getByLabelText('Avatar Zoom');
    fireEvent.change(zoomInput, { target: { value: '2' } });
    expect(screen.getByText('200%')).toBeInTheDocument();
  });
});
