'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { capturePhoto, pickPhoto, compressImage, savePhoto } from '@/lib/store/photoStore';
import { generateRepLogId } from '@/types/habit';

interface PhotoPromptScreenProps {
  onPhotoSaved: (photoUri: string) => void;
  onSkip: () => void;
}

export default function PhotoPromptScreen({
  onPhotoSaved,
  onSkip,
}: PhotoPromptScreenProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const dataUrl = await capturePhoto();
      const compressed = await compressImage(dataUrl);
      const photoId = `photo-${generateRepLogId()}`;

      await savePhoto(photoId, compressed);
      onPhotoSaved(photoId);
    } catch (err) {
      if ((err as Error).message !== 'Capture cancelled') {
        setError('Could not capture photo. Please try again.');
        console.error('Photo capture error:', err);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePick = async () => {
    setIsPicking(true);
    setError(null);

    try {
      const dataUrl = await pickPhoto();
      const compressed = await compressImage(dataUrl);
      const photoId = `photo-${generateRepLogId()}`;

      await savePhoto(photoId, compressed);
      onPhotoSaved(photoId);
    } catch (err) {
      if ((err as Error).message !== 'Selection cancelled') {
        setError('Could not select photo. Please try again.');
        console.error('Photo pick error:', err);
      }
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Camera Icon */}
        <div className="text-5xl mb-6" role="img" aria-label="camera">
          📸
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-[var(--text-primary)] mb-3">
          Nice work!
        </h1>

        {/* Description */}
        <p className="text-base text-center text-[var(--text-secondary)] max-w-[280px] mb-2">
          Snap a quick photo as proof of your rep.
        </p>
        <p className="text-sm text-center text-[var(--text-tertiary)] max-w-[280px] mb-8">
          It&apos;s just for you—builds your habit journal.
        </p>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-3">
        {/* Take Photo */}
        <Button
          onClick={handleCapture}
          disabled={isCapturing || isPicking}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <span className="flex items-center justify-center gap-2">
            <span>📷</span>
            {isCapturing ? 'Opening camera...' : 'Take photo'}
          </span>
        </Button>

        {/* Choose from Library */}
        <Button
          onClick={handlePick}
          disabled={isCapturing || isPicking}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <span className="flex items-center justify-center gap-2">
            <span>🖼️</span>
            {isPicking ? 'Opening library...' : 'Choose from library'}
          </span>
        </Button>

        {/* Skip */}
        <button
          onClick={onSkip}
          disabled={isCapturing || isPicking}
          className="w-full text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] py-3 transition-colors"
        >
          Skip for now
        </button>

        {/* Privacy Note */}
        <div className="pt-4 border-t border-[var(--bg-tertiary)]">
          <p className="text-xs text-center text-[var(--text-tertiary)]">
            Photos are stored locally and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}
