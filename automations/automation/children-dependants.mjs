import { createStealthBrowser } from './browser-setup.mjs';
import { createFormHelpers, loginToPortal, navigateToDashboard } from './form-helpers.mjs';


// Main automation function
async function runChildrenDependantsAutomation(requestData) {
    console.log('🚀 Starting Children & Dependants automation...');

    const { login: credentials, formData, url } = requestData;

    const { browser, context, page } = await createStealthBrowser({ viewport: { width: 1356, height: 1016 } });

    try {
        // Initialize form helpers
        const { fillOrSelect, selectDatePickerDate, uploadFile } = createFormHelpers(page);

        // 1. Login
        await loginToPortal(page, credentials, url);

        // 2. Navigate to Dashboard
        await navigateToDashboard(page);

        // 3. Navigate to Children & Dependants Application
        console.log('📂 [STEP] Navigating to Applications area...');
        await page.goto('https://fns.immigration.go.ke/dash/submitapp.php');

        console.log('📂 [STEP] Selecting Children & Dependants section...');
        // Selector provided by user: #page-wrapper > div > div:nth-child(4) > div:nth-child(3) > div > a > div > span.pull-left or similar
        // Trace used: div:nth-of-type(4) > div:nth-of-type(3) span.pull-left
        await page.locator('#page-wrapper > div > div:nth-child(4) > div:nth-child(3) span.pull-left').first().click();
        await page.waitForLoadState('networkidle');

        console.log('🖱️ [STEP] Clicking Apply Now...');
        await page.locator('body div.row a').click();
        await page.waitForLoadState('networkidle');

        // 4. Fill Application Form (F11 Fields)
        console.log('📝 [STEP] Filling Application Form...');

        // Image Upload
        const profileImage = formData.profileImage || formData.profileImagePath || formData.photoPath;
        await uploadFile('#profileImageToUploadF11', profileImage, 'Profile Image');

        // File Reference
        await fillOrSelect('#fileRF11', formData.fileRNumber, 'File Reference');

        // Personal Details (Main Applicant/Parent)
        await fillOrSelect('#surnameF11', formData.surname, 'Surname');
        await fillOrSelect('#othernamesF11', formData.otherNames, 'Other Names');
        await fillOrSelect('#addressF11', formData.postalAddress, 'Postal Address');
        await fillOrSelect('#cityF11', formData.city, 'City');
        await fillOrSelect('#codeF11', formData.postalCode, 'Postal Code');

        // Main Applicant Location Info
        if (formData.countyId) {
            await fillOrSelect('#countyF11', formData.countyId, 'County');
            await page.waitForTimeout(1000);
        }
        if (formData.subcountyId || formData.subcounty) {
            const subId = formData.subcountyId || formData.subcounty;
            await fillOrSelect('#subcountyF11', subId, 'Sub-County');
        }

        await fillOrSelect('#locationF11', formData.location || formData.locationEstate, 'Location');
        await fillOrSelect('#roadF11', formData.road || formData.nearestRoadStreet, 'Road');
        await fillOrSelect('#plot_noF11', formData.plotNo || formData.plotNoBuildingName, 'Plot No');
        await fillOrSelect('#landmarkF11', formData.landmark || formData.nearestLandmark, 'Landmark');

        // Citizenship Details
        if (formData.kenyanBy) {
            await fillOrSelect('#kenyanbyF11', formData.kenyanBy, 'Kenyan By');
        }

        // Contact Info
        await fillOrSelect('#phone_noF11', formData.phoneNumber, 'Phone Number');
        await fillOrSelect('#email_addressF11', formData.emailAddress || formData.email, 'Email Address');

        // --- SECTION 2: CHILD/DEPENDANT DETAILS ---
        console.log('👶 [STEP] Filling Child/Dependant Details...');
        const childData = formData.childDetails || {};

        await fillOrSelect('#childSurnameF11', childData.surname || formData.childSurname, 'Child Surname');
        await fillOrSelect('#childOthernamesF11', childData.otherNames || formData.childOthernames, 'Child Other Names');
        await fillOrSelect('#childPlaceOfBirthF11', childData.placeOfBirth || formData.childPlaceOfBirth, 'Child Place of Birth');

        // Child Date of Birth
        const childDob = childData.dateOfBirth || formData.childDateOfBirth;
        await selectDatePickerDate('#childDateOfBirthF11', childDob, 'Child Date of Birth');

        // Child Location Info
        if (childData.countyId || formData.childCountyId) {
            const cCounty = childData.countyId || formData.childCountyId;
            await fillOrSelect('#childcountyF11', cCounty, 'Child County');
            await page.waitForTimeout(1000);
        }
        if (childData.subcountyId || formData.childSubcountyId) {
            const cSub = childData.subcountyId || formData.childSubcountyId;
            await fillOrSelect('#childsubcountyF11', cSub, 'Child Sub-County');
        }

        await fillOrSelect('#childlocationF11', childData.location || formData.childLocation, 'Child Location');
        await fillOrSelect('#childroadF11', childData.road || formData.childRoad, 'Child Road');
        await fillOrSelect('#childplot_noF11', childData.plotNo || formData.childPlotNo, 'Child Plot No');
        await fillOrSelect('#childlandmarkF11', childData.landmark || formData.childLandmark, 'Child Landmark');

        // Child Citizenship Info
        if (childData.nationalityAtBirth || formData.childNationalityAtBirth) {
            const natB = childData.nationalityAtBirth || formData.childNationalityAtBirth;
            await fillOrSelect('#childnationalityAtBirthF11', natB, 'Child Nationality at Birth');
        }
        if (childData.presentNationality || formData.childPresentNationality) {
            const natP = childData.presentNationality || formData.childPresentNationality;
            await fillOrSelect('#childpresentNationalityF11', natP, 'Child Present Nationality');
        }
        await fillOrSelect('#childnoNationlityF11', childData.nationalityNo || formData.childNoNationality, 'Nationality Details');

        // Gender
        const cGender = childData.genderId || formData.childGender;
        if (cGender) {
            await fillOrSelect('#childGenderF11', cGender, 'Child Gender');
        }

        // Adopted
        const adopted = childData.adopted || formData.childAdopted || 'No';
        await fillOrSelect('#childAdoptedF11', adopted, 'Child Adopted');

        await fillOrSelect('#childResidenceF11', childData.residence || formData.childResidence, 'Child Residence');

        // First Arrival
        const firstArrival = childData.firstArrivalDate || formData.childFirstArrivalInKenya;
        await selectDatePickerDate('#childFirstArrivalInKenyaF11', firstArrival, 'First Arrival in Kenya');

        await fillOrSelect('#childDurationOfStayF11', childData.durationOfStay || formData.childDurationOfStay, 'Duration of Stay');

        // Immigration Status
        const status = childData.immigrationStatus || formData.childImmigrationStatus;
        if (status) {
            await fillOrSelect('#childimmigrationstatusF11', status, 'Immigration Status');
        }

        await fillOrSelect('#childbirthCertificateNoF11', childData.birthCertificateNo || formData.childBirthCertificateNo, 'Birth Certificate No');
        await fillOrSelect('#childpassportNoF11', childData.passportNo || formData.childPassportNo, 'Child Passport No');

        // Passport Date of Issue
        const childIssueDate = childData.passportDateOfIssue || formData.childDateOfIssue;
        await selectDatePickerDate('#childdateOfIssueF11', childIssueDate, 'Child Passport Issue Date');

        await fillOrSelect('#childplaceOfIssueF11', childData.placeOfIssue || formData.childPlaceOfIssue, 'Child Passport Place of Issue');

        // 5. Submit (Disabled)
        console.log('💾 [STEP] Form filled. Submit is currently disabled.');
        // await page.getByRole('button', { name: 'Submit' }).click();

        return {
            success: true,
            message: 'Children & Dependants form filled successfully.',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        if (process.env.AUTO_CLOSE?.trim().toLowerCase() !== 'false') {
            await browser.close().catch(() => {});
        }
    }
}

// Export the automation function
export { runChildrenDependantsAutomation };
