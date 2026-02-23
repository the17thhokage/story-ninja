'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SignIn } from '@/components/SignIn';

export function AuthActions({ user }: { user: User | null }) {
  const [showSignIn, setShowSignIn] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (user) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{user.email}</span>
        <button onClick={handleSignOut} className="text-blue-600 hover:text-blue-500 underline">
          Sign out
        </button>
      </div>
    );
  }

  if (showSignIn) {
    return (
      <div className="w-full">
        <SignIn />
        <button
          onClick={() => setShowSignIn(false)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowSignIn(true)}
      className="text-sm text-blue-600 hover:text-blue-500 underline"
    >
      Sign in
    </button>
  );
}
