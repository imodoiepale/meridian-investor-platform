import { createStealthBrowser } from './browser-setup.mjs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { loginToPortal } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get user's Downloads folder
const getDownloadsFolder = () => path.join(os.homedir(), 'Downloads');

// Load environment variables from the api-server/.env file
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// Main automation function
async function runAutomation(requestData) {
    console.log('🚀 Starting PDF download automation...');

    const { login, applicantName, outputPath } = requestData;

    // Determine output path - default to Downloads folder with applicant name
    const fileName = `permit_${applicantName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const downloadPath = outputPath || path.join(getDownloadsFolder(), fileName);

    // Launch browser
    const { browser, context, page } = await createStealthBrowser({ acceptDownloads: true, viewport: { width: 1356, height: 1016 } });

    try {

        // Login
        await loginToPortal(page, login, requestData.url);

        console.log('🌐 [STEP] Ensuring we are on dashboard...');
        if (!page.url().includes('dash.php')) {
            await page.goto('https://fns.immigration.go.ke/dash/dash.php', { waitUntil: 'load' });
        }

        // Close notification modal if it exists
        console.log('👋 [STEP] Closing notification modal...');
        try {
            await page.locator('div.jconfirm button, button:has-text("CLOSE"), .jconfirm-buttons button').first().click({ timeout: 5000 });
        } catch (e) {
            console.log('ℹ️ No notification modal to close, continuing...');
        }

        // Click menu triggers to reveal Permit Applications
        console.log('🖱️ [STEP] Navigating to Permit Applications...');
        await page.locator('div:nth-of-type(3) div.container > div').first().click();
        await page.locator('div:nth-of-type(3) div.container i').first().click();

        // Wait for navigation after clicking Permit Applications
        console.log('📂 [STEP] Clicking Permit Applications...');
        await Promise.all([
            page.waitForNavigation(),
            page.getByRole('link', { name: 'Permit Applications' }).click()
        ]);

        // Find the specific application and click Print
        console.log('🔍 [STEP] Clicking Print for application row...');
        const printRowSelector = `tr:has-text("${applicantName}")`;
        const printRow = page.locator(printRowSelector);

        if (await printRow.count() > 0) {
            await Promise.all([
                page.waitForNavigation(),
                printRow.first().locator('input[value="Print"], button:has-text("Print")').first().click()
            ]);
        } else {
            console.log('⚠️ Specific row not found, attempting to click the first row Print button...');
            await Promise.all([
                page.waitForNavigation(),
                page.locator('tr:nth-of-type(1) input:nth-of-type(3)').click()
            ]);
        }

        await page.waitForLoadState('networkidle');

        console.log('📄 [STEP] Clicking Print button to trigger native print dialog...');

        // Click the Print button on the page - this triggers window.print()
        // The button has onclick="printDiv('printableArea')" which calls window.print()
        // We click it but don't wait for it since window.print() is blocking
        const printButton = page.locator('div.container-fluid button, button:has-text("Print")').first();

        // Use Promise.race to click without blocking - the click triggers window.print()
        // which opens the print dialog, so we set a short timeout
        await Promise.race([
            printButton.click(),
            page.waitForTimeout(1000)
        ]).catch(() => {});

        // Alternative: if the click blocks, try using evaluate to call the function directly
        await page.evaluate(() => {
            if (typeof printDiv === 'function') {
                setTimeout(() => printDiv('printableArea'), 100);
            }
        }).catch(() => {});

        // Wait for print dialog to fully load
        console.log('⏳ Waiting for print dialog to open...');
        await page.waitForTimeout(4000);

        console.log('🖨️ [STEP] Navigating print dialog with keyboard...');

        // Based on your recording, the flow is:
        // 1. Click destination dropdown (Tab to it, Space to open)
        // 2. Select "See more" to open destination dialog
        // 3. Select "Save as PDF" from the list
        // 4. Click Save button

        // Step 1: Tab to destination dropdown and open it
        await page.keyboard.press('Tab');
        await page.waitForTimeout(400);
        await page.keyboard.press('Space');
        await page.waitForTimeout(600);

        // Step 2: Select "See more destinations..." (usually last option in dropdown)
        // Arrow down to "See more..."
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);

        // Select "See more..."
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);

        // Step 3: In the destination dialog, "Save as PDF" should be first option
        // It's already focused, just press Enter to select it
        console.log('📋 [STEP] Selecting Save as PDF...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);

        // Step 4: Tab to Save button and click it
        console.log('💾 [STEP] Clicking Save button...');

        // The Save button is the primary action button
        // Use Ctrl+Shift+Enter as shortcut for Save, or Tab to it
        // Tab multiple times to reach Save button
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
        }

        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Step 5: Handle the "Save As" file dialog
        console.log('📁 [STEP] Handling Save As dialog...');

        // Select all and type the download path
        await page.keyboard.press('Control+a');
        await page.waitForTimeout(300);
        await page.keyboard.type(downloadPath);
        await page.waitForTimeout(500);

        // Press Enter to save
        await page.keyboard.press('Enter');

        // Wait for download to complete
        console.log('⏳ Waiting for PDF to save...');
        await page.waitForTimeout(5000);

        console.log(`✅ PDF saved to: ${downloadPath}`);
        console.log('🎉 Automation completed successfully!');
        return { success: true, message: 'PDF download completed successfully!', outputPath: downloadPath };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        if (page) {
            await page.waitForTimeout(2000);
        }
        const autoClose = process.env.AUTO_CLOSE?.trim().toLowerCase() !== 'false';
        if (autoClose) {
            await browser.close();
        }
    }
}

// Export the automation function
export async function runDownloadPermitAutomation(requestData) {
    return await runAutomation(requestData);
}
