import { fal } from '@fal-ai/client';
import { createServiceClient } from '@/lib/supabase/service';

const THEME_ART_STYLE: Record<string, string> = {
  dinosaurs:
    'Vibrant watercolor children\'s book, lush prehistoric jungle, warm greens and oranges',
  ninjas:
    'Clean ink-wash illustration, misty mountain dojo, muted blues and greys with red accents',
  space:
    'Gouache-style children\'s book, deep cosmic purples and blues, glowing stars and planets',
  underwater: 'Soft pastel illustration, coral reef setting, aqua and coral tones',
  fairy_tale:
    'Classic storybook illustration, enchanted forest, golden hour lighting, soft purples and greens',
  superheroes: 'Bold graphic novel style, bright primary colors, dynamic city backdrop',
};

const NEGATIVE_PROMPT =
  'ugly, deformed, blurry, watermark, signature, text, adult, scary, realistic photo, photographic';

export async function generateIllustrations(
  bookId: string,
  userId: string,
  book: { child_name: string; child_age: number; theme: string; photo_paths: string[] }
) {
  const supabase = createServiceClient();

  // Get pages that need illustrations (skip already complete ones for retry resume)
  const { data: pages, error } = await supabase
    .from('pages')
    .select('*')
    .eq('book_id', bookId)
    .neq('status', 'complete')
    .order('page_number', { ascending: true });

  if (error || !pages) {
    throw new Error('Failed to fetch pages for illustration');
  }

  if (pages.length === 0) return; // All pages already illustrated

  // Get signed URLs for the reference face photos
  const faceImageUrls: string[] = [];
  for (const photoPath of book.photo_paths) {
    const { data: signedData } = await supabase.storage
      .from('child-photos')
      .createSignedUrl(photoPath, 3600); // 1 hour expiry

    if (signedData?.signedUrl) {
      faceImageUrls.push(signedData.signedUrl);
    }
  }

  if (faceImageUrls.length === 0) {
    throw new Error('No valid face reference photos found');
  }

  const artStyle = THEME_ART_STYLE[book.theme] || 'Children\'s book illustration, soft lighting';

  // Generate illustration for each page sequentially
  for (const page of pages) {
    const prompt = `${artStyle}, a young child named ${book.child_name} aged ${book.child_age}, ${page.text}, children's book illustration, soft lighting, high detail, no text`;

    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Call fal.ai ip-adapter-face-id with the plus model variant
        const result = await fal.subscribe('fal-ai/ip-adapter-face-id', {
          input: {
            prompt,
            face_image_url: faceImageUrls[0],
            negative_prompt: NEGATIVE_PROMPT,
            model_type: '1_5-v1-plus' as const,
            num_samples: 1,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width: 768,
            height: 768,
          },
        });

        const imageUrl = (result.data as { image?: { url?: string } })?.image?.url;
        if (!imageUrl) {
          throw new Error('No image URL in fal.ai response');
        }

        // Download the generated image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download generated image: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();

        // Upload to Supabase Storage
        const illustrationPath = `${userId}/${bookId}/illustrations/page_${page.page_number}.png`;
        const { error: uploadError } = await supabase.storage
          .from('child-photos')
          .upload(illustrationPath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload illustration: ${uploadError.message}`);
        }

        // Update page record
        const { error: updateError } = await supabase
          .from('pages')
          .update({
            illustration_url: illustrationPath,
            status: 'complete',
          })
          .eq('id', page.id);

        if (updateError) {
          throw new Error(`Failed to update page: ${updateError.message}`);
        }

        lastError = null;
        break; // Success, move to next page
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    // If all retries exhausted for this page, mark as failed
    if (lastError) {
      await supabase.from('pages').update({ status: 'failed' }).eq('id', page.id);
      await supabase
        .from('books')
        .update({
          status: 'failed',
          error_message: `Illustration failed for page ${page.page_number}: ${lastError.message}`,
        })
        .eq('id', bookId);
      throw new Error(`Illustration failed for page ${page.page_number}: ${lastError.message}`);
    }
  }
}
