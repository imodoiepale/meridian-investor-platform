import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import { createFormHelpers, loginToPortal, navigateToDashboard } from './form-helpers.mjs';


// Main automation function
async function runCitizenshipEndorsementAutomation(requestData) {
    console.log('🚀 Starting Citizenship Endorsement automation...');

    const { login: credentials, formData, url } = requestData;

    const { browser, context, page } = await createStealthBrowser({ viewport: { width: 1356, height: 1016 } });

    const { fillOrSelect, selectDatePickerDate, uploadFile } = createFormHelpers(page);

    try {

        // 1. Login
        await loginToPortal(page, credentials, url);

        // 2. Navigate to Dashboard
        await navigateToDashboard(page);

        // 3. Navigate to Citizenship Endorsement Application
        console.log('📂 [STEP] Navigating to Citizenship Section...');
        await page.locator('#page-wrapper > div > div:nth-child(2) > div:nth-child(1) > div > a > div > div').click();
        await page.waitForLoadState('networkidle');

        console.log('📂 [STEP] Selecting Citizenship Endorsement sub-section...');
        await page.locator('#page-wrapper > div > div:nth-child(3) > div:nth-child(2) > div > a > div > span.pull-left').click();
        await page.waitForLoadState('networkidle');

        console.log('🖱️ [STEP] Clicking Apply Now...');
        await page.locator('body > div.col-lg-12 > div > div.panel-body > div.row > div.row.box > div > div > div.panel-body > div.col-md-2 > a').click();
        await page.waitForLoadState('networkidle');

        // 4. Fill Application Form (F4 Fields)
        console.log('📝 [STEP] Filling Application Form...');

        // Image Upload
        const profileImage = formData.profileImagePath || formData.profileImage || formData.photoPath;
        await uploadFile('#profileImageToUploadF4', profileImage, 'Profile Image');

        // File Reference (with special trigger for validation)
        await fillOrSelect('#fileRF4', formData.fileRNumber, 'File Reference');

        // Personal Details
        await fillOrSelect('#surnameF4', formData.surname, 'Surname');
        await fillOrSelect('#othernamesF4', formData.otherNames, 'Other Names');
        await fillOrSelect('#addressF4', formData.postalAddress, 'Postal Address');
        await fillOrSelect('#cityF4', formData.city, 'City');
        await fillOrSelect('#codeF4', formData.postalCode, 'Postal Code');

        // Date of Birth
        await selectDatePickerDate('#dateOfBirthF4', formData.dateOfBirth, 'Date of Birth');

        // Foreign Address
        const foreignAddr = formData.homeCountryAddress || formData.foreignAddress || formData.physicalAddressHomeCountry;
        await fillOrSelect('#foreignAddressF4', foreignAddr, 'Foreign Address');

        // Contact Info
        await fillOrSelect('#phone_noF4', formData.phoneNumber, 'Phone Number');
        await fillOrSelect('#email_addressF4', formData.emailAddress || formData.email, 'Email Address');

        // Location Info
        if (formData.countyId) {
            await fillOrSelect('#countyF4', formData.countyId, 'County');
            await page.waitForTimeout(1000);
        }
        if (formData.subcountyId || formData.subcounty) {
            const subId = formData.subcountyId || formData.subcounty;
            await fillOrSelect('#subcountyF4', subId, 'Sub-County');
        }

        await fillOrSelect('#locationF4', formData.location || formData.locationEstate, 'Location');
        await fillOrSelect('#roadF4', formData.road || formData.nearestRoadStreet, 'Road');
        await fillOrSelect('#plot_noF4', formData.plot_no || formData.plotNo || formData.plotNoBuildingName, 'Plot No');
        await fillOrSelect('#landmarkF4', formData.landmark || formData.nearestLandmark, 'Landmark');
        await fillOrSelect('#townF4', formData.town, 'Town');

        // Citizenship Details
        if (formData.kenyanBy) {
            await fillOrSelect('#kenyanbyF4', formData.kenyanBy, 'Kenyan By');
        }
        if (formData.otherCitizenship || formData.nationality) {
            const nat = formData.otherCitizenship || formData.nationality;
            await fillOrSelect('#othercitizenshipF4', nat, 'Other Citizenship');
        }
        if (formData.otherCitizenshipBy) {
            await fillOrSelect('#othercitizenshipbyF4', formData.otherCitizenshipBy, 'Other Citizenship By');
        }

        // Passport Info
        await fillOrSelect('#passportNoF4', formData.passportNo, 'Passport No');
        await fillOrSelect('#placeOfIssueF4', formData.placeOfIssue, 'Place of Issue');

        // Date of Issue
        const issueDate = formData.dateOfIssue || formData.passportDateOfIssue;
        await selectDatePickerDate('#dateOfIssueF4', issueDate, 'Date of Issue');

        await fillOrSelect('#issuingAuthorityF4', formData.issuingAuthority, 'Issuing Authority');

        // Gender & Address
        const genderId = formData.genderId || formData.gender;
        if (genderId) {
            await fillOrSelect('#genderIdF4', genderId, 'Gender');
        }
        await fillOrSelect('#habitualAddressAtTimeOfApplicationF4', formData.habitualAddress, 'Habitual Address');

        // Document Upload
        const conductPath = formData.goodConductPath || formData.goodConduct;
        await uploadFile('#goodConduct', conductPath, 'Good Conduct Document');

        // 5. Submit (Disabled as requested)
        console.log('💾 [STEP] Form filled. Submit is currently disabled.');
        // await page.getByRole('button', { name: 'Submit' }).click();

        return {
            success: true,
            message: 'Citizenship Endorsement form filled successfully.',
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
export { runCitizenshipEndorsementAutomation };
