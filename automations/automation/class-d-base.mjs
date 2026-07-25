import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the api-server/.env file
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

(async () => {
    // Load test data
    const dataPath = path.join(__dirname, 'test-data.json');
    const testData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log('🚀 Starting Class D permit automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    try {

        // Helper: Detects if an element is a SELECT or INPUT and acts accordingly
        async function fillOrSelect(selector, value) {
            const element = page.locator(selector).first();
            await element.waitFor({ state: 'visible' });
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            if (tagName === 'select') {
                console.log(`Dropdown detected for ${selector}. Selecting option: ${value}`);
                await element.selectOption(value.toString());
            } else {
                console.log(`Input field detected for ${selector}. Filling value: ${value}`);
                await element.fill(value.toString());
            }
        }

        // Helper: Fill dates using the portal's date picker
        async function selectDatePickerDate(rowSelector, dateObj, label) {
            console.log(`📅 [STEP] Selecting ${label}: ${dateObj.day} ${dateObj.month} ${dateObj.year}`);
            await page.locator(rowSelector).click();
            await page.locator('#scwYears').selectOption(dateObj.year.toString());
            await page.locator('#scwMonths').selectOption(dateObj.month);
            await page.getByRole('cell', { name: dateObj.day.toString(), exact: true }).first().click();
        }

        const photoPath = 'D:/imm-automations/permit/passport_photo.jpg';

        // Login
        console.log('🔐 [STEP] Logging in...');
        await page.goto(testData.url || 'https://fns.immigration.go.ke/account/login.html');
        await page.getByRole('textbox', { name: 'you@example.com' }).fill(testData.login.email);
        await page.getByRole('textbox', { name: 'Id No/Passport No/Alien No' }).fill(testData.login.idNumber);
        await page.getByRole('textbox', { name: 'Password' }).fill(testData.login.password);
        await page.getByRole('button', { name: 'Login' }).click();

        // Navigate to application
        console.log('🌐 [STEP] Navigating to application form...');
        try {
            await page.getByRole('button', { name: 'close' }).click({ timeout: 5000 });
        } catch (e) {
            console.log('ℹ️ No notification modal to close, continuing...');
        }
        await page.getByRole('link', { name: 'Submit new applications ' }).click();
        await page.locator('.panel > a').first().click();
        
        console.log('🌐 [STEP] Selecting Class D...');
        await page.locator('div:nth-child(7) > div > .panel > .panel-body > .col-md-2 > .btn').click();
        await page.getByRole('link', { name: 'Apply Now' }).click();

        // Fill application form
        console.log('📝 [STEP 1] Filling application form...');
        const formData = testData.formData;
        
        await page.locator('#applicationtypeId').selectOption(formData.applicationTypeId);

        // Personal Information
        const cleanVal = (val) => val.toString().replace(/[^0-9]/g, '');
        await page.getByPlaceholder('Previous Permit Number').fill(cleanVal(formData.previousPermitNumber));
        await page.getByPlaceholder('2', { exact: true }).fill(cleanVal(formData.previousPermitNumber2));
        await page.getByRole('textbox', { name: 'File R. Number' }).fill(cleanVal(formData.fileRNumber));
        await page.locator('#surname').fill(formData.surname);
        await page.locator('#othernames').fill(formData.otherNames);
        await page.locator('#countryOfBirth').selectOption(formData.countryOfBirth);

        // Date of Birth
        await selectDatePickerDate('tr:has-text("Date of Birth") [placeholder="Click to choose date"]', formData.dob, 'Date of Birth');

        await page.locator('#genderId').selectOption(formData.genderId);
        await page.locator('#presentNationality').selectOption('3'); 

        // Passport Information
        await page.locator('#passport_no').fill(formData.passportNo);
        await selectDatePickerDate('tr:has-text("Passport Date") [placeholder="Click to choose date"]', formData.passportIssueDate, 'Passport Issue Date');
        await selectDatePickerDate('tr:has-text("Passport Valid until") [placeholder="Click to choose date"]', formData.passportExpiryDate, 'Passport Valid until');
        await page.locator('#placeOfIssue').fill(formData.placeOfIssue);

        // Contact Information
        await page.getByRole('row', { name: /Phone Number/i }).getByPlaceholder('eg(254 711111111)').fill(formData.phoneNumber);
        await page.locator('#email_address').fill(formData.emailAddress);

        // Address Information
        await page.getByRole('textbox', { name: 'Enter Postal Address e.g' }).fill(formData.postalAddress);
        await page.getByRole('textbox', { name: 'Enter Postal Code e.g -' }).fill(formData.postalCode);
        await page.locator('#city').fill(formData.city);
        await page.getByRole('row', { name: /Kenyan cellphone/i }).getByPlaceholder('eg(254 711111111)').fill(formData.kenyanPhoneNumber);
        await page.locator('#county').selectOption(formData.countyId);
        
        console.log('📝 [STEP] Selecting Sub-County (Second Item)...');
        await page.waitForTimeout(1000); 
        await page.locator('#subcounty').selectOption({ index: 1 });

        await page.locator('#location').fill(formData.location);
        await page.locator('#road').fill(formData.road);
        await page.locator('#plotNo').fill(formData.plotNo);
        await page.getByRole('textbox', { name: 'Enter nearest Landmark' }).fill(formData.nearestLandmark);
        await page.locator('#town').fill(formData.town);

        // Additional Information
        await page.locator('#imigrationStatus').selectOption(formData.immigrationStatus);
        await page.getByRole('textbox', { name: 'Name of Employer/Business' }).fill(formData.employerName);
        await page.locator('#highest_education_level').selectOption(formData.educationLevel);
        await page.getByRole('textbox', { name: 'Profession/Area of Speciality' }).fill(formData.profession);

        // Home Country Information
        await page.getByRole('textbox', { name: 'Telephone No. in Home Country' }).fill(formData.homeTelephone);
        await page.getByRole('textbox', { name: 'Physical Address in Home' }).fill(formData.homeAddress);
        await page.locator('#nameOfSpouse').fill(formData.spouseName);

        // Upload photo
        console.log('📤 [STEP] Uploading document...');
        await page.locator('#photoToUpload').setInputFiles(photoPath);

        console.log('✅ Automation completed successfully FOR STEP 1!');
        await page.locator('#Div3 > form > table > tbody > tr:nth-child(22) > td:nth-child(2) > input').click();
        
        console.log('✅ Automation completed successfully FOR SUBMITTING STEP 1!');

        // --- STEP 2: DEPENDANTS, PREVIOUS PERMITS, DECLINED APPLICATIONS ---
        console.log('🚀 [STEP 2] Starting Dependant and Additional Information...');
        const step2 = testData.step2Data;

        // 1. Fill Dependant Information
        console.log('📝 [STEP 2] Filling Dependant Details...');
        await page.locator('#firstname').fill(step2.dependant.firstName);
        await page.locator('#middlename').fill(step2.dependant.middleName);
        await page.locator('#surname').last().fill(step2.dependant.surname); 
        await selectDatePickerDate('#dateOfBirth', step2.dependant.dob, 'Dependant DOB');
        await page.locator('#genderId').last().selectOption(step2.dependant.genderId);
        await page.locator('#countryofBirth').selectOption(step2.dependant.countryOfBirthId);

        console.log('💾 [STEP 2] Saving Dependant details...');
        await page.locator('#loaddependant > form > table > tbody > tr:nth-child(7) > td:nth-child(2) > input').click();
        await page.waitForTimeout(1000);

        // 2. Select Permit Class and Type 
        console.log('📝 [STEP 2] Filling Permit Class and Type...');
        await fillOrSelect('#permitclassId', step2.permitDetails.permitClassId);
        await fillOrSelect('#permittype', step2.permitDetails.permitType);
        
        // 3. Fill Previous Permit Details
        console.log('📝 [STEP 2] Filling Previous Permit details...');
        await page.locator('#permitNo').fill(step2.permitDetails.permitNo);
        await selectDatePickerDate('#dateIssued', step2.permitDetails.dateIssued, 'Previous Permit Issue Date');
        await fillOrSelect('#duration', step2.permitDetails.duration);

        console.log('💾 [STEP 2] Saving previous permit details...');
        await page.locator('#loadpreviouspermit > form > table > tbody > tr:nth-child(6) > td:nth-child(2) > input').click();
        await page.waitForTimeout(1000);

        // 4. Fill Declined Application Details
        console.log('📝 [STEP 2] Filling Declined Application details...');
        await fillOrSelect('#declinedpermitclass', step2.declinedApplication.permitClassId);
        await selectDatePickerDate('#declineddateOfapplication', step2.declinedApplication.dateOfApplication, 'Declined Date');
        await fillOrSelect('#declinedpermittype', step2.declinedApplication.permitType);
        await page.locator('#reasons').fill(step2.declinedApplication.reasons);

        console.log('💾 [STEP 2] Saving declined applications...');
        await page.locator('#loaddeclinedapplication > form > table > tbody > tr:nth-child(5) > td:nth-child(2) > input').click();
        await page.waitForTimeout(2000);

        // 5. Final Proceed 
        console.log('🚀 [STEP 2] Clicking Proceed to review page...');
        await page.locator('#page-wrapper > div > div.panel-body > form > input.btn.btn-success').click();

        console.log('✅ Automation completed successfully FOR ALL STEP 2!');

        // --- STEP 3: EDUCATIONAL, TECHNICAL, EXPERIENCE, SKILLS ---
        console.log('🚀 [STEP 3] Starting Educational and Experience Details...');
        const step3 = testData.step3Data;

        // 1. Educational Qualifications
        console.log('📝 [STEP 3] Filling Educational Qualifications...');
        await page.locator('#institution').fill(step3.educational.institution);
        await page.locator('#description').fill(step3.educational.description);
        await selectDatePickerDate('#startdate', step3.educational.startDate, 'Education Start Date');
        await selectDatePickerDate('#enddate', step3.educational.endDate, 'Education End Date');
        await page.locator('#educationalfileToUpload').setInputFiles(photoPath);
        
        console.log('💾 [STEP 3] Saving Employee Qualifications...');
        await page.locator('#loadeducationalupload > form > input').click();
        await page.waitForTimeout(1000);

        // 2. Technical Details
        console.log('📝 [STEP 3] Filling Technical Details...');
        await fillOrSelect('#technicalinstitution', step3.technical.institution);
        await page.locator('#technicaldescription').fill(step3.technical.description);
        await selectDatePickerDate('#technicalstartdate', step3.technical.startDate, 'Technical Start Date');
        
        console.log('📅 [STEP 3] Selecting Technical End Date (Today)...');
        await page.locator('#technicalenddate').click();
        await page.locator('#scwNow').click();
        
        await page.locator('#fileToUpload').setInputFiles(photoPath);
        console.log('💾 [STEP 3] Saving Technical Details...');
        await page.locator('#loadtechnicalupload > form > table > tbody > tr:nth-child(10) > td:nth-child(2) > input').click();
        await page.waitForTimeout(1000);

        // 3. Previous Experience
        console.log('📝 [STEP 3] Filling Previous Experience...');
        await page.locator('#employer').fill(step3.experience.employer);
        await page.locator('#natureOfEmployment').fill(step3.experience.natureOfEmployment);
        await selectDatePickerDate('#employmentstartdate', step3.experience.startDate, 'Experience Start Date');
        await selectDatePickerDate('#employmentenddate', step3.experience.endDate, 'Experience End Date');
        await page.locator('#employmentfileToUpload').setInputFiles(photoPath);
        
        console.log('💾 [STEP 3] Saving Previous Experience...');
        await page.locator('#loademploymentupload > form > table:nth-of-type(2) > tbody > tr:nth-child(8) > td:nth-child(2) > input').click();
        await page.waitForTimeout(1000);

        // 4. Skills
        console.log('📝 [STEP 3] Filling Skills...');
        await page.locator('#confirmskilldescription').fill(step3.skills.description);
        await page.locator('#skillsfileToUpload').setInputFiles(photoPath);
        
        console.log('💾 [STEP 3] Saving Skills...');
        await page.locator('#loadskills > form > table > tbody > tr:nth-child(5) > td:nth-child(2) > input').click();

        console.log('✅ Automation completed successfully FOR ALL STEPS (1, 2, 3)!');

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
    } finally {
        // Keep browser open
    }
})();