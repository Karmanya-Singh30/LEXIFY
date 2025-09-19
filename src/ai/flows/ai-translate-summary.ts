'use server';

/**
 * @fileOverview Translates the summary text of a legal document into multiple languages.
 *
 * - translateSummary - A function that translates the summary text.
 * - TranslateSummaryInput - The input type for the translateSummary function.
 * - TranslateSummaryOutput - The return type for the translateSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateSummaryInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z.string().describe('The target language for translation.'),
});
export type TranslateSummaryInput = z.infer<typeof TranslateSummaryInputSchema>;

const TranslateSummaryOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateSummaryOutput = z.infer<typeof TranslateSummaryOutputSchema>;

export async function translateSummary(input: TranslateSummaryInput): Promise<TranslateSummaryOutput> {
  return translateSummaryFlow(input);
}

const translateSummaryPrompt = ai.definePrompt({
  name: 'translateSummaryPrompt',
  input: {schema: TranslateSummaryInputSchema},
  output: {schema: TranslateSummaryOutputSchema},
  prompt: `Translate the following text into {{{language}}}:\n\n{{{text}}}`,
});

const translateSummaryFlow = ai.defineFlow(
  {
    name: 'translateSummaryFlow',
    inputSchema: TranslateSummaryInputSchema,
    outputSchema: TranslateSummaryOutputSchema,
  },
  async input => {
    const {output} = await translateSummaryPrompt(input);
    return output!;
  }
);
