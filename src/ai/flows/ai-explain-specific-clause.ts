'use server';
/**
 * @fileOverview Provides a plain-language explanation of a specific clause or section within a legal document.
 *
 * - aiExplainSpecificClause - A function that handles the explanation of a specific clause.
 * - AIExplainSpecificClauseInput - The input type for the aiExplainSpecificClause function.
 * - AIExplainSpecificClauseOutput - The return type for the aiExplainSpecificClause function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIExplainSpecificClauseInputSchema = z.object({
  documentText: z
    .string()
    .describe('The complete text content of the legal document.'),
  clause: z
    .string()
    .describe('The specific clause or section to be explained.'),
});
export type AIExplainSpecificClauseInput = z.infer<typeof AIExplainSpecificClauseInputSchema>;

const AIExplainSpecificClauseOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A clear, plain-language explanation of the clause.'),
});
export type AIExplainSpecificClauseOutput = z.infer<typeof AIExplainSpecificClauseOutputSchema>;

export async function aiExplainSpecificClause(
  input: AIExplainSpecificClauseInput
): Promise<AIExplainSpecificClauseOutput> {
  return aiExplainSpecificClauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiExplainSpecificClausePrompt',
  input: {schema: AIExplainSpecificClauseInputSchema},
  output: {schema: AIExplainSpecificClauseOutputSchema},
  prompt: `You are an expert legal professional skilled at explaining legal jargon to the lay person.

  Based on the legal document provided and the specific clause or section selected, provide a clear and concise explanation of the clause in plain language.

  Legal Document: {{{documentText}}}

  Clause/Section: {{{clause}}}
  `,
});

const aiExplainSpecificClauseFlow = ai.defineFlow(
  {
    name: 'aiExplainSpecificClauseFlow',
    inputSchema: AIExplainSpecificClauseInputSchema,
    outputSchema: AIExplainSpecificClauseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
