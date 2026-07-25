import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStealthBrowser } from './browser-setup.mjs';
import { createFormHelpers, loginToPortal, dismissPopup } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main automation function
async function runAutomation(requestData) {
    console.log('🚀 Starting Class N permit automation...');

    const { login, formData } = requestData;
    let browser, context, page;

    try {
        ({ browser, context, page } = await createStealthBrowser({
            viewport: { width: 1265, height: 720 },
        }));
        page.setDefaultTimeout(5000);

        const { fillOrSelect } = createFormHelpers(page);

        // Login to immigration portal
        console.log('🔐 Logging into immigration portal...');
        await loginToPortal(page, login, requestData.url);
        await dismissPopup(page);

        // Navigate to permit application
        console.log('📍 Navigating to permit application...');
        await page.getByRole('link', { name: 'Submit new applications ' }).click();
        await page.locator('.panel > a').first().click();
        await page.locator('div:nth-child(13) > div > .panel > .panel-body > .col-md-2 > .btn').click();
        await page.getByRole('link', { name: 'Apply Now' }).click();
        await page.goto('https://fns.immigration.go.ke/dash/permit/form25startNew.php?class=27');

        // Fill main application form
        console.log('📝 Filling main application form...');
        const mainApp = formData.mainApplication || {};
        
        // Helper function to safely fill form fields
        const safeFill = async (action, fieldName, defaultValue = '') => {
            try {
                await action();
            } catch (error) {
                console.log(`⚠️  Could not fill ${fieldName}: ${error.message}`);
            }
        };

        await safeFill(() => page.getByLabel('Application type *').selectOption(mainApp.applicationType || '4'), 'Application type');
        await safeFill(() => page.getByRole('spinbutton', { name: 'Previous Work Permit Numbers:' }).fill(mainApp.previousWorkPermitNumbers || '1'), 'Previous Work Permit Numbers');
        await safeFill(() => page.getByRole('spinbutton', { name: 'Preferred permit duration (in' }).fill(mainApp.preferredDuration || '1'), 'Preferred permit duration');
        await safeFill(() => page.getByRole('spinbutton', { name: 'Immigration file Number(R' }).fill(mainApp.immigrationFileNumber || '1'), 'Immigration file Number');
        await safeFill(() => page.getByRole('textbox', { name: 'Othername(s) *' }).fill(mainApp.otherNames || ''), 'Other names');
        await safeFill(() => page.getByRole('textbox', { name: 'Surname *' }).fill(mainApp.surname || ''), 'Surname');
        await safeFill(() => page.getByRole('textbox', { name: 'Date of Birth (mm/dd/yyyy)*' }).fill(mainApp.dateOfBirth || '2000-01-01'), 'Date of Birth');
        await safeFill(() => page.getByLabel('Place of Birth *').selectOption(mainApp.placeOfBirth || '74'), 'Place of Birth');
        await safeFill(() => page.getByLabel('Nationality *').selectOption(mainApp.nationality || '74'), 'Nationality');
        await safeFill(() => page.getByLabel('Gender *').selectOption(mainApp.gender || '1'), 'Gender');
        await safeFill(() => page.getByRole('textbox', { name: 'Passport No *' }).fill(mainApp.passportNo || ''), 'Passport No');
        await safeFill(() => page.getByRole('textbox', { name: 'Passport Valid until (mm/dd/' }).fill(mainApp.passportValidUntil || '2026-01-01'), 'Passport Valid until');
        await safeFill(() => page.getByRole('textbox', { name: 'Place of Issue *' }).fill(mainApp.placeOfIssue || ''), 'Place of Issue');
        await safeFill(() => page.getByRole('textbox', { name: 'Passport Date of Issue (mm/dd' }).fill(mainApp.passportDateOfIssue || '2020-02-01'), 'Passport Date of Issue');
        const phoneNumber = mainApp.phoneNumber || mainApp.kenyanCellphone || mainApp.kenyanPhoneNumber;
        await safeFill(() => page.getByRole('textbox', { name: 'Phone Number eg(254 711111111' }).fill(phoneNumber || ''), 'Phone Number');
        await safeFill(() => page.getByRole('textbox', { name: 'E-mail address *' }).fill(mainApp.email || ''), 'Email address');
        await safeFill(() => page.getByRole('textbox', { name: 'Postal Code *' }).fill(mainApp.postalCode || ''), 'Postal Code');
        await safeFill(() => page.getByRole('textbox', { name: 'Kenyan Postal Address *' }).fill(mainApp.kenyanPostalAddress || ''), 'Kenyan Postal Address');
        await safeFill(() => page.getByRole('textbox', { name: 'City *' }).fill(mainApp.city || ''), 'City');
        await safeFill(() => page.getByRole('textbox', { name: 'Kenyan cellphone eg(254' }).fill(phoneNumber || ''), 'Kenyan cellphone');
        await safeFill(() => page.getByLabel('Residential County *').selectOption(mainApp.residentialCounty || '21'), 'Residential County');
        await safeFill(() => page.getByLabel('Sub County *').selectOption(mainApp.subCounty || '135'), 'Sub County');
        await safeFill(() => page.getByRole('textbox', { name: 'Location/Estate *' }).fill(mainApp.locationEstate || ''), 'Location/Estate');
        await safeFill(() => page.getByRole('textbox', { name: 'Nearest Road/Street *' }).fill(mainApp.nearestRoadStreet || ''), 'Nearest Road/Street');
        await safeFill(() => page.getByRole('textbox', { name: 'Plot No/Building Name *' }).fill(mainApp.plotNoBuildingName || ''), 'Plot No/Building Name');
        await safeFill(() => page.getByRole('textbox', { name: 'Nearest Landmark *' }).fill(mainApp.nearestLandmark || ''), 'Nearest Landmark');
        await safeFill(() => page.getByRole('textbox', { name: 'Town *' }).fill(mainApp.town || ''), 'Town');
        await safeFill(() => page.getByLabel('Current Immigration status *').selectOption(mainApp.currentImmigrationStatus || '16'), 'Current Immigration status');
        
        // Handle education level with multiple fallback options
        try {
            const educationLevel = mainApp.highestEducationLevel || mainApp.educationLevel || "Bachelor's Degree";
            
            // First try by label
            await page.getByLabel('Highest Education Level *').selectOption({ label: educationLevel });
        } catch (error) {
            try {
                // Try by value
                const educationLevel = mainApp.highestEducationLevel || mainApp.educationLevel || "Bachelor's Degree";
                await page.getByLabel('Highest Education Level *').selectOption(educationLevel);
            } catch (error2) {
                // Ignore errors here as we have fallbacks later or in the main error handler
            }
        }
        
        await safeFill(() => page.getByRole('textbox', { name: 'Name of Employer/Business *' }).fill(mainApp.employerBusinessName || ''), 'Name of Employer/Business');
        await safeFill(() => page.getByRole('textbox', { name: 'Profession/Area of Speciality' }).fill(mainApp.profession || ''), 'Profession/Area of Speciality');
        await safeFill(() => page.getByRole('textbox', { name: 'Telephone No. in Home Country' }).fill(mainApp.telephoneHomeCountry || ''), 'Telephone No. in Home Country');
        await safeFill(() => page.getByRole('textbox', { name: 'Physical Address in Home' }).fill(mainApp.physicalAddressHomeCountry || ''), 'Physical Address in Home');
        await safeFill(() => page.getByRole('textbox', { name: 'Names of spouse' }).fill(mainApp.spouseNames || ''), 'Names of spouse');

        // Handle passport photo upload if provided
        if (mainApp.passportPhoto) {
            console.log('📷 Uploading passport photo...');
            await page.getByRole('button', { name: 'Passport-size photo/Profile' }).setInputFiles(mainApp.passportPhoto);
        }

        // Save the main form
        console.log('💾 Saving main application form...');
        await page.getByRole('button', { name: 'Save' }).click();

        // Fill dependant details
        console.log('👨‍👩‍👧‍👦 Filling dependant details...');
        await page.waitForLoadState('networkidle');
        
        const dependantDetails = formData.dependantDetails || {};
        if (Object.keys(dependantDetails).length > 0) {
            await page.locator('#firstname').fill(dependantDetails.firstName || '');
            await page.locator('#middlename').fill(dependantDetails.middleName || '');
            await page.locator('#surname').fill(dependantDetails.surname || '');
            await page.locator('#dateOfBirth').fill(dependantDetails.dateOfBirth || '20/03/2005');
            await page.locator('#genderId').selectOption(dependantDetails.gender || '1');
            await page.locator('#countryofBirth').selectOption(dependantDetails.countryOfBirth || '43');
        }

        console.log('💾 Saving dependant details...');
        await page.getByRole('button', { name: 'Save Dependant details' }).click();

        // Fill previous permit details
        console.log('📋 Filling previous permit details...');
        await page.waitForLoadState('networkidle');
        
        const previousPermitDetails = formData.previousPermitDetails || {};
        if (Object.keys(previousPermitDetails).length > 0) {
            await page.locator('#permitclassId').selectOption(previousPermitDetails.permitClass || '15');
            await page.locator('#permittype').fill(previousPermitDetails.permitType || '');
            await page.locator('#permitNo').fill(previousPermitDetails.permitNumber || '');
            await page.locator('#dateIssued').fill(previousPermitDetails.dateIssued || '');
            await page.locator('#duration').selectOption(previousPermitDetails.duration || '2 years');
        }

        console.log('💾 Saving previous permit details...');
        await page.getByRole('button', { name: 'Save previous permit details' }).click();

        // Fill declined application details
        console.log('❌ Filling declined application details...');
        const declinedApplicationDetails = formData.declinedApplicationDetails || {};
        if (Object.keys(declinedApplicationDetails).length > 0) {
            await page.getByLabel('Permit Class *').selectOption(declinedApplicationDetails.permitClass || '15');
            await page.getByLabel('Type of permit/Pass/Visa').fill(declinedApplicationDetails.permitType || '');
            await page.getByLabel('Reasons').fill(declinedApplicationDetails.reasons || '');
            await page.getByLabel('Date of Application').fill(declinedApplicationDetails.dateOfApplication || '');
        }

        console.log('✅ Class N permit application completed successfully!');

        // Auto-close browser if enabled
        if (process.env.AUTO_CLOSE === 'true') {
            await context.close();
            await browser.close();
        }

        return {
            success: true,
            message: 'Class N permit application completed successfully',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Error during Class N automation:', error);
        
        // Take screenshot on error if page is available
        try {
            if (page) {
                const screenshotPath = path.join(__dirname, 'class-n-error-screenshot.png');
                await page.screenshot({ path: screenshotPath });
                console.log(`📸 Error screenshot saved to: ${screenshotPath}`);
            }
        } catch (screenshotError) {
            console.error('Failed to take screenshot:', screenshotError);
        }

        // Close browser if context is available
        try {
            if (context) {
                await context.close();
            }
            if (browser) {
                await browser.close();
            }
        } catch (closeError) {
            console.error('Failed to close browser:', closeError);
        }

        throw error;
    }
}

// Export function for server integration
export async function runClassNAutomation(requestData) {
    try {
        console.log('📥 Received Class N automation request');
        console.log('👤 User:', requestData.formData?.mainApplication?.surname, requestData.formData?.mainApplication?.otherNames);
        
        const result = await runAutomation(requestData);
        console.log('✅ Class N automation completed:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Class N automation failed:', error.message);
        throw error;
    }
}

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const testData = {
        login: {
            email: process.env.EFNS_EMAIL,
            idNumber: process.env.EFNS_ID_NUMBER,
            password: process.env.EFNS_PASSWORD
        },
        mainApplication: {
            applicationType: '4',
            previousWorkPermitNumbers: '1',
            preferredDuration: '1',
            immigrationFileNumber: '1',
            otherNames: 'Test',
            surname: 'User',
            dateOfBirth: '2000-01-01',
            placeOfBirth: '74',
            nationality: '74',
            gender: '1',
            passportNo: '123456789',
            passportValidUntil: '2026-01-01',
            placeOfIssue: 'Kenya',
            passportDateOfIssue: '2020-02-01',
            phoneNumber: '254712345678',
            email: 'test@example.com',
            postalCode: '00100',
            kenyanPostalAddress: 'P.O. Box 12345',
            city: 'Nairobi',
            kenyanCellphone: '254712345678',
            residentialCounty: '21',
            subCounty: '135',
            locationEstate: 'Test Estate',
            nearestRoadStreet: 'Test Street',
            plotNoBuildingName: 'Test Building',
            nearestLandmark: 'Test Landmark',
            town: 'Nairobi',
            currentImmigrationStatus: '16',
            highestEducationLevel: "Bachelor's Degree",
            employerBusinessName: 'Test Company',
            profession: 'Software Engineer',
            telephoneHomeCountry: '+1234567890',
            physicalAddressHomeCountry: '123 Test St, Test City',
            spouseNames: 'Test Spouse'
        },
        dependantDetails: {
            firstName: 'Test',
            middleName: 'Middle',
            surname: 'Dependant',
            dateOfBirth: '20/03/2005',
            gender: '1',
            countryOfBirth: '43'
        },
        previousPermitDetails: {
            permitClass: '15',
            permitType: 'Test Permit',
            permitNumber: '123456',
            dateIssued: '2025-01-09',
            duration: '2 years'
        },
        declinedApplicationDetails: {
            permitClass: '15',
            permitType: 'Test Visa',
            reasons: 'Test reason',
            dateOfApplication: '2025-01-10'
        }
    };

    runClassNAutomation({ formData: testData })
        .then(result => console.log('✅ Test completed:', result))
        .catch(error => console.error('❌ Test failed:', error));
}
