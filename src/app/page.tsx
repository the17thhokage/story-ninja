import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { AuthActions } from '@/components/AuthActions';
import { DbHealthCheck } from '@/components/DbHealthCheck';

export default async function Home() {
  const user = await getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Story Ninja</h1>
        <p className="text-xl text-gray-600">
          A personalized storybook starring your child — in under 10 minutes.
        </p>
        <Link
          href="/create"
          className="rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Create Your Book
        </Link>
        <AuthActions user={user} />
        <DbHealthCheck />
      </main>
    </div>
  );
}
