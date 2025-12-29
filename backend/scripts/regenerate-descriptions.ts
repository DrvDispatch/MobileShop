/**
 * Regenerate Long Descriptions with Gemini
 * 
 * Updates existing products with detailed ~500 token descriptions.
 * Run with: npx tsx scripts/regenerate-descriptions.ts
 */

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || '' });

const BATCH_SIZE = 3;
const DELAY_MS = 500;

async function generateLongDescription(product: { name: string; brand: string | null; storage: string | null; condition: string }): Promise<string> {
    const prompt = `You are a professional copywriter for a premium refurbished smartphone store in Belgium.

Write a DETAILED product description for: ${product.name}

Requirements:
- Write approximately 400-500 words (around 500 tokens)
- Use professional but friendly tone
- Include 4-5 paragraphs covering:
  
**Paragraph 1 - Introduction (2-3 sentences)**
Introduce the device and its key selling points. Mention this is a Grade A refurbished unit.

**Paragraph 2 - Display & Design (3-4 sentences)**
Describe the display technology, size, resolution, and build quality.

**Paragraph 3 - Performance & Camera (4-5 sentences)**
Detail the processor, RAM, camera specs (main/ultrawide/telephoto if applicable), video capabilities.

**Paragraph 4 - Battery & Features (3-4 sentences)**
Mention battery capacity, fast charging, wireless charging, 5G support, Face ID/fingerprint.

**Paragraph 5 - What's Included & Warranty (2-3 sentences)**
Explain it includes device + charging cable, 12-month warranty, SIM-free unlocked for all networks.

Storage: ${product.storage || '256GB'}
Condition: Grade A Refurbished (Excellent condition, minimal signs of use)

Write in English. Do NOT use markdown formatting, bullet points, or headers. Just plain paragraphs.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response.text || '';

        // Clean up any markdown that might have slipped through
        return text
            .replace(/\*\*/g, '')
            .replace(/#{1,6}\s/g, '')
            .replace(/^\s*[-*]\s/gm, '')
            .trim();
    } catch (error) {
        console.error(`  ⚠️ Error generating for ${product.name}:`, (error as Error).message);
        return '';
    }
}

async function main() {
    console.log('🔄 Regenerating Long Descriptions with Gemini\n');
    console.log('━'.repeat(60) + '\n');

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
        console.error('❌ GOOGLE_GEMINI_API_KEY not set');
        return;
    }

    // Get all products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            brand: true,
            storage: true,
            condition: true,
            description: true,
        },
        orderBy: { sortOrder: 'asc' },
    });

    console.log(`📱 Found ${products.length} products to update\n`);

    let updated = 0;
    let failed = 0;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

        const promises = batch.map(async (product) => {
            console.log(`  🔄 ${product.name}...`);

            const newDescription = await generateLongDescription(product);

            if (newDescription && newDescription.length > 200) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { description: newDescription },
                });
                console.log(`  ✅ ${product.name} (${newDescription.length} chars)`);
                return true;
            } else {
                console.log(`  ❌ ${product.name} - description too short or empty`);
                return false;
            }
        });

        const results = await Promise.all(promises);
        updated += results.filter(r => r).length;
        failed += results.filter(r => !r).length;

        // Rate limiting
        if (i + BATCH_SIZE < products.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log('\n' + '━'.repeat(60));
    console.log(`\n✅ COMPLETE!`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Failed: ${failed} products\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
