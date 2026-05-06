import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\Cevat\\.gemini\\antigravity\\brain\\34c8c192-8721-403b-b488-25d3aa214898\\.system_generated\\logs\\overview.txt';
const fileContent = fs.readFileSync(logPath, 'utf8');
const firstLine = fileContent.split('\n')[0];

try {
  const json = JSON.parse(firstLine);
  fs.writeFileSync('scratch/full_code_review.md', json.content, 'utf8');
  console.log('Successfully extracted full code review to scratch/full_code_review.md');
} catch (e) {
  console.error('Failed to parse JSON:', e);
}
