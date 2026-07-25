import express from 'express';
import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createFormHelpers, loginToPortal, dismissPopup } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

async function runRegularizationAutomation(formData) {
    console.log('🚀 Starting Regularization of Status automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    try {
        // Initialize form helpers
        const formHelpers = createFormHelpers(page);
        const { fillOrSelect, selectDatePickerDate } = formHelpers;

        // Login
        await loginToPortal(page, formData.login, formData.url);

        // Navigate to application
        console.log('🌐 [STEP] Navigating to Regularization application form...');
        await dismissPopup(page);

        // Submit new applications
        console.log('🌐 [STEP] Clicking Submit new applications...');
        const submitAppsBtn = page.locator('#page-wrapper div:nth-of-type(2) > div:nth-of-type(1) a').first();
        try {
            await submitAppsBtn.click({ timeout: 5000 });
        } catch (e) {
            console.log('   -> Button click failed, trying getByRole...');
            await page.getByRole('link', { name: /Submit new applications/i }).click();
        }
        await page.waitForURL(/submitapp\.php/, { timeout: 20000 });

        // Close modal if exists
        await dismissPopup(page);

        // Select Regularization of Status tile (Row 6, Col 4)
        console.log('🌐 [STEP] Selecting Regularization tile...');
        const tileSelector = '#page-wrapper div:nth-of-type(6) > div:nth-of-type(4) a';
        await page.locator(tileSelector).first().click();
        await page.waitForURL(/newregularization\.php/, { timeout: 20000 });

        console.log('🌐 [STEP] Clicking Apply Now...');
        const applyBtn = page.locator('a.btn').filter({ hasText: /^Apply Now$/i }).first();
        try {
            await applyBtn.click({ timeout: 5000 });
        } catch (e) {
            console.log('   -> Falling back to deep positional selector for Apply Now...');
            await page.locator('div.row a:has-text("Apply Now")').first().click();
        }
        
        await page.waitForURL(/newregularization_start\.php/, { timeout: 30000 });
        console.log('⏳ Waiting for form page to stabilize...');
        await page.waitForLoadState('networkidle');
        await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });

        const data = formData.formData;

        // STEP 1: FILL FORM
        console.log('📝 [STEP 1] Filling Regularization form...');

        // Personal Details
        await page.locator('#surname').fill(data.surname || '');
        await page.locator('#othernames').fill(data.otherNames || '');
        await selectDatePickerDate('#dateOfBirth', data.dateOfBirth, 'Date of Birth');
        await fillOrSelect('#genderId', data.genderId);
        
        // Contact Info
        await page.locator('#phone_no').fill(data.phoneNumber || '');
        await page.locator('#email_address').fill(data.emailAddress || data.email || '');

        // Address & Location
        await page.locator('#address').fill(data.postalAddress || data.address || '');
        await page.locator('#code').fill(data.postalCode || '');
        await page.locator('#city').fill(data.city || '');
        
        await fillOrSelect('#county', data.countyId || data.residentialCounty);
        await page.waitForTimeout(1000); 
        
        if (data.subcountyId || data.subCounty) {
            await fillOrSelect('#subcounty', data.subcountyId || data.subCounty);
        } else {
            try {
                await page.locator('#subcounty').selectOption({ index: 1 });
            } catch (e) { }
        }

        await page.locator('#location').fill(data.location || '');
        await page.locator('#road').fill(data.road || '');
        await page.locator('#plot_no').fill(data.plotNo || '');

        // Nationality & Passport Info
        await fillOrSelect('#presentNationality', data.presentNationality || data.nationality);
        await fillOrSelect('#passportNationality', data.passportNationality);
        await page.locator('#passportNo').fill(data.passportNo || '');
        await page.locator('#placeOfIssue').fill(data.placeOfIssue || '');
        await selectDatePickerDate('#dateOfIssue', data.passportDateOfIssue || data.dateOfIssue, 'Passport Issue Date');
        await selectDatePickerDate('#passportExpiryDate', data.passportValidUntil || data.passportExpiryDate, 'Passport Expiry Date');

        // Regularization Specific Fields
        await fillOrSelect('#isRefugee', data.isRefugee);
        await selectDatePickerDate('#dateOfEntryToKenya', data.dateOfEntryToKenya, 'Date of Entry to Kenya');
        await fillOrSelect('#reasonForExtendingVisit', data.reasonForExtendingVisit || data.currentStatus);
        await page.locator('#portOfEntry').fill(data.portOfEntry || '');
        await page.locator('#extensionPeriod').fill(data.extensionPeriod || '');
        await fillOrSelect('#extensionPeriodIn', data.extensionPeriodIn);
        await fillOrSelect('#visa_type', data.visaType || '1');
        await page.locator('#filer').fill(data.fileRNumber || data.filer || '');

        console.log('✅ Form Filled. Clicking Save and waiting for next step...');
        
        // Finalize (Click Save or Submit)
        await Promise.all([
            page.waitForNavigation({ timeout: 60000 }).catch(() => console.log('   ℹ️ Navigation timeout')),
            page.getByRole('button', { name: 'Save' }).click().catch(() => 
                page.locator('input[type="submit"]').click()
            )
        ]);

        console.log('✅ Automation completed successfully!');
        return { success: true, message: 'Regularization Automation completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        // await browser.close();
    }
}

export { runRegularizationAutomation };
