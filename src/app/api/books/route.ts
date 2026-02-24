import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_THEMES = ['dinosaurs', 'ninjas', 'space', 'underwater', 'fairy_tale', 'superheroes'];

const THEME_DISPLAY_NAMES: Record<string, string> = {
  dinosaurs: 'Dinosaurs',
  ninjas: 'Ninjas',
  space: 'Space',
  underwater: 'Underwater',
  fairy_tale: 'Fairy Tale',
  superheroes: 'Superheroes',
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    child_name?: string;
    child_age?: number;
    theme?: string;
    photo_paths?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { child_name, child_age, theme, photo_paths } = body;

  // Validation
  if (!child_name || typeof child_name !== 'string' || child_name.length < 1 || child_name.length > 50) {
    return NextResponse.json(
      { error: 'child_name must be between 1 and 50 characters' },
      { status: 422 }
    );
  }

  if (!Number.isInteger(child_age) || child_age! < 1 || child_age! > 10) {
    return NextResponse.json(
      { error: 'child_age must be an integer between 1 and 10' },
      { status: 422 }
    );
  }

  if (!theme || !VALID_THEMES.includes(theme)) {
    return NextResponse.json(
      { error: 'theme must be one of: dinosaurs, ninjas, space, underwater, fairy_tale, superheroes' },
      { status: 422 }
    );
  }

  if (!Array.isArray(photo_paths) || photo_paths.length < 1 || photo_paths.length > 3) {
    return NextResponse.json(
      { error: 'photo_paths must contain between 1 and 3 entries' },
      { status: 422 }
    );
  }

  const title = `${child_name}'s ${THEME_DISPLAY_NAMES[theme]} Adventure`;

  // Insert book record
  const { data: book, error: insertError } = await supabase
    .from('books')
    .insert({
      user_id: user.id,
      title,
      theme,
      status: 'draft',
      is_paid: false,
      child_name,
      child_age,
      photo_paths: photo_paths, // temporarily store temp paths
    })
    .select('id, title, status')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Something went wrong. Your photos are saved — please try again.' },
      { status: 500 }
    );
  }

  // Move photos from temp to book folder
  const movedPaths: string[] = [];
  const failedMoves: string[] = [];

  for (const tempPath of photo_paths) {
    const filename = tempPath.split('/').pop()!;
    const newPath = `${user.id}/${book.id}/${filename}`;

    let moved = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error: copyError } = await supabase.storage
        .from('child-photos')
        .copy(tempPath, newPath);

      if (!copyError) {
        await supabase.storage.from('child-photos').remove([tempPath]);
        movedPaths.push(newPath);
        moved = true;
        break;
      }
    }

    if (!moved) {
      failedMoves.push(tempPath);
    }
  }

  // If any moves failed, rollback
  if (failedMoves.length > 0) {
    // Move successfully moved photos back to temp
    for (const movedPath of movedPaths) {
      const filename = movedPath.split('/').pop()!;
      const tempPath = `${user.id}/temp/${filename}`;
      await supabase.storage.from('child-photos').copy(movedPath, tempPath);
      await supabase.storage.from('child-photos').remove([movedPath]);
    }

    // Delete the book record
    await supabase.from('books').delete().eq('id', book.id);

    return NextResponse.json(
      { error: 'Something went wrong. Your photos are saved — please try again.' },
      { status: 500 }
    );
  }

  // Update book with final photo paths
  await supabase
    .from('books')
    .update({ photo_paths: movedPaths })
    .eq('id', book.id);

  return NextResponse.json(
    { data: { book_id: book.id, title: book.title, status: book.status } },
    { status: 201 }
  );
}
