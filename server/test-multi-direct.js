import 'dotenv/config';
import fs from 'node:fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const img1 = fs.readFileSync('/home/nikhil/EduFlash/test_diagram.png').toString('base64');
const img2 = fs.readFileSync('/home/nikhil/EduFlash/test_diagram_part2.png').toString('base64');

console.log('Testing 2-image generation with gemma-4-26b-a4b-it without schema...');
const start = Date.now();

try {
  const response = await ai.models.generateContent({
    model: 'gemma-4-26b-a4b-it',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: img1 } },
          { inlineData: { mimeType: 'image/png', data: img2 } },
          {
            text: `Analyze both images (Image 1: TCP Handshake, Image 2: TCP Teardown).
Generate 6 to 10 active-recall flashcards.
MANDATORY:
1. At least 1 card for Image 1.
2. At least 1 card for Image 2.
3. At least 2 cards testing the relationship and sequence between Image 1 and Image 2.
Output raw JSON array with schema: [{"front":"...","back":"...","tag":"...","difficulty":"easy|medium|hard"}]`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Success in ${duration}s!`);
  console.log('Result sample:', response.text?.slice(0, 500));
} catch (e) {
  console.error(`Failed in ${((Date.now() - start) / 1000).toFixed(2)}s:`, e.message);
}
