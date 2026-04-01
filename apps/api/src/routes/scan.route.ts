import { Router } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

export const scanRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type ParsedReceipt = {
  merchant?: string;
  date?: string;
  amount?: number;
  description?: string;
  type?: 'INCOME' | 'EXPENSE';
};

function getJakartaTodayString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return cleaned;
  }

  return cleaned.slice(start, end + 1);
}

function normalizeAmount(value: unknown) {
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) return 0;

    // Handle Indonesian thousand separators like "143.000" => 143000
    const normalized = trimmed
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeType(value: unknown): 'INCOME' | 'EXPENSE' {
  return value === 'INCOME' ? 'INCOME' : 'EXPENSE';
}

scanRouter.post('/', upload.single('receipt'), async (req, res, next) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const prompt = `
You are an elite receipt and financial document extraction engine.

TASK:
Analyze the uploaded image and return ONLY one raw JSON object.
Do not use markdown.
Do not wrap the JSON in backticks.
Do not add explanations.
Do not add commentary.

SUPPORTED DOCUMENT TYPES:
- shopping receipts
- restaurant receipts
- minimarket / grocery receipts
- transport / fuel receipts
- invoices / bills
- refund slips
- payout slips
- salary slips
- bank transfer proofs

OUTPUT JSON EXACTLY IN THIS SHAPE:
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "amount": number,
  "description": "short summary",
  "type": "EXPENSE"
}

STRICT RULES:
1. "amount" must be the final payable/received amount only.
2. For IDR / Rupiah:
   - dots (.) are thousand separators
   - "143.000" means 143000
   - remove currency symbols
3. "date" must be normalized to YYYY-MM-DD.
4. "description" must be a short natural summary of the main purchased items or document purpose, max 6 words.
5. "merchant" should be the best merchant/store/company name visible in the document.
6. "type":
   - use "EXPENSE" for normal receipts, shopping, food, groceries, bills, fuel, transport, retail, parking, pharmacy, subscriptions, and general spending
   - use "INCOME" only if the document clearly shows money RECEIVED, such as salary received, payout received, refund received, transfer received, cashback received
   - if uncertain, default to "EXPENSE"
7. If any field is missing, still return valid JSON with the best possible guess.
8. Never return null for "type". Default to "EXPENSE".
9. Be numerically precise.

RETURN ONLY JSON.
`.trim();

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
        temperature: 0.05,
      },
    });

    const outputText = response.text || '';
    const jsonText = extractJsonObject(outputText);

    let parsedData: ParsedReceipt;

    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      console.error('[scan] failed to parse Gemini output');
      return res
        .status(500)
        .json({ error: 'Failed to extract structured data from receipt.' });
    }

    const normalized: ParsedReceipt = {
      merchant: String(parsedData.merchant || '').trim(),
      date: parsedData.date,
      amount: normalizeAmount(parsedData.amount),
      description: String(parsedData.description || '').trim(),
      type: normalizeType(parsedData.type),
    };

    if (!normalized.date || Number.isNaN(new Date(normalized.date).getTime())) {
      normalized.date = getJakartaTodayString();
    }

    if (!normalized.merchant) {
      normalized.merchant = 'Unknown Merchant';
    }

    if (!normalized.description) {
      normalized.description = 'Scanned receipt';
    }

    return res.json(normalized);
  } catch (err) {
    console.error('[scan] OCR error:', err instanceof Error ? err.message : String(err));
    return next(err);
  }
});