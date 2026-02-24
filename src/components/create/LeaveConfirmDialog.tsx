'use client';

export function LeaveConfirmDialog({
  open,
  onLeave,
  onStay,
}: {
  open: boolean;
  onLeave: () => void;
  onStay: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Leave?</h2>
        <p className="mt-2 text-sm text-gray-600">Your progress will be lost.</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Leave
          </button>
          <button
            onClick={onStay}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}
