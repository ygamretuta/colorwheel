import type { AddResult } from './ExtractedColors';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import './color-source.css';
import ExtractedColors from './ExtractedColors';
import { extractPalette, readSmallImageData } from './extract';
import { sampleCanvas, toCanvasPoint } from './sample';

const MAX_SIDE = 1600;
const PALETTE_SIZE = 6;
const HAS_EYEDROPPER = typeof window !== 'undefined' && 'EyeDropper' in window;

interface ImageSourceProps {
  hex: string;
  onPick: (hex: string) => void;
  onImageLoaded: (colors: string[]) => void;
  onAddAll: (colors: string[]) => AddResult | void;
}

/**
 * Image intake (file/camera, screen capture, paste, EyeDropper) with click-to-pick.
 * Each loaded image is analysed for its dominant colors and reported with `onImageLoaded(colors)`
 * (most common first, possibly empty) so the parent can start over from it. The colors are then
 * shown as swatches: tap one to use it as the base (`onPick`), or add some or all of them to the
 * palette (`onAddAll(colors)`).
 */
export default function ImageSource({ hex, onPick, onImageLoaded, onAddAll }: ImageSourceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [status, setStatus] = useState('');
  const [extracted, setExtracted] = useState<string[]>([]);
  const [imageVersion, setImageVersion] = useState(0); // new image => fresh selection state

  function drawImage(source: CanvasImageSource, width: number, height: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d', { willReadFrequently: true })?.drawImage(source, 0, 0, canvas.width, canvas.height);
    setHasImage(true);
    const pixels = readSmallImageData(canvas);
    const colors = pixels ? extractPalette(pixels, PALETTE_SIZE) : [];
    setExtracted(colors);
    setImageVersion((version) => version + 1);
    // A new image is a fresh start: the parent drops everything chosen from the previous one and
    // adopts this image's most common color as the base.
    onImageLoaded(colors);
    // The color row explains itself; only fall back to a hint when nothing could be extracted.
    setStatus(colors.length > 0 ? '' : 'Tap the image to pick a color.');
  }

  async function loadBlob(blob: Blob) {
    try {
      const bitmap = await createImageBitmap(blob);
      drawImage(bitmap, bitmap.width, bitmap.height);
      bitmap.close?.();
    } catch {
      setStatus('That file could not be read as an image.');
    }
  }

  async function captureScreen() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatus('Screen capture is not supported in this browser. Paste a screenshot or upload an image instead.');
      return;
    }
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      drawImage(video, video.videoWidth, video.videoHeight);
    } catch (error) {
      setStatus(`Screen capture cancelled or blocked (${(error as Error).name}).`);
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  }

  async function useEyedropper() {
    try {
      const { sRGBHex } = await new window.EyeDropper!().open(); // only offered when HAS_EYEDROPPER
      onPick(sRGBHex);
    } catch {
      setStatus('Eyedropper cancelled.');
    }
  }

  // An Effect Event always sees the latest loadBlob without re-subscribing the listener.
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (file) loadBlob(file);
  });

  useEffect(() => {
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hex = sampleCanvas(canvas, toCanvasPoint(event, canvas.getBoundingClientRect(), canvas));
    if (hex) onPick(hex);
  }

  return (
    <div className="source">
        <div className="source__actions">
          <Button className="source__button" onClick={() => fileRef.current?.click()}>Upload or take photo</Button>
          <input
            ref={fileRef}
            className="source__file"
            type="file"
            accept="image/*"
            data-testid="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) loadBlob(file);
              event.target.value = '';
            }}
          />
          <Button className="source__button" onClick={captureScreen}>Capture screen</Button>
          {HAS_EYEDROPPER && <Button className="source__button" variant="outline" onClick={useEyedropper}>Eyedropper</Button>}
        </div>
        <div className={`source__stage${hasImage ? '' : ' source__stage--empty'}`}>
          {!hasImage && <p className="source__hint">Choose a source, or paste a screenshot (Ctrl/⌘+V).</p>}
          <canvas ref={canvasRef} className="source__canvas" hidden={!hasImage} onClick={handleCanvasClick} />
        </div>
        {extracted.length > 0 && (
          <ExtractedColors key={imageVersion} colors={extracted} activeHex={hex} onPick={onPick} onAdd={onAddAll} />
        )}
        <p className="source__status" role="status">{status}</p>
    </div>
  );
}
