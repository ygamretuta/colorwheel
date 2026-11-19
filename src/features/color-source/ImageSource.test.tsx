import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ImageSource from './ImageSource';

const setup = () => {
  const props = { onPick: vi.fn(), onImageLoaded: vi.fn(), onAddAll: vi.fn() };
  render(<ImageSource hex="#3366cc" {...props} />);
  return props;
};
const upload = () => screen.getByTestId<HTMLInputElement>('file');
const camera = () => screen.getByTestId<HTMLInputElement>('camera');
const photo = () => new File(['x'], 'photo.png', { type: 'image/png' });

beforeEach(() => {
  // jsdom has no canvas or image decoding
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(() => Promise.resolve({ width: 10, height: 10, close: () => undefined })),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ImageSource intake buttons', () => {
  it('offers Upload image and Take photo as separate buttons', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeTruthy();
  });

  it('asks the phone for the rear camera only on the Take photo input', () => {
    setup();
    expect(camera().getAttribute('capture')).toBe('environment');
    expect(camera().accept).toBe('image/*');
    expect(upload().hasAttribute('capture')).toBe(false);
    expect(upload().accept).toBe('image/*');
  });

  it('opens the camera input from Take photo, not the upload one', async () => {
    setup();
    const openCamera = vi.spyOn(camera(), 'click');
    const openUpload = vi.spyOn(upload(), 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    expect(openCamera).toHaveBeenCalledTimes(1);
    expect(openUpload).not.toHaveBeenCalled();
  });

  it('opens the library input from Upload image, not the camera one', async () => {
    setup();
    const openCamera = vi.spyOn(camera(), 'click');
    const openUpload = vi.spyOn(upload(), 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Upload image' }));
    expect(openUpload).toHaveBeenCalledTimes(1);
    expect(openCamera).not.toHaveBeenCalled();
  });

  it.each([
    ['camera', camera],
    ['upload', upload],
  ])('loads the picture chosen through the %s input', async (_name, input) => {
    const { onImageLoaded } = setup();
    fireEvent.change(input(), { target: { files: [photo()] } });
    await waitFor(() => {
      expect(onImageLoaded).toHaveBeenCalledTimes(1);
    });
  });

  it('lets the same photo be chosen again afterwards', async () => {
    const { onImageLoaded } = setup();
    fireEvent.change(camera(), { target: { files: [photo()] } });
    await waitFor(() => {
      expect(onImageLoaded).toHaveBeenCalled();
    });
    expect(camera().value).toBe('');
  });

  it('says so when a file is not an image', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.reject(new Error('bad'))),
    );
    const { onImageLoaded } = setup();
    fireEvent.change(camera(), { target: { files: [photo()] } });
    expect(await screen.findByText('That file could not be read as an image.')).toBeTruthy();
    expect(onImageLoaded).not.toHaveBeenCalled();
  });

  it('does nothing when the picker is dismissed without a file', () => {
    const { onImageLoaded } = setup();
    fireEvent.change(camera(), { target: { files: [] } });
    expect(onImageLoaded).not.toHaveBeenCalled();
  });
});
