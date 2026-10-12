import fs from 'node:fs';

const img1 = fs.readFileSync('/home/nikhil/EduFlash/test_diagram.png').toString('base64');
const img2 = fs.readFileSync('/home/nikhil/EduFlash/test_diagram_part2.png').toString('base64');

console.log('Testing multi-image generation (Image 1: Handshake, Image 2: Teardown)...');
const startTime = Date.now();

try {
  const res = await fetch('http://localhost:8787/api/generate-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [
        { imageBase64: img1, mimeType: 'image/png' },
        { imageBase64: img2, mimeType: 'image/png' },
      ],
    }),
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Status: ${res.status} (took ${duration}s)`);

  const data = await res.json();
  console.log('Image count processed:', data.imageCount);
  console.log('Cards returned:', data.cards?.length);
  console.log('Cards sample:', JSON.stringify(data.cards, null, 2));
} catch (e) {
  console.error('Multi-image test failed:', e);
}
