import fs from 'node:fs';

const imageBuffer = fs.readFileSync('/home/nikhil/EduFlash/test_diagram.png');
const imageBase64 = imageBuffer.toString('base64');

console.log('Sending test_diagram.png to /api/generate-cards...');
const startTime = Date.now();

try {
  const res = await fetch('http://localhost:8787/api/generate-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      mimeType: 'image/png',
    }),
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Response status: ${res.status} (took ${duration}s)`);

  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
} catch (e) {
  console.error('Request failed:', e);
}
