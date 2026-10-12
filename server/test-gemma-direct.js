import 'dotenv/config';
import fs from 'node:fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const imageBuffer = fs.readFileSync('/home/nikhil/EduFlash/test_diagram.png');
const imageBase64 = imageBuffer.toString('base64');

console.log('Testing direct call to gemma-4-26b-a4b-it...');
const start = Date.now();

try {
  const response = await ai.models.generateContent({
    model: 'gemma-4-26b-a4b-it',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: 'Generate flashcards from this image. Output JSON array.' },
        ],
      },
    ],
  });
  console.log(`Success in ${((Date.now() - start) / 1000).toFixed(2)}s!`);
  console.log('Response text:', response.text?.slice(0, 300));
} catch (e) {
  console.log(`Failed in ${((Date.now() - start) / 1000).toFixed(2)}s:`, e.message);
}
