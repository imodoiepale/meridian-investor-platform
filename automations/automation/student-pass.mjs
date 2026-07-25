import express from 'express';
import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createFormHelpers, safeRemoveFile } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const PORT = 3008;

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Initialized inside main function with page instance

async function runStudentPassAutomation(formData) {
    console.log('🚀 Starting Student Pass automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    let downloadedPhotoPath = null;
    let downloadedGoodConductPath = null;

    try {

        // Initialize form helpers with page instance
        const formHelpers = createFormHelpers(page);
        const { 
            fillOrSelect, 
            selectDatePickerDate,
            uploadFile,
            downloadFile 
        } = formHelpers;

        // Handle photo download
        const rawPhotoPath = formData.photoPath || formData.formData?.photoPath || '';
        let finalPhotoPath = rawPhotoPath;
        if (rawPhotoPath && (rawPhotoPath.startsWith('http') || rawPhotoPath.startsWith('https'))) {
            console.log(`📥 Downloading photo from URL: ${rawPhotoPath}`);
            try {
                downloadedPhotoPath = await downloadFile(rawPhotoPath);
                finalPhotoPath = downloadedPhotoPath;
                console.log(`   -> Downloaded to: ${finalPhotoPath}`);
            } catch (err) {
                console.error('   ❌ Failed to download photo:', err.message);
                finalPhotoPath = null;
            }
        }

        // Handle good conduct certificate download
        const rawGoodConductPath = formData.goodConductFile || '';
        let finalGoodConductPath = rawGoodConductPath;
        if (rawGoodConductPath && (rawGoodConductPath.startsWith('http') || rawGoodConductPath.startsWith('https'))) {
            console.log(`� Downloading good conduct certificate from URL: ${rawGoodConductPath}`);
            try {
                downloadedGoodConductPath = await downloadFile(rawGoodConductPath);
                finalGoodConductPath = downloadedGoodConductPath;
                console.log(`   -> Downloaded to: ${finalGoodConductPath}`);
            } catch (err) {
                console.error('   ❌ Failed to download good conduct certificate:', err.message);
                finalGoodConductPath = null;
            }
        }

        // Login
        console.log('🔐 [STEP] Logging in...');
        await page.goto(formData.url || 'https://fns.immigration.go.ke/account/login.html');
        await page.getByRole('textbox', { name: 'you@example.com' }).fill(formData.login.email);
        await page.getByRole('textbox', { name: 'Id No/Passport No/Alien No' }).fill(formData.login.idNumber);
        await page.getByRole('textbox', { name: 'Password' }).fill(formData.login.password);
        await page.getByRole('button', { name: 'Login' }).click();

        // Navigate directly to Student Pass Application form
        console.log('🌐 [STEP] Navigating to Student Pass application form...');
        await page.goto('https://fns.immigration.go.ke/dash/permit/newstudentpassStart.php?cat=1');
        await page.waitForLoadState('networkidle');

        // STEP 1: UPLOAD PHOTO (First thing after page load - matching Puppeteer order)
        if (finalPhotoPath) {
            console.log(`📤 [STEP 1] Uploading photo from: ${finalPhotoPath}`);
            try {
                await uploadFile('#photoToUpload', finalPhotoPath);
                console.log(`✅ [UPLOAD] Uploaded file: ${path.basename(finalPhotoPath)}`);
            } catch (uploadError) {
                console.error('❌ [UPLOAD] Upload failed:', uploadError.message);
            }
        } else {
            console.log('⚠️ [SKIP] No photo path provided');
        }

        const data = formData.formData;

        // STEP 2: FILL FORM IN PUPPETEER ORDER
        console.log('📝 [STEP 2] Filling Student Pass form...');

        // Student Pass Type
        await fillOrSelect('#studentpasstype', data.studentPassType || '2');

        // Immigration Status
        await fillOrSelect('#imigrationStatus', data.immigrationStatus || '13');

        await fillOrSelect('#fileR', data.fileReference, 'File Reference');

        // Personal Info
        await fillOrSelect('#surname', data.surname, 'Surname');
        await fillOrSelect('#othernames', data.otherNames, 'Other Names');
        await selectDatePickerDate('#dateOfBirth', data.dateOfBirth, 'Date of Birth');
        await fillOrSelect('#countryOfBirth', data.countryOfBirth, 'Country of Birth');
        await fillOrSelect('#genderId', data.gender, 'Gender');
        await fillOrSelect('#presentNationality', data.nationality, 'Nationality');

        // Passport Info
        await fillOrSelect('#passport_no', data.passportNo, 'Passport Number');
        await selectDatePickerDate('#dateOfIssue', data.passportDateOfIssue, 'Passport Issue Date');
        await selectDatePickerDate('#passportExpiryDate', data.passportValidUntil, 'Passport Expiry Date');
        await fillOrSelect('#placeOfIssue', data.placeOfIssue, 'Place of Issue');

        // Educational Background
        console.log('🎓 [STEP] Filling Education Details...');
        
        await fillOrSelect('input[name="institutionName"]', data.institutionName, 'Institution Name');
        await fillOrSelect('#nameOfPrincipal', data.nameOfPrincipal, 'Name of Principal');
        await fillOrSelect('input[name="institutionpostalcode"]', data.institutionPostalCode, 'Institution Postal Code');
        await fillOrSelect('input[name="institutionpostaladdress"]', data.institutionPostalAddress, 'Institution Postal Address');
        await fillOrSelect('input[name="institutioncity"]', data.institutionCity, 'Institution City');
        await fillOrSelect('#institutionphysicalAddress', data.institutionPhysicalAddress, 'Institution Physical Address');
        await fillOrSelect('#admissionNo', data.admissionNo, 'Admission Number');
        await fillOrSelect('#course', data.courseDescription, 'Course');
        await fillOrSelect('#courseduration', data.courseDuration, 'Course Duration');

        // Contact Info
        const phoneNumber = data.phoneNumber || data.kenyanPhoneNumber || data.kenyanCellphone;
        await fillOrSelect('#phone_no', phoneNumber, 'Phone Number');
        await fillOrSelect('#postaladdress', data.kenyanPostalAddress, 'Postal Address');
        await fillOrSelect('#city', data.city, 'City');
        await fillOrSelect('#email_address', data.emailAddress, 'Email Address');
        await fillOrSelect('#postalcode', data.postalCode, 'Postal Code');
        await fillOrSelect('#kenyancellphone', phoneNumber, 'Kenyan Cellphone');

        // Country and County Info
        await fillOrSelect('#countryOfResidence', data.countryOfResidence);
        await fillOrSelect('#county', data.residentialCounty);
        await page.waitForTimeout(1000);
        if (data.subCounty) await fillOrSelect('#subcounty', data.subCounty);
        else await page.locator('#subcounty').selectOption({ index: 1 }).catch(() => {});

        // Address Details
        await fillOrSelect('#location', data.locationEstate, 'Location');
        await fillOrSelect('#plotNo', data.plotNoBuildingName, 'Plot Number');
        await fillOrSelect('#town', data.town, 'Town');
        await fillOrSelect('#landmark', data.nearestLandmark, 'Nearest Landmark');
        await fillOrSelect('#road', data.nearestRoadStreet, 'Nearest Road/Street');

        // Application Details
        await fillOrSelect('#applicationtypeId', data.applicationType || '4');
        await selectDatePickerDate('#arrivaldate', data.arrivalDate, 'Arrival Date');
        await fillOrSelect('#highest_education_level', data.highestEducationLevel);
        await fillOrSelect('#profession', data.profession);

        // Home Country Details
        await fillOrSelect('#home_country_paddress', data.homeCountryPhysicalAddress, 'Home Country Address');
        await fillOrSelect('#phone_no_home_country', data.homeCountryPhone, 'Home Country Phone');

        // Documents Upload
        if (finalGoodConductPath) {
            console.log('📤 [STEP] Uploading Good Conduct Certificate...');
            try {
                await uploadFile('#goodConduct', finalGoodConductPath);
                console.log(`✅ [UPLOAD] Uploaded file: ${path.basename(finalGoodConductPath)}`);
            } catch (uploadError) {
                console.error('❌ [UPLOAD] Upload failed:', uploadError.message);
            }
        } else {
            console.log('⚠️ [SKIP] No good conduct certificate path provided');
        }

        console.log('✅ Form Filled. Clicking Submit and waiting for upload...');

        // Clean up temporary files
        if (downloadedPhotoPath) {
            safeRemoveFile(downloadedPhotoPath);
            console.log('   -> 🧹 Temp photo file cleaned up.');
        }
        if (downloadedGoodConductPath) {
            safeRemoveFile(downloadedGoodConductPath);
            console.log('   -> 🧹 Temp good conduct file cleaned up.');
        }

        console.log('✅ Automation completed successfully!');
        return { success: true, message: 'Student Pass Automation completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        if (process.env.AUTO_CLOSE !== 'false') {
            await browser.close().catch(() => {});
        }
    }
}

// Export the automation function
export { runStudentPassAutomation };