import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Load API key from environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "❌ Missing GEMINI_API_KEY in .env.local. Please add it and restart the server."
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey, // ✅ securely injected here
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
