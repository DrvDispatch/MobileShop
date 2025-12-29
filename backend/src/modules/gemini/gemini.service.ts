import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// Response types
export interface ProductContent {
    title: string;
    shortDescription: string;
    longDescription: string;
    seoKeywords: string[];
    suggestedImages: { url: string; alt: string }[];
}

export interface ImageAnalysis {
    detectedColor: string;
    conditionAssessment: string;
    detectedStorage?: string;
    detectedModel?: string;
    confidence: number;
    notes?: string;
}

export interface GenerateProductInput {
    modelName: string;
    condition: 'NEW' | 'USED' | 'REFURBISHED';
    brand: string;
    category?: string;
}

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private readonly ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.warn('GOOGLE_GEMINI_API_KEY not set - Gemini features will be disabled');
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    }

    /**
     * Generate product content using Gemini 3 Flash with Google Search grounding
     */
    async generateProductContent(input: GenerateProductInput): Promise<ProductContent> {
        const { modelName, condition, brand, category } = input;

        const prompt = `You are an e-commerce product specialist. Generate SEO-optimized product listing content.

<task>
Create product content for:
- Device: ${modelName}
- Brand: ${brand}
- Condition: ${condition}
${category ? `- Category: ${category}` : ''}

Use Google Search to find:
1. Official product specifications and features
2. High-quality product image URLs from PUBLICLY ACCESSIBLE sources
</task>

<constraints>
1. Title: Max 60 characters. Format: "{Brand} {Model} {Storage} [{Condition if not NEW}]"
   - NEVER include words like "Smartphone", "Mobile Phone", "Cellphone" in the title
   - Examples: "iPhone 16 Pro Max 256GB Refurbished", "Samsung Galaxy S24 Ultra 512GB"
2. Short description: 2-3 sentences about condition, key features, and what's included. Must mention it's been tested/inspected if refurbished.
3. Long description: 4-5 detailed paragraphs with comprehensive technical specifications including:
   - Paragraph 1: Design, build materials (e.g., titanium, glass), dimensions, weight
   - Paragraph 2: Display specs (size, resolution, technology, refresh rate, brightness)
   - Paragraph 3: Processor, RAM, storage options, performance benchmarks (e.g., A18 Pro, 6-core GPU)
   - Paragraph 4: Camera system (all sensors, megapixels, aperture, video capabilities like 4K 120fps)
   - Paragraph 5: Battery capacity (mAh), charging speeds, connectivity (5G, WiFi 6E, USB-C)
   Include actual numbers and specifications, not vague descriptions.
4. Only include verified information from search results
5. For images: IMPORTANT - Only return image URLs from these trusted PUBLIC sources:
   - GSMArena (gsmarena.com)
   - Amazon product pages (images-na.ssl-images-amazon.com or m.media-amazon.com)
   - iStock or stock photo sites
   - Wikimedia Commons
   - Device manufacturer press releases
   DO NOT use Apple's internal CDN URLs (store.storeimages.cdn-apple.com) as they don't work publicly
6. Verify that image URLs are direct links to .jpg, .png, or .webp files
</constraints>

<output_format>
Return valid JSON matching this exact schema:
{
  "title": "string - clean product title WITHOUT 'Smartphone' word",
  "shortDescription": "string - 2-3 sentence summary mentioning condition and key features",
  "longDescription": "string - detailed description with specs",
  "seoKeywords": ["array", "of", "keywords"],
  "suggestedImages": [
    { "url": "https://...", "alt": "description" }
  ]
}
</output_format>`;

        try {
            this.logger.log(`[Gemini] Calling generateContent with model: gemini-3-flash-preview`);
            this.logger.log(`[Gemini] Input: modelName=${modelName}, brand=${brand}, condition=${condition}`);
            this.logger.log(`[Gemini] API Key present: ${!!process.env.GOOGLE_GEMINI_API_KEY}`);
            this.logger.log(`[Gemini] API Key length: ${process.env.GOOGLE_GEMINI_API_KEY?.length || 0}`);

            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: {
                        thinkingLevel: ThinkingLevel.HIGH,
                    },
                    responseMimeType: 'application/json',
                },
            });

            const text = response.text || '';
            this.logger.log(`[Gemini] Response received, length: ${text.length}`);
            this.logger.log(`[Gemini] Response preview: ${text.substring(0, 500)}...`);

            // Parse the JSON response
            const parsed = JSON.parse(text);

            return {
                title: parsed.title || `${brand} ${modelName}`,
                shortDescription: parsed.shortDescription || '',
                longDescription: parsed.longDescription || '',
                seoKeywords: parsed.seoKeywords || [],
                suggestedImages: parsed.suggestedImages || [],
            };
        } catch (error) {
            this.logger.error(`[Gemini] FAILED to generate product content`);
            this.logger.error(`[Gemini] Error name: ${error.name}`);
            this.logger.error(`[Gemini] Error message: ${error.message}`);
            if (error.response) {
                this.logger.error(`[Gemini] Response status: ${error.response.status}`);
                this.logger.error(`[Gemini] Response data: ${JSON.stringify(error.response.data)}`);
            }
            this.logger.error(`[Gemini] Full error stack: ${error.stack}`);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }

    /**
     * Analyze an uploaded device image to extract color, condition, etc.
     */
    async analyzeDeviceImage(
        imageBase64: string,
        mimeType: string,
        modelHint?: string,
    ): Promise<ImageAnalysis> {
        const prompt = `You are an expert mobile device analyst. Analyze this device image.

${modelHint ? `The user has indicated this is a: ${modelHint}` : 'Identify the device model if possible.'}

<task>
Examine this image and determine:
1. The exact color variant (e.g., "Desert Titanium", "Space Black", "Natural Titanium")
2. The visible condition (scratches, wear, screen condition)
3. Storage capacity if visible anywhere
4. Confirm or identify the device model
</task>

<output_format>
Return valid JSON:
{
  "detectedColor": "string - exact official color name",
  "conditionAssessment": "string - e.g., 'Excellent - no visible wear'",
  "detectedStorage": "string or null - e.g., '128GB'",
  "detectedModel": "string - full model name",
  "confidence": number 0-100,
  "notes": "string - any additional observations"
}
</output_format>`;

        try {
            this.logger.log(`[Gemini] Analyzing device image with model: gemini-3-flash-preview`);
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: imageBase64,
                                },
                            },
                        ],
                    },
                ],
                config: {
                    thinkingConfig: {
                        thinkingLevel: ThinkingLevel.HIGH,
                    },
                    responseMimeType: 'application/json',
                },
            });

            const text = response.text || '';
            this.logger.log(`Image analysis response: ${text.substring(0, 200)}...`);

            const parsed = JSON.parse(text);

            return {
                detectedColor: parsed.detectedColor || 'Unknown',
                conditionAssessment: parsed.conditionAssessment || 'Unable to assess',
                detectedStorage: parsed.detectedStorage || undefined,
                detectedModel: parsed.detectedModel || undefined,
                confidence: parsed.confidence || 50,
                notes: parsed.notes || undefined,
            };
        } catch (error) {
            this.logger.error('Failed to analyze image:', error);
            throw new Error(`Failed to analyze image: ${error.message}`);
        }
    }

    /**
     * Search for product images using Google Search grounding
     */
    async findProductImages(query: string): Promise<{ url: string; alt: string }[]> {
        const prompt = `Find high-quality official product images for: "${query}"

Search for PNG images with transparent backgrounds from official sources, press releases, or reputable retailers.

Return JSON array:
[
  { "url": "https://...", "alt": "description" }
]

Return 3-5 image URLs. Prioritize:
1. Official manufacturer images
2. Transparent background (PNG)
3. High resolution
4. Multiple angles if available`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: {
                        thinkingLevel: ThinkingLevel.HIGH,
                    },
                    responseMimeType: 'application/json',
                },
            });

            const text = response.text || '[]';
            return JSON.parse(text);
        } catch (error) {
            this.logger.error('Failed to find images:', error);
            return [];
        }
    }
}
