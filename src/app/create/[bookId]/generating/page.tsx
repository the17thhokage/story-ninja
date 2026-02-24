export default async function GeneratingPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <h1 className="mt-6 text-2xl font-bold">Generating your story...</h1>
        <p className="mt-2 text-gray-600">Book ID: {bookId}</p>
        <p className="mt-1 text-sm text-gray-400">This may take a few minutes.</p>
      </div>
    </div>
  );
}
