'use client';

import { useState } from 'react';

interface StepChildDetailsProps {
  childName: string;
  childAge: number | null;
  onUpdate: (name: string, age: number | null) => void;
  onContinue: () => void;
}

export function StepChildDetails({ childName, childAge, onUpdate, onContinue }: StepChildDetailsProps) {
  const [nameError, setNameError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);

  const isNameValid = childName.length >= 1 && childName.length <= 50;
  const isAgeValid = childAge !== null && Number.isInteger(childAge) && childAge >= 1 && childAge <= 10;
  const canContinue = isNameValid && isAgeValid;

  function validateName() {
    setNameTouched(true);
    if (!childName || childName.length === 0) {
      setNameError("Please enter your child's name");
    } else if (childName.length > 50) {
      setNameError('Name must be 50 characters or less');
    } else {
      setNameError(null);
    }
  }

  function validateAge() {
    setAgeTouched(true);
    if (childAge === null) {
      setAgeError("Please enter your child's age");
    } else if (!Number.isInteger(childAge) || childAge < 1 || childAge > 10) {
      setAgeError('Age must be between 1 and 10');
    } else {
      setAgeError(null);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-gray-900">Let&apos;s meet the hero of the story</h2>
      <p className="mt-2 text-gray-600">Tell us a bit about your little adventurer.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="childName" className="block text-sm font-medium text-gray-700">
            Child&apos;s name
          </label>
          <input
            id="childName"
            type="text"
            value={childName}
            onChange={(e) => {
              onUpdate(e.target.value, childAge);
              if (nameTouched) {
                if (e.target.value.length >= 1 && e.target.value.length <= 50) {
                  setNameError(null);
                }
              }
            }}
            onBlur={validateName}
            maxLength={50}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
              nameError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="e.g., Mia"
          />
          {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="childAge" className="block text-sm font-medium text-gray-700">
            Child&apos;s age
          </label>
          <input
            id="childAge"
            type="number"
            value={childAge ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
              onUpdate(childName, val);
              if (ageTouched && val !== null && val >= 1 && val <= 10) {
                setAgeError(null);
              }
            }}
            onBlur={validateAge}
            min={1}
            max={10}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
              ageError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="1–10"
          />
          {ageError && <p className="mt-1 text-sm text-red-600">{ageError}</p>}
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="mt-6 w-full rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
