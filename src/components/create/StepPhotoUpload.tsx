'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { PhotoEntry } from '@/app/create/page';

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface StepPhotoUploadProps {
  childName: string;
  photos: PhotoEntry[];
  onPhotosChange: (photos: PhotoEntry[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepPhotoUpload({
  childName,
  photos,
  onPhotosChange,
  onContinue,
  onBack,
}: StepPhotoUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploading = photos.some((p) => p.status === 'uploading');
  const uploadedCount = photos.filter((p) => p.status === 'uploaded').length;
  const canContinue = uploadedCount >= 1 && !uploading;
  const canAddMore = photos.length < MAX_PHOTOS;

  const uploadFile = useCallback(
    async (file: File, entryId: string) => {
      if (!user) return;

      const supabase = createClient();
      const filename = `${Date.now()}-${file.name}`;
      const path = `${user.id}/temp/${filename}`;

      const { error } = await supabase.storage.from('child-photos').upload(path, file);

      onPhotosChange(
        photos.map((p) =>
          p.id === entryId
            ? error
              ? { ...p, status: 'error' as const, storagePath: null }
              : { ...p, status: 'uploaded' as const, storagePath: path }
            : p
        )
      );
    },
    [user, photos, onPhotosChange]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const available = MAX_PHOTOS - photos.length;
      const toProcess = fileArray.slice(0, available);

      const newEntries: PhotoEntry[] = [];

      for (const file of toProcess) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          alert('Please upload a JPEG, PNG, or WebP image.');
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          alert('This photo is too large. Max size is 10 MB.');
          continue;
        }

        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        newEntries.push({ id, file, storagePath: null, previewUrl, status: 'uploading' });
      }

      if (newEntries.length === 0) return;

      const updated = [...photos, ...newEntries];
      onPhotosChange(updated);

      // Trigger uploads
      for (const entry of newEntries) {
        uploadFile(entry.file, entry.id);
      }
    },
    [photos, onPhotosChange, uploadFile]
  );

  const handleRemove = useCallback(
    async (entryId: string) => {
      const entry = photos.find((p) => p.id === entryId);
      if (!entry) return;

      // Delete from storage if uploaded
      if (entry.storagePath) {
        const supabase = createClient();
        await supabase.storage.from('child-photos').remove([entry.storagePath]);
      }

      URL.revokeObjectURL(entry.previewUrl);
      onPhotosChange(photos.filter((p) => p.id !== entryId));
    },
    [photos, onPhotosChange]
  );

  const handleRetry = useCallback(
    (entryId: string) => {
      const entry = photos.find((p) => p.id === entryId);
      if (!entry) return;

      onPhotosChange(photos.map((p) => (p.id === entryId ? { ...p, status: 'uploading' as const } : p)));
      uploadFile(entry.file, entryId);
    },
    [photos, onPhotosChange, uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-gray-900">Add Photos</h2>
      <p className="mt-2 text-gray-600">
        Upload 1–3 photos of {childName}. Multiple angles help improve the likeness.
      </p>

      {/* Upload zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <svg
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Upload 1–3 photos of {childName}
          </p>
          <p className="mt-1 text-xs text-gray-400">JPEG, PNG, or WebP up to 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="mt-4 flex gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-lg border">
              <img
                src={photo.previewUrl}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />

              {/* Uploading overlay */}
              {photo.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg
                    className="h-6 w-6 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              )}

              {/* Error overlay */}
              {photo.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 border-red-500 bg-black/40">
                  <span className="text-lg text-red-400">⚠</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(photo.id);
                    }}
                    className="mt-1 text-xs font-medium text-white underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Remove button */}
              {photo.status !== 'uploading' && (
                <button
                  onClick={() => handleRemove(photo.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="flex-1 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
