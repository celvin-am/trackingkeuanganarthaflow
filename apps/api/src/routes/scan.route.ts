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
      You are an expert financial receipt analyzer. 
      Analyze this image of a receipt and extract the following information strictly in JSON format.
      Do not include any Markdown wrapping (like \`\`\`json). Just the raw JSON object.
      
      Required JSON structure:
      {
        "merchant": "Name of the store or merchant",
        "date": "Date of transaction in YYYY-MM-DD format (or leave empty if not found)",
        "amount": Total final amount as a number (extract carefully from 'Total' or equivalent),
        "description": "A short 3-word summary of what was bought based on items"
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
