import express from 'express';
import { createStealthBrowser } from './browser-setup.mjs';
import { createFormHelpers, loginToPortal, dismissPopup } from './form-helpers.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
app.use(express.json({ limit: '10mb' }));

async function runForeignNationalCertificateAutomation(formData) {
    console.log('🚀 Starting Foreign National Certificate automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    try {

        // Initialize form helpers with page instance
        const { fillOrSelect, selectDatePickerDate, uploadFile } = createFormHelpers(page);

        // Login
        console.log('🔐 [STEP] Logging in...');
        await loginToPortal(page, formData.login, formData.url);

        // Navigate to application
        console.log('🌐 [STEP] Navigating to Foreign National Certificate application form...');
        await dismissPopup(page);

        // Navigate to new application
        await page.getByRole('link', { name: /Submit new application/i }).click();
        await page.waitForURL(/submitapp\.php/, { timeout: 10000 });

        // Close modal if exists (retry after navigation)
        await dismissPopup(page);

        // Select Foreign National Certificate (Alien Card)
        console.log('🌐 [STEP] Selecting Foreign National Certificate tile...');
        
        // Try precise panel matching first
        const panel = page.locator('div.panel').filter({ hasText: /Foreign National Certificate|Application for foreign/i });
        const positionalSelector = 'div:nth-of-type(6) > div:nth-of-type(1) a';

        try {
            if (await panel.count() > 0 && await panel.first().isVisible({ timeout: 5000 })) {
                await panel.locator('a').first().click();
            } else {
                throw new Error('Panel not found by text');
            }
        } catch (e) {
            console.log('   -> Falling back to positional recording selector...');
            // Using the hierarchical path from your working recording
            await page.locator(positionalSelector).first().click();
        }

        console.log('🌐 [STEP] Clicking Apply Now...');
        await page.getByRole('link', { name: 'Apply Now' }).click();
        await page.waitForURL(/newapplicationStart\.php/, { timeout: 10000 });

        const data = formData.formData;

        // STEP 1: FILL FORM
        console.log('📝 [STEP 1] Filling Foreign National Certificate form...');

        // Image Profile
        if (data.profileImagePath) {
            console.log(`📤 Uploading passport photo: ${data.profileImagePath}`);
            await uploadFile('#profileImageToUpload', data.profileImagePath, 'Profile Image');
        }

        // Application Info
        await fillOrSelect('#applicationTypeId', data.applicationType || '6');
        
        // Handle "Applied Before" conditional fields
        await fillOrSelect('#applybefore', data.applyBefore);
        if (data.applyBefore === '1' || data.serialNo || data.individualNo) {
            console.log('📝 Filling Renewal details (Serial/Individual No)...');
            await fillOrSelect('#serialNo', data.serialNo || '');
            await fillOrSelect('#individualNo', data.individualNo || '');
        }

        // Handle "DPE" (Already has Alien ID/Dual Parentage) conditional fields
        await fillOrSelect('#dpe', data.dualParentage);
        if (data.dualParentage === '1') {
            console.log('📝 Filling DPE related documents...');
            if (data.gpPath) await uploadFile('#gp', data.gpPath, 'GP Document');
            if (data.wlPath) await uploadFile('#wl', data.wlPath, 'WL Document');
            if (data.empIdPath) await uploadFile('#empID', data.empIdPath, 'Employee ID');
        }

        await fillOrSelect('#pinNo', data.pinNo || '');

        // Personal Info
        await fillOrSelect('#surname', data.surname || '');
        await fillOrSelect('#othernames', data.otherNames || '');
        await fillOrSelect('#alias', data.alias || '');
        await fillOrSelect('#maritalstatus', data.maritalStatus);
        await fillOrSelect('#genderId', data.genderId);
        await fillOrSelect('#parent', data.parentName || '');

        // Passport Info
        await fillOrSelect('#passportNo', data.passportNo || '');
        await selectDatePickerDate('#dateOfIssue', data.passportIssueDate, 'Passport Issue Date');
        await selectDatePickerDate('#passportExpiryDate', data.passportExpiryDate, 'Passport Expiry Date');
        await fillOrSelect('#placeOfIssue', data.placeOfIssue || '');

        // Contact Info
        await fillOrSelect('#phone_no', data.phoneNumber || '');
        await fillOrSelect('#email_address', data.emailAddress || '');

        // Birth & Nationality
        await selectDatePickerDate('#dateOfBirth', data.dateOfBirth, 'Date of Birth');
        await fillOrSelect('#countryOfBirth', data.countryOfBirth);
        await fillOrSelect('#birthNationality', data.birthNationality);
        await fillOrSelect('#presentNationality', data.presentNationality);
        await fillOrSelect('#countryOfResidence', data.countryOfResidence);

        // Category & Address
        await fillOrSelect('#applicantCategory', data.applicantCategory);
        await fillOrSelect('#kenyaAddress', data.physicalAddressInKenya || '');
        await fillOrSelect('#postalCity', data.city || '');
        await fillOrSelect('#postalCode', data.postalCode || '');

        // Location Detail
        await fillOrSelect('#county', data.countyId);
        await page.waitForTimeout(1000);
        if (data.subcountyId) {
            await fillOrSelect('#subcounty', data.subcountyId);
        } else {
            await page.locator('#subcounty').selectOption({ index: 1 }).catch(() => {});
        }

        await fillOrSelect('#location', data.location || '');
        await fillOrSelect('#streetName', data.streetName || '');
        await fillOrSelect('#plotNo', data.plotNo || '');
        await fillOrSelect('#landmark', data.landmark || '');

        // Immigration Details
        await fillOrSelect('#fileR', data.immigrationFileNumber || '');
        await fillOrSelect('#occupation', data.occupation || '');
        await fillOrSelect('#employername', data.employerName || '');
        await fillOrSelect('#positionHeld', data.positionHeld || '');
        await fillOrSelect('#postalAddress', data.employerPostalAddress || '');
        await fillOrSelect('#physicalAddress', data.employerPhysicalAddress || '');

        // Duration
        await fillOrSelect('#numberofyears', data.durationYears || '1');

        console.log('✅ Form Filled. Clicking Save and waiting for next step...');
        
        // Finalize (Click Save or Submit)
        console.log('💾 Submitting form...');
        try {
            await Promise.all([
                page.waitForNavigation({ timeout: 60000 }),
                page.getByRole('button', { name: 'Save' }).click().catch(() => 
                    page.locator('input[type="submit"]').click()
                )
            ]);
            console.log('✅ Form submitted successfully!');
        } catch (error) {
            console.warn('⚠️ Form submission may not have completed as expected:', error.message);
            // Check if we're still on the same page
            if (page.url().includes('newapplicationStart.php')) {
                console.log('   ℹ️ Still on the form page - trying alternative submission method...');
                await page.keyboard.press('Enter');
            }
        }

        console.log('✅ Automation completed successfully!');
        return { success: true, message: 'Foreign National Certificate Automation completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        if (process.env.AUTO_CLOSE !== 'false') {
            await browser.close().catch(() => {});
        }
    }
}

export { runForeignNationalCertificateAutomation };
