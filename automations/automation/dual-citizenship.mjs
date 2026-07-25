import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import { createFormHelpers, loginToPortal, navigateToDashboard } from './form-helpers.mjs';


// Main automation function
async function runDualCitizenshipAutomation(requestData) {
    console.log('🚀 Starting Dual Citizenship automation...');

    const { login: credentials, formData, url } = requestData;

    const { browser, context, page } = await createStealthBrowser({ viewport: { width: 1356, height: 1016 } });

    const { fillOrSelect, selectDatePickerDate, uploadFile } = createFormHelpers(page);

    try {

        // 1. Login
        await loginToPortal(page, credentials, url);

        // 2. Navigate to Dashboard
        await navigateToDashboard(page);

        // 3. Navigate to Dual Citizenship Application
        console.log('📂 [STEP] Navigating to Applications area...');
        await page.goto('https://fns.immigration.go.ke/dash/submitapp.php');

        console.log('📂 [STEP] Selecting Dual Citizenship section...');
        // Selector provided by user: #page-wrapper > div > div:nth-child(3) > div:nth-child(4) > div > a > div > span.pull-left
        await page.locator('#page-wrapper > div > div:nth-child(3) > div:nth-child(4) > div > a > div > span.pull-left').click();
        await page.waitForLoadState('networkidle');

        console.log('🖱️ [STEP] Clicking Apply Now...');
        await page.locator('body div.box a').click();
        await page.waitForLoadState('networkidle');

        // 4. Fill Application Form (F3 Fields)
        console.log('📝 [STEP] Filling Application Form...');

        // Image Upload
        const profileImage = formData.profileImage || formData.profileImagePath || formData.photoPath;
        await uploadFile('#profileImageToUploadF3', profileImage, 'Profile Image');

        // File Reference
        await fillOrSelect('#fileRF3', formData.fileRNumber, 'File Reference');

        // Personal Details
        await fillOrSelect('#surnameF3', formData.surname, 'Surname');
        await fillOrSelect('#othernamesF3', formData.otherNames, 'Other Names');
        await fillOrSelect('#addressF3', formData.postalAddress, 'Postal Address');
        await fillOrSelect('#cityF3', formData.city, 'City');
        await fillOrSelect('#codeF3', formData.postalCode, 'Postal Code');

        // Gender
        const genderId = formData.genderId || formData.gender;
        if (genderId) {
            await fillOrSelect('#genderIdF3', genderId, 'Gender');
        }

        // Foreign Address
        const foreignAddr = formData.homeCountryAddress || formData.foreignAddress || formData.physicalAddressHomeCountry;
        await fillOrSelect('#foreignAddressF3', foreignAddr, 'Foreign Address');

        // Passport Info
        await fillOrSelect('#PassportNoF3', formData.passportNo, 'Passport No');

        // Contact Info
        await fillOrSelect('#phone_noF3', formData.phoneNumber, 'Phone Number');
        await fillOrSelect('#email_addressF3', formData.emailAddress || formData.email, 'Email Address');

        // Location Info
        if (formData.countyId) {
            await fillOrSelect('#countyF3', formData.countyId, 'County');
            await page.waitForTimeout(1000);
        }
        if (formData.subcountyId || formData.subcounty) {
            const subId = formData.subcountyId || formData.subcounty;
            await fillOrSelect('#subcountyF3', subId, 'Sub-County');
        }

        await fillOrSelect('#locationF3', formData.location || formData.locationEstate, 'Location');
        await fillOrSelect('#roadF3', formData.road || formData.nearestRoadStreet, 'Road');
        await fillOrSelect('#plot_noF3', formData.plotNo || formData.plotNoBuildingName, 'Plot No');
        await fillOrSelect('#landmarkF3', formData.landmark || formData.nearestLandmark, 'Landmark');
        await fillOrSelect('#townF3', formData.town, 'Town');

        // Citizenship Details
        if (formData.kenyanBy) {
            await fillOrSelect('#kenyanbyF3', formData.kenyanBy, 'Kenyan By');
        }
        if (formData.otherCitizenship || formData.nationality) {
            const nat = formData.otherCitizenship || formData.nationality;
            await fillOrSelect('#othercitizenshipF3', nat, 'Other Citizenship');
        }
        if (formData.otherCitizenshipBy) {
            await fillOrSelect('#othercitizenshipbyF3', formData.otherCitizenshipBy, 'Other Citizenship By');
        }

        // Birth Info
        await fillOrSelect('#placeOfBirthF3', formData.placeOfBirth, 'Place of Birth');
        if (formData.countryOfBirthId || formData.countryOfBirth) {
            const country = formData.countryOfBirthId || formData.countryOfBirth;
            await fillOrSelect('#countryOfBirthF3', country, 'Country of Birth');
        }

        // Date of Birth
        // Note: Puppeteer script used .fill('2008-01-08') for #dateOfBirthF3.
        // We'll try fill and if it fails, fallback to datepicker.
        if (formData.dateOfBirth) {
            if (typeof formData.dateOfBirth === 'string' && formData.dateOfBirth.includes('-')) {
                await page.locator('#dateOfBirthF3').fill(formData.dateOfBirth);
            } else {
                await selectDatePickerDate('#dateOfBirthF3', formData.dateOfBirth, 'Date of Birth');
            }
        }

        await fillOrSelect('#habitualAddressAtTimeOfApplicationF3', formData.habitualAddress, 'Habitual Address');

        // 5. Submit (Disabled as per previous pattern)
        console.log('💾 [STEP] Form filled. Submit is currently disabled.');
        // await page.getByRole('button', { name: 'Submit' }).click();

        return {
            success: true,
            message: 'Dual Citizenship form filled successfully.',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        const autoClose = process.env.AUTO_CLOSE?.trim().toLowerCase() !== 'false';
        if (autoClose) {
            // await browser.close();
        }
    }
}

// Export the automation function
export { runDualCitizenshipAutomation };
