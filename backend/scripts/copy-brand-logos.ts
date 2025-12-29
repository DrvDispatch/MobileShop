/**
 * Copy brand logos from _brand_logos to BrandLogos folder with correct naming
 * Run with: npx ts-node scripts/copy-brand-logos.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ASSETS_DIR = 'C:\\Users\\saidm\\MuhsinWeb\\assets';
const SOURCE_DIR = path.join(ASSETS_DIR, '_brand_logos', 'smartphone');
const TARGET_DIR = path.join(ASSETS_DIR, 'BrandLogos');

// Mapping from source filename to target filename
const logoMapping: Record<string, string> = {
    'apple.webp': 'Apple-logo-300x166.webp',
    'samsung.webp': 'Samsung-logo-300x166.webp',
    'xiaomi.webp': 'Xiaomi-logo-300x166.webp',
    'oneplus.webp': 'Oneplus-logo-300x166.webp',
    'oppo.webp': 'Oppo-logo-300x166.webp',
    'google.webp': 'Google-logo-300x166.webp',
    'huawei.webp': 'Huawei-logo-300x166.webp',
    'motorola.webp': 'Motorola-logo-300x166.webp',
    'nokia.webp': 'Nokia-logo-300x166.webp',
    'sony.webp': 'Sony-logo-300x166.webp',
    'fairphone.webp': 'Fairphone-logo-300x166.webp',
    'asus.webp': 'Asus-logo-300x166.webp',
    'cat.webp': 'Cat-logo-300x166.webp',
    'lenovo.webp': 'Lenovo-logo-300x166.webp',
};

async function main() {
    console.log('📁 Copying brand logos to BrandLogos folder...\n');
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`Target: ${TARGET_DIR}\n`);

    // Ensure target directory exists
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    let copied = 0;
    let skipped = 0;

    for (const [sourceFile, targetFile] of Object.entries(logoMapping)) {
        const sourcePath = path.join(SOURCE_DIR, sourceFile);
        const targetPath = path.join(TARGET_DIR, targetFile);

        if (!fs.existsSync(sourcePath)) {
            console.log(`⚠️  Missing source: ${sourceFile}`);
            skipped++;
            continue;
        }

        if (fs.existsSync(targetPath)) {
            console.log(`✓  Already exists: ${targetFile}`);
            skipped++;
            continue;
        }

        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copied: ${sourceFile} → ${targetFile}`);
        copied++;
    }

    console.log(`\n📊 Results: ${copied} copied, ${skipped} skipped`);
    console.log(`\n💡 Now run 'npx ts-node scripts/upload-assets.ts' to upload to MinIO`);
}

main().catch(console.error);
