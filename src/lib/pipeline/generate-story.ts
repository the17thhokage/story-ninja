import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';

const THEME_CONTEXT: Record<string, string> = {
  dinosaurs: 'prehistoric jungle with friendly dinosaurs',
  ninjas: 'mystical mountain dojo with ninja training',
  space: 'cosmic adventure through stars and planets',
  underwater: 'magical coral reef beneath the ocean',
  fairy_tale: 'enchanted forest with fairy tale creatures',
  superheroes: 'bustling city where heroes save the day',
};

const storySchema = z.object({
  pages: z.array(
    z.object({
      page_number: z.number(),
      text: z.string(),
    })
  ),
});

export async function generateStory(
  bookId: string,
  book: { child_name: string; child_age: number; theme: string }
) {
  const supabase = createServiceClient();
  const themeContext = THEME_CONTEXT[book.theme] || book.theme;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { object: story } = await generateObject({
        model: openai('gpt-4o'),
        schema: storySchema,
        prompt: `Write a personalized children's storybook for a child named ${book.child_name}, age ${book.child_age}.

Theme/setting: ${themeContext}

Requirements:
- Generate exactly 10 pages
- Each page should have 2-4 sentences
- ${book.child_name} is the hero of the story
- Use vocabulary appropriate for a ${book.child_age}-year-old
- Maintain a warm, encouraging storybook tone throughout
- Weave the ${book.theme} theme naturally into every page
- Include a clear beginning, middle, and end
- End with a positive, uplifting conclusion
- Each page should work as a standalone illustration scene

Return pages numbered 1 through 10.`,
      });

      // Insert pages into database
      for (const page of story.pages) {
        const { error } = await supabase.from('pages').insert({
          book_id: bookId,
          page_number: page.page_number,
          text: page.text,
          status: 'text_ready',
        });

        if (error) {
          throw new Error(`Failed to insert page ${page.page_number}: ${error.message}`);
        }
      }

      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // All retries exhausted
  await supabase
    .from('books')
    .update({
      status: 'failed',
      error_message: `Story generation failed: ${lastError?.message}`,
    })
    .eq('id', bookId);

  throw lastError || new Error('Story generation failed after retries');
}
