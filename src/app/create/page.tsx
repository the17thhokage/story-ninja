'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/create/StepIndicator';
import { StepChildDetails } from '@/components/create/StepChildDetails';
import { StepPhotoUpload } from '@/components/create/StepPhotoUpload';
import { StepThemePicker } from '@/components/create/StepThemePicker';
import { LeaveConfirmDialog } from '@/components/create/LeaveConfirmDialog';
import type { BookTheme } from '@/types/database';

export interface PhotoEntry {
  id: string;
  file: File;
  storagePath: string | null;
  previewUrl: string;
  status: 'uploading' | 'uploaded' | 'error';
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<BookTheme | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const hasProgress =
    childName !== '' || childAge !== null || photos.length > 0 || selectedTheme !== null;

  // Warn on browser close/refresh
  useEffect(() => {
    if (!hasProgress) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasProgress]);

  const handleNavigateAway = useCallback(
    (href: string) => {
      if (hasProgress) {
        setPendingNavigation(href);
        setShowLeaveDialog(true);
      } else {
        router.push(href);
      }
    },
    [hasProgress, router]
  );

  const handleLeave = () => {
    setShowLeaveDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleStay = () => {
    setShowLeaveDialog(false);
    setPendingNavigation(null);
  };

  async function handleCreateBook() {
    if (!selectedTheme || !childName || !childAge) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_name: childName,
          child_age: childAge,
          theme: selectedTheme,
          photo_paths: photos.map((p) => p.storagePath).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || 'Something went wrong. Please try again.');
        setIsCreating(false);
        return;
      }

      const { data } = await res.json();
      router.push(`/create/${data.book_id}/generating`);
    } catch {
      setCreateError('Something went wrong. Your photos are saved — please try again.');
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <div className="mb-2">
        <button
          onClick={() => handleNavigateAway('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Home
        </button>
      </div>

      <StepIndicator currentStep={step} />

      <div className="mt-8">
        {step === 1 && (
          <StepChildDetails
            childName={childName}
            childAge={childAge}
            onUpdate={(name, age) => {
              setChildName(name);
              setChildAge(age);
            }}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepPhotoUpload
            childName={childName}
            photos={photos}
            onPhotosChange={setPhotos}
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepThemePicker
            selectedTheme={selectedTheme}
            onThemeSelect={setSelectedTheme}
            onCreateBook={handleCreateBook}
            isCreating={isCreating}
            error={createError}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      <LeaveConfirmDialog open={showLeaveDialog} onLeave={handleLeave} onStay={handleStay} />
    </div>
  );
}
