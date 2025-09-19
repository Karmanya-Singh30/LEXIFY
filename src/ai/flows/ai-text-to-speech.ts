'use server';
/**
 * @fileOverview Converts text to speech.
 *
 * - aiTextToSpeech - A function that handles converting text to speech.
 * - AITextToSpeechInput - The input type for the aiTextToSpeech function.
 * - AITextToSpeechOutput - The return type for the aiTextToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {googleAI} from '@genkit-ai/googleai';

const AITextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type AITextToSpeechInput = z.infer<typeof AITextToSpeechInputSchema>;

const AITextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The synthesized audio as a data URI.'),
});
export type AITextToSpeechOutput = z.infer<typeof AITextToSpeechOutputSchema>;

export async function aiTextToSpeech(input: AITextToSpeechInput): Promise<AITextToSpeechOutput> {
  return aiTextToSpeechFlow(input);
}

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      let bufs: any[] = [];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });
  
      writer.write(pcmData);
      writer.end();
    });
  }

const aiTextToSpeechFlow = ai.defineFlow(
  {
    name: 'aiTextToSpeechFlow',
    inputSchema: AITextToSpeechInputSchema,
    outputSchema: AITextToSpeechOutputSchema,
  },
  async ({text}) => {
    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: text,
      });
      if (!media) {
        throw new Error('no media returned');
      }
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

      return { audioDataUri };
  }
);
