'use client';

import type { BookTheme } from '@/types/database';

const THEMES: { value: BookTheme; name: string; descriptor: string; emoji: string }[] = [
  { value: 'dinosaurs', name: 'Dinosaurs', descriptor: 'Roar through a prehistoric jungle', emoji: '🦕' },
  { value: 'ninjas', name: 'Ninjas', descriptor: 'Master the ancient art of stealth', emoji: '🥷' },
  { value: 'space', name: 'Space', descriptor: 'Blast off to the stars', emoji: '🚀' },
  { value: 'underwater', name: 'Underwater', descriptor: 'Dive into the deep ocean', emoji: '🐠' },
  { value: 'fairy_tale', name: 'Fairy Tale', descriptor: 'Enter an enchanted kingdom', emoji: '🏰' },
  { value: 'superheroes', name: 'Superheroes', descriptor: 'Save the city from danger', emoji: '🦸' },
];

interface StepThemePickerProps {
  selectedTheme: BookTheme | null;
  onThemeSelect: (theme: BookTheme) => void;
  onCreateBook: () => void;
  isCreating: boolean;
  error: string | null;
  onBack: () => void;
}

export function StepThemePicker({
  selectedTheme,
  onThemeSelect,
  onCreateBook,
  isCreating,
  error,
  onBack,
}: StepThemePickerProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900">What kind of adventure?</h2>
      <p className="mt-2 text-gray-600">Pick a theme your child will love.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.value;
          return (
            <button
              key={theme.value}
              onClick={() => !isCreating && onThemeSelect(theme.value)}
              disabled={isCreating}
              className={`relative flex flex-col items-center rounded-lg border-2 p-4 text-center transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${isCreating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-3xl">{theme.emoji}</span>
              <span className="mt-2 font-medium text-gray-900">{theme.name}</span>
              <span className="mt-1 text-xs text-gray-500">{theme.descriptor}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex-1 rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onCreateBook}
          disabled={!selectedTheme || isCreating}
          className="flex-1 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating your book…
            </span>
          ) : (
            'Create My Book'
          )}
        </button>
      </div>
    </div>
  );
}
