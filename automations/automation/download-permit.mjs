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

/**
 * Navigate to the Permit Applications section
 */

async function navigateToPermitApplications(page) {
    console.log('🌐 [STEP] Navigating to dashboard...');
    await page.goto('https://fns.immigration.go.ke/dash/dash.php');

    console.log('👋 [STEP] Closing notification modal if present...');
    try {
        await page.locator('div.jconfirm button, button:has-text("CLOSE"), .jconfirm-buttons button').first().click({ timeout: 5000 });
    } catch (e) {
        console.log('ℹ️ No notification modal to close, continuing...');
    }

    console.log('🖱️ [STEP] Navigating to Permit Applications...');
    await page.locator('div:nth-of-type(3) div.container > div').first().click();
    await page.locator('div:nth-of-type(3) div.container i').first().click();

    console.log('📂 [STEP] Clicking Permit Applications link...');
    await Promise.all([
        page.waitForNavigation(),

        
        page.getByRole('link', { name: 'Permit Applications' }).click()
    ]);
}

/**
 * Find the specific application row and click the Print button
 */
async function findAndClickPrint(page, applicantName) {
    console.log(`🔍 [STEP] Finding application for: ${applicantName}`);
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
}

/**
 * Handle the actual PDF generation/download
 * Supports direct download event, popup capture, or fallback page capture
 */
async function handleDownload(page, downloadPath) {
    console.log('📄 [STEP] Handling PDF generation...');
    
    try {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        const popupPromise = page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null);

        await page.locator('div.container-fluid button, button:has-text("Print")').first().click();

        // Wait to see which event triggers
        await page.waitForTimeout(5000);

        const download = await downloadPromise;
        const popup = await popupPromise;

        if (download) {
            await download.saveAs(downloadPath);
            console.log(`✅ PDF downloaded successfully to: ${downloadPath}`);
        } else if (popup) {
            console.log('ℹ️ Popup detected, capturing PDF from popup...');
            await popup.waitForLoadState('networkidle');
            await popup.pdf({
                path: downloadPath,
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                scale: 0.8,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });
            await popup.close();
            console.log(`✅ PDF captured from popup to: ${downloadPath}`);
        } else {
            throw new Error('Neither download nor popup occurred');
        }
    } catch (error) {
        console.log('ℹ️ Direct download/popup handling failed. Falling back to current page capture...');
        await page.pdf({
            path: downloadPath,
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            scale: 0.8,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });
        console.log(`✅ PDF captured from current page content to: ${downloadPath}`);
    }
}

// Main automation function
async function runAutomation(requestData) {
    console.log('🚀 Starting PDF download automation...');

    const { login: credentials, applicantName, outputPath, url } = requestData;

    const { browser, context, page } = await createStealthBrowser({ viewport: { width: 1356, height: 1016 } });

    try {

        // 1. Login
        await loginToPortal(page, credentials, url);

        // 2. Navigate to Applications
        await navigateToPermitApplications(page);

        // 3. Select application and click print
        await findAndClickPrint(page, applicantName);

        // 4. Handle PDF generation
        const fileName = `permit_${applicantName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const downloadPath = outputPath || path.join(getDownloadsFolder(), fileName);
        await handleDownload(page, downloadPath);

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
