'use server';
/**
 * @fileOverview An AI agent designed to extract text from an image.
 *
 * - aiExtractTextFromImage - A function that handles the process of extracting text from an image.
 * - AIExtractTextFromImageInput - The input type for the aiExtractTextFromImage function.
 * - AIExtractTextFromImageOutput - The return type for the aiExtractTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIExtractTextFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AIExtractTextFromImageInput = z.infer<typeof AIExtractTextFromImageInputSchema>;

const AIExtractTextFromImageOutputSchema = z.object({
  text: z.string().describe('The extracted text from the image.'),
});
export type AIExtractTextFromImageOutput = z.infer<typeof AIExtractTextFromImageOutputSchema>;

export async function aiExtractTextFromImage(input: AIExtractTextFromImageInput): Promise<AIExtractTextFromImageOutput> {
  return aiExtractTextFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiExtractTextFromImagePrompt',
  input: {schema: AIExtractTextFromImageInputSchema},
  output: {schema: AIExtractTextFromImageOutputSchema},
  prompt: `You are an OCR (Optical Character Recognition) service. Extract all text from the following image.
  Image: {{media url=imageDataUri}}
  `,
});

const aiExtractTextFromImageFlow = ai.defineFlow(
  {
    name: 'aiExtractTextFromImageFlow',
    inputSchema: AIExtractTextFromImageInputSchema,
    outputSchema: AIExtractTextFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    