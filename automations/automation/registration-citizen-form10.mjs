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

async function runRegistrationCitizenForm10Automation(formData) {
    console.log('🚀 Starting Registration as citizen of Kenya (Form 10) automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    try {
        // Initialize form helpers
        const formHelpers = createFormHelpers(page);
        const { fillOrSelect, selectDatePickerDate } = formHelpers;

        // Login
        await loginToPortal(page, formData.login, formData.url);

        // Navigate to application
        console.log('🌐 [STEP] Navigating to Registration as Citizen form...');
        await dismissPopup(page);

        // Submit new applications
        console.log('🌐 [STEP] Clicking Submit new applications...');
        const submitAppsSelector = 'div > div:nth-of-type(2) > div:nth-of-type(1) a > div > div';
        await page.locator(submitAppsSelector).first().click();
        await page.waitForURL(/submitapp\.php/, { timeout: 15000 });

        // Close modal if exists
        await dismissPopup(page);

        // Select Registration as Citizen (Form 10) - Row 3, Col 4
        console.log('🌐 [STEP] Selecting Citizenship tile...');
        const citizenshipTileSelector = 'div:nth-of-type(3) > div:nth-of-type(4) span.pull-left';
        await page.locator(citizenshipTileSelector).first().click();
        await page.waitForURL(/newform10application\.php/, { timeout: 15000 });
        
        console.log('🌐 [STEP] Clicking Apply Now...');
        await page.locator('div.box a').first().click();
        await page.waitForURL(/newform10applicationStart\.php/, { timeout: 15000 });

        const data = formData.formData;

        // STEP 1: FILL FORM
        console.log('📝 [STEP 1] Filling Form 10 details...');

        // Image Profile
        if (data.profileImagePath) {
            console.log(`📤 Uploading profile image: ${data.profileImagePath}`);
            await page.locator('#profileImageToUploadF10').setInputFiles(data.profileImagePath).catch(() => {});
        }

        // Basic Info
        await page.locator('#fileRF10').fill(String(data.fileRNumber || data.fileRF10 || ''));
        await page.locator('#surnameF10').fill(data.surname || '');
        await page.locator('#othernamesF10').fill(data.otherNames || '');
        await page.locator('#addressF10').fill(data.address || '');
        await page.locator('#cityF10').fill(data.city || '');
        await page.locator('#codeF10').fill(data.postalCode || '');
        
        await fillOrSelect('#genderF10', data.genderId);
        await fillOrSelect('#countyF10', data.countyId);
        
        await page.waitForTimeout(1500); // Allow subcounty to load
        if (data.subcountyId) {
            await fillOrSelect('#subcountyF10', data.subcountyId);
        }

        await page.locator('#locationF10').fill(data.location || '');
        await page.locator('#roadF10').fill(data.road || '');
        await page.locator('#plot_noF10').fill(data.plotNo || '');
        await page.locator('#landmarkF10').fill(data.landmark || '');

        // Personal details
        await page.locator('#placeOfBirthF10').fill(data.placeOfBirth || '');
        await selectDatePickerDate('#dateOfBirthF10', data.dateOfBirth, 'Date of Birth');
        
        await page.locator('#phone_noF10').fill(data.phoneNumber || '');
        await page.locator('#email_addressF10').fill(data.emailAddress || '');

        await fillOrSelect('#presentNationalityF10', data.presentNationalityId);
        await fillOrSelect('#nationalityAtBirthF10', data.nationalityAtBirthId);
        
        await fillOrSelect('#professionF10', data.professionId);
        await page.locator('#specifyProfessionF10').fill(data.professionOther || '');
        
        await page.locator('#nameChangeParticularsF10').fill(data.nameChangeParticulars || 'NONE');
        await page.locator('#birthNationalityChangeParticularsF10').fill(data.nationalityChangeParticulars || 'NONE');
        await page.locator('#permitF10').fill(data.permitParticulars || '');
        
        // Marital Status & Documents
        await fillOrSelect('#marriagestatusF10', data.maritalStatusId);
        
        if (data.marriageCertificatePath) {
            console.log(`📤 Uploading marriage certificate: ${data.marriageCertificatePath}`);
            await page.locator('#marriageCertificateF10').setInputFiles(data.marriageCertificatePath).catch(() => {});
        }
        
        await page.locator('#nameOfSpouseF10').fill(data.spouseName || '');
        
        if (data.goodConductPath) {
            console.log(`📤 Uploading good conduct certificate: ${data.goodConductPath}`);
            await page.locator('#goodConduct').setInputFiles(data.goodConductPath).catch(() => {});
        }

        console.log('✅ Form Filled. Clicking Save and waiting for next step...');

        // Finalize (Click Save or Submit)
        await Promise.all([
            page.waitForNavigation({ timeout: 60000 }).catch(() => console.log('   ℹ️ Navigation timeout')),
            page.getByRole('button', { name: 'Save' }).click().catch(() => 
                page.locator('input[type="submit"]').click()
            )
        ]);

        console.log('✅ Automation completed successfully!');
        return { success: true, message: 'Registration as Citizen (Form 10) completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        // await browser.close();
    }
}

export { runRegistrationCitizenForm10Automation };
