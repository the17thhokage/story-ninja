'use client';

const STEPS = ['About Your Child', 'Add Photos', 'Pick a Theme'];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-8 ${isCompleted || isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isActive
                      ? 'border-2 border-blue-600 text-blue-600'
                      : 'border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-sm ${isActive ? 'font-medium text-blue-600' : isCompleted ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
