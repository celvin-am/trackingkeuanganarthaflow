import { Router } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

export const scanRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

scanRouter.post('/', upload.single('receipt'), async (req, res, next) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const prompt = `
      You are an expert financial receipt analyzer. Support all languages, especially Indonesian.
      Analyze the image and return ONLY a raw JSON object.
      No markdown, no preamble, no explanation.

      RULES FOR NUMBERS:
      - TOTAL AMOUNT: extract the final "Grand Total" or "Total".
      - If currency is IDR (Rp), dots (.) are thousand separators.
      - "143.000" must become 143000.
      - Return "amount" as a pure number without currency symbols.

      JSON STRUCTURE:
      {
        "merchant": "string",
        "date": "YYYY-MM-DD",
        "amount": number,
        "description": "3-word summary of items"
      }
    `;

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
        temperature: 0.1,
      },
    });

    const outputText = response.text || '';
    const cleanedText = outputText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData: {
      merchant?: string;
      date?: string;
      amount?: number;
      description?: string;
    };

    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      console.error('Failed to parse Gemini output:', cleanedText);
      return res.status(500).json({ error: 'Failed to extract structured data from receipt.' });
    }

    if (!parsedData.date || Number.isNaN(new Date(parsedData.date).getTime())) {
      parsedData.date = new Date().toISOString().split('T')[0];
    }

    if (typeof parsedData.amount !== 'number') {
      parsedData.amount = Number(parsedData.amount || 0);
    }

    res.json(parsedData);
  } catch (err) {
    console.error('OCR Error:', err);
    next(err);
  }
});