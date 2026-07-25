// To run this code you need to install the following dependencies:
// npm install @google/genai mime

import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';

// Gemini API key is read from the environment (see .env.example)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Solve a captcha image using Gemini.
 * @param {string} imagePath - Absolute path to the captcha image file.
 * @returns {Promise<string>} The detected captcha text (case-sensitive).
 */
export async function solveCaptcha(imagePath) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Initialize the Gemini AI client
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // Make sure the file exists
  await fs.access(imagePath);

  // Upload the file to Gemini
  console.log('Uploading captcha image to Gemini...');
  const files = [
    await ai.files.upload({ file: imagePath }),
  ];

  const config = {
    responseMimeType: 'text/plain',
  };

  // Use the experimental model that has free quota
  const model = 'gemini-2.5-pro-exp-03-25';

  // Create conversation with example to guide the model
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Analyze the provided CAPTCHA image. These images are designed to be difficult for bots, often containing distorted, overlapping, or obscured characters. Focus on maximum accuracy in identifying the character sequence.`,
        },
      ],
    },
    {
      role: 'user',
      parts: [
        {
          fileData: {
            fileUri: files[0].uri,
            mimeType: files[0].mimeType,
          }
        },
        {
          // Acknowledges difficulty, reinforces constraints
          text: `Carefully transcribe the sequence of characters in the provided CAPTCHA image. Pay close attention to case sensitivity and potential distortions or merging of characters. Output the identified sequence as a single string with no additional text or explanation.`,
        },
      ],
    },
  ];

  // Get response from Gemini
  console.log('Requesting captcha solution from Gemini...');
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  let fullResponse = '';
  for await (const chunk of response) {
    if (chunk && chunk.text) {
      fullResponse += chunk.text;
    }
  }

  if (!fullResponse) {
    throw new Error('No text returned from Gemini API');
  }

  // Clean response (remove backticks and whitespace)
  const cleanResult = fullResponse.replace(/[`'"]/g, '').trim();
  console.log(`Detected captcha text: "${cleanResult}"`);
  return cleanResult;
}

// CLI usage: node solve-captcha.js [path/to/captcha.jpg]
async function main() {
  try {
    // Use the NSSF REGISTRATION subfolder path by default
    const candidates = process.argv[2]
      ? [process.argv[2]]
      : [
        path.join(process.cwd(), 'NSSF REGISTRATION', 'kaptcha.jpg'),
        path.join(process.cwd(), 'kaptcha.jpg'),
      ];

    let finalPath = null;
    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        finalPath = candidate;
        console.log(`File found at: ${finalPath}`);
        break;
      } catch {
        // try next candidate
      }
    }

    if (!finalPath) {
      console.error('Error: File not found.');
      console.error(`Tried:\n- ${candidates.join('\n- ')}`);
      console.error('Please make sure the captcha image exists in one of these locations');
      return;
    }

    const result = await solveCaptcha(finalPath);
    console.log('--------------------------------');
    console.log(`Final captcha text: "${result}"`);
    console.log('Use this text for the NSSF registration captcha');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.message.includes('429')) {
      console.error('This is a rate limit error. You may need to wait before trying again.');
    }
  }
}

// Run the main function only when executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(console.error);
}
