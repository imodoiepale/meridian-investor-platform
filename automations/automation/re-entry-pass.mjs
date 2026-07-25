import express from 'express';
import { createStealthBrowser } from './browser-setup.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createFormHelpers } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
app.use(express.json({ limit: '10mb' }));

async function runReEntryPassAutomation(formData) {
    console.log('🚀 Starting Re-entry Pass automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    try {

        // Initialize form helpers with page instance
        const { fillOrSelect, selectDatePickerDate } = createFormHelpers(page);

        // Login
        console.log('🔐 [STEP] Logging in...');
        await page.goto(formData.url || 'https://fns.immigration.go.ke/account/login.html');
        
        // Fill login form using fillOrSelect for consistency
        await fillOrSelect('input[type="email"]', formData.login.email);
        await fillOrSelect('input[placeholder*="Id No/Passport"]', formData.login.idNumber);
        await fillOrSelect('input[type="password"]', formData.login.password);
        await page.getByRole('button', { name: 'Login' }).click();
       
        // Navigate to application
        console.log('🌐 [STEP] Navigating to application form...');
        await page.waitForLoadState('networkidle');
        
        // Close any modals
        try {
            await page.getByRole('button', { name: 'close' }).click({ timeout: 3000 });
        } catch (e) { 
            console.log('   -> No modal to close');
        }
        
        // Navigate to new application
        await page.getByRole('link', { name: /Submit new application/i }).click();
        await page.waitForURL(/submitapp\.php/, { timeout: 10000 });

        // Close modal if exists (retry after navigation)
        try { 
            await page.getByRole('button', { name: 'close' }).click({ timeout: 3000 }); 
        } catch (e) { 
            console.log('   -> No modal to close after navigation');
        }

        // Select Re-entry Pass
        console.log('🌐 [STEP] Selecting Re-entry Pass tile...');
        const positionalSelector = 'div:nth-of-type(6) > div:nth-of-type(2) a';
        
        try {
            const tile = page.locator('div.panel').filter({ hasText: /Re-entry Pass|Re-entrypass/i });
            if (await tile.count() > 0 && await tile.first().isVisible({ timeout: 5000 })) {
                await tile.locator('a').first().click();
            } else {
                throw new Error('Text-based tile not found');
            }
        } catch (e) {
            console.log('   -> Falling back to positional recording selector...');
            await page.locator(positionalSelector).first().click();
        }

        console.log('🌐 [STEP] Clicking Apply Now...');
        await page.getByRole('link', { name: 'Apply Now' }).click();
        await page.waitForURL(/newreentrypass_start\.php/, { timeout: 10000 });

        const data = formData.formData;

        // STEP 1: FILL FORM
        console.log('📝 [STEP 1] Filling Re-entry Pass form...');

        // Personal Details
        await page.locator('#surname').fill(data.surname || '');
        await page.locator('#othernames').fill(data.otherNames || '');
        await page.locator('#address').fill(data.address || '');
        await page.locator('#city').fill(data.city || '');
        await page.locator('#code').fill(data.postalCode || '');
        await fillOrSelect('#genderId', data.genderId);
        
        // Contact Details
        await page.locator('#phone_no').fill(data.phoneNumber || '');
        await page.locator('#email_address').fill(data.emailAddress || '');

        // Location Details
        await fillOrSelect('#county', data.countyId);
        await page.waitForTimeout(1000); // Wait for subcounty to load
        if (data.subcountyId) {
            await fillOrSelect('#subcounty', data.subcountyId);
        } else {
            await page.locator('#subcounty').selectOption({ index: 1 }).catch(() => {});
        }

        await page.locator('#location').fill(data.location || '');
        await page.locator('#road').fill(data.road || '');
        await page.locator('#plot_no').fill(data.plotNo || '');

        // Permit and Passport Details
        await page.locator('#permitParticulars').fill(data.permitParticulars || '');
        await selectDatePickerDate('#dateOfAnticipatedReturnToKenya', data.dateOfReturn, 'Date of Anticipated Return');
        
        await page.locator('#passportNo').fill(data.passportNo || '');
        await page.locator('#placeOfIssue').fill(data.placeOfIssue || '');
        await page.locator('#fileR').fill(data.fileR || data.immigrationFileNumber || '');
        await selectDatePickerDate('#dateOfIssue', data.passportIssueDate, 'Passport Issue Date');
        
        await fillOrSelect('#numberofyears', data.durationYears || '1');

        console.log('✅ Form Filled. Clicking Save and waiting for next step...');
        
        // Click Save/Submit (Based on standard flow, usually a Submit button exists)
        await Promise.all([
            page.waitForNavigation({ timeout: 60000 }).catch(() => console.log('   ℹ️ Navigation timeout')),
            page.getByRole('button', { name: 'Save' }).click().catch(() => 
                page.locator('input[type="submit"]').click()
            )
        ]);

        console.log('✅ Automation completed successfully!');
        return { success: true, message: 'Re-entry Pass Automation completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        if (process.env.AUTO_CLOSE !== 'false') {
            await browser.close().catch(() => {});
        }
    }
}

export { runReEntryPassAutomation };