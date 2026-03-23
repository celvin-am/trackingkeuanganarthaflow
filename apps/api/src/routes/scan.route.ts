import { Router } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { env } from '../lib/env.js';

export const scanRouter = Router();

// Configure multer for memory storage (we just need the buffer to send to Gemini)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

scanRouter.post('/', upload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Prepare generative prompt
    const prompt = `
      You are an expert financial receipt analyzer. Support all languages (especially Indonesian).
      Analyze the image and extract ONLY a raw JSON object. No Markdown, no preamble.

      RULES FOR NUMBERS:
      - TOTAL AMOUNT: Extract the final "Grand Total" or "Total".
      - If currency is IDR (Rp), dots (.) are THOUSAND separators. "143.000" MUST be 143000.
      - Return "amount" as a pure NUMBER without dots or currency symbols.

      JSON STRUCTURE:
      {
        "merchant": "string",
        "date": "YYYY-MM-DD",
        "amount": number,
        "description": "3-word summary of items"
      }
    `;

    // Process via Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1, // Keep it deterministic for JSON extraction
      }
    });

    const outputText = response.text || '';

    // Clean potential markdown blocks if Gemini ignored the prompt
    const cleanedText = outputText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse Gemini output:', cleanedText);
      return res.status(500).json({ error: 'Failed to extract structured data from receipt.' });
    }

    // Smart Date Parser: Fallback to current date if missing or invalid
    if (!parsedData.date || isNaN(new Date(parsedData.date).getTime())) {
      parsedData.date = new Date().toISOString().split('T')[0];
    }

    res.json(parsedData);
  } catch (err: any) {
    console.error('OCR Error:', err);
    next(err);
  }
});
