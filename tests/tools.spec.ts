import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_PDF = path.resolve(__dirname, 'test.pdf');
const TEST_IMAGE = path.resolve(__dirname, 'test.png');

test.describe('Homepage', () => {
  test('should load and display tool cards', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('h1')).toContainText('Free Online PDF & Image Tools');
    const cards = page.locator('a[href*="/tools/"]');
    await expect(cards).toHaveCount(15);
  });

  test('should switch language to Chinese', async ({ page }) => {
    await page.goto('/en');
    await page.click('button:has-text("中文")');
    await expect(page).toHaveURL(/\/zh/);
    await expect(page.locator('h1')).toContainText('免费在线PDF和图片工具');
  });
});

test.describe('Compress PDF', () => {
  test('should upload PDF and compress it', async ({ page }) => {
    await page.goto('/en/tools/compress-pdf');
    await expect(page.locator('h1')).toContainText('Compress PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    await expect(page.locator('text=test.pdf')).toBeVisible();
    await expect(page.locator('input[type="range"]')).toBeVisible();

    await page.click('button:has-text("Compress PDF")');

    await expect(page.locator('text=smaller')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });
});

test.describe('Merge PDF', () => {
  test('should upload multiple PDFs and merge', async ({ page }) => {
    await page.goto('/en/tools/merge-pdf');
    await expect(page.locator('h1')).toContainText('Merge PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_PDF, TEST_PDF]);

    // Should show thumbnail grid with file cards
    await expect(page.locator('text=test.pdf').first()).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Merge PDF")');

    await expect(page.locator('text=merged successfully')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });
});

test.describe('Split PDF', () => {
  test('should upload PDF and split by pages', async ({ page }) => {
    await page.goto('/en/tools/split-pdf');
    await expect(page.locator('h1')).toContainText('Split PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    // File info should be visible
    await expect(page.locator('text=test.pdf')).toBeVisible();
    // Default mode is "split by page"
    await page.click('button:has-text("Split PDF")');

    await expect(page.locator('text=Split into')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('button:has-text("Download All")')).toBeVisible();
  });

  test('should support split by interval', async ({ page }) => {
    await page.goto('/en/tools/split-pdf');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    await expect(page.locator('text=test.pdf')).toBeVisible();

    // Switch to interval mode
    await page.click('button:has-text("Fixed Interval")');
    await expect(page.locator('text=Pages per file')).toBeVisible();
  });
});

test.describe('Rotate PDF', () => {
  test('should upload PDF and show page thumbnails', async ({ page }) => {
    await page.goto('/en/tools/rotate-pdf');
    await expect(page.locator('h1')).toContainText('Rotate PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    // Wait for thumbnails to load
    await expect(page.locator('text=Click pages to rotate individually')).toBeVisible({ timeout: 15000 });

    // Click "All" to rotate all pages
    await page.click('button:has-text("All")');

    // Now the rotate button should be enabled
    await page.click('button:has-text("Rotate PDF")');

    await expect(page.locator('button:has-text("Download")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Remove Pages', () => {
  test('should upload PDF and select pages for removal', async ({ page }) => {
    await page.goto('/en/tools/remove-pages');
    await expect(page.locator('h1')).toContainText('Remove Pages');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    // Wait for page thumbnails to load
    await expect(page.locator('text=Click pages to select for removal')).toBeVisible({ timeout: 15000 });

    // Click first page thumbnail to select it
    const firstPage = page.locator('[class*="cursor-pointer"]').first();
    await firstPage.click();

    // Should show pages to remove count
    await expect(page.locator('text=Pages to remove')).toBeVisible();

    // Click remove button
    await page.click('button:has-text("Remove Pages")');

    await expect(page.locator('button:has-text("Download")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('PDF to Image', () => {
  test('should upload PDF and convert to images', async ({ page }) => {
    await page.goto('/en/tools/pdf-to-image');
    await expect(page.locator('h1')).toContainText('PDF to Image');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    // File info should be visible
    await expect(page.locator('text=test.pdf')).toBeVisible();

    // Click convert button
    await page.click('button:has-text("PDF to Image")');

    await expect(page.locator('button:has-text("Download All")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Image to PDF', () => {
  test('should upload images and convert to PDF', async ({ page }) => {
    await page.goto('/en/tools/image-to-pdf');
    await expect(page.locator('h1')).toContainText('Image to PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    // Should show image thumbnail with filename
    await expect(page.locator('text=test.png')).toBeVisible({ timeout: 10000 });

    // Click convert button
    await page.click('button:has-text("Image to PDF")');

    await expect(page.locator('text=converted to PDF')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });
});

test.describe('Add Watermark', () => {
  test('should upload PDF and add watermark', async ({ page }) => {
    await page.goto('/en/tools/add-watermark');
    await expect(page.locator('h1')).toContainText('Add Watermark');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    // Fill in watermark text
    const textInput = page.locator('input[type="text"]').first();
    await textInput.fill('CONFIDENTIAL');
    await page.click('button:has-text("Add Watermark")');

    await expect(page.locator('button:has-text("Download")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Add Page Numbers', () => {
  test('should upload PDF and add page numbers', async ({ page }) => {
    await page.goto('/en/tools/add-page-numbers');
    await expect(page.locator('h1')).toContainText('Add Page Numbers');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    // Should show the position grid and format options
    await expect(page.locator('text=Position')).toBeVisible({ timeout: 10000 });

    // Click the add page numbers button
    await page.click('button:has-text("Add Page Numbers")');

    await expect(page.locator('button:has-text("Download")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Encrypt PDF', () => {
  test('should upload PDF and encrypt with password', async ({ page }) => {
    await page.goto('/en/tools/encrypt-pdf');
    await expect(page.locator('h1')).toContainText('Encrypt PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    await page.fill('input[type="password"]', 'test123');
    await page.click('button:has-text("Encrypt PDF")');

    await expect(page.locator('button:has-text("Download")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Decrypt PDF', () => {
  test('should show decrypt page and accept password input', async ({ page }) => {
    await page.goto('/en/tools/decrypt-pdf');
    await expect(page.locator('h1')).toContainText('Decrypt PDF');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF);

    await page.fill('input[type="password"]', 'test123');
    await page.click('button:has-text("Decrypt PDF")');

    const downloadOrError = page.locator('button:has-text("Download"), .bg-red-50');
    await expect(downloadOrError.first()).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Compress Image', () => {
  test('should upload image and compress', async ({ page }) => {
    await page.goto('/en/tools/compress-image');
    await expect(page.locator('h1')).toContainText('Compress Image');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await expect(page.locator('text=test.png')).toBeVisible();
    await page.click('button:has-text("Compress Image")');

    await expect(page.locator('button:has-text("Download")').first()).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Convert Image', () => {
  test('should upload image and convert format', async ({ page }) => {
    await page.goto('/en/tools/convert-image');
    await expect(page.locator('h1')).toContainText('Convert Image');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await page.click('button:has-text("JPG")');
    await page.click('button:has-text("Convert Image")');

    await expect(page.locator('button:has-text("Download")')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Navigation', () => {
  test('all tool pages should be accessible', async ({ page }) => {
    const tools = [
      'compress-pdf', 'merge-pdf', 'split-pdf', 'rotate-pdf',
      'remove-pages', 'pdf-to-image', 'image-to-pdf', 'add-watermark',
      'add-page-numbers', 'encrypt-pdf', 'decrypt-pdf', 'html-to-pdf',
      'compress-image', 'convert-image'
    ];

    for (const tool of tools) {
      const response = await page.goto(`/en/tools/${tool}`);
      expect(response?.status()).toBe(200);
    }
  });
});
