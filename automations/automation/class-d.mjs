import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFormHelpers, loginToPortal, dismissPopup, safeRemoveFile, handleDocumentUpload, wait } from './form-helpers.mjs';
import { createStealthBrowser } from './browser-setup.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAutomation(formData) {
    console.log('===========================================================');
    console.log('🚀 STARTING CLASS D PERMIT AUTOMATION');
    console.log(`📅 Timestamp: ${new Date().toLocaleString()}`);
    console.log('===========================================================');

    const { browser, context, page } = await createStealthBrowser();
    console.log('🖥️  Browser launched with stealth mode.');

    let downloadedPhotoPath = null;

    try {

        const formHelpers = createFormHelpers(page);
        const { fillOrSelect, selectDatePickerDate, uploadFile, downloadFile } = formHelpers;

        // --- PREPARE PHOTO ---
        const rawPhotoPath = formData.photoPath || formData.formData?.photoPath || '';
        let finalPhotoPath = rawPhotoPath;

        if (rawPhotoPath && (rawPhotoPath.startsWith('http') || rawPhotoPath.startsWith('https'))) {
            console.log(`📸 [PHOTO] URL detected, initiating download...`);
            try {
                downloadedPhotoPath = await downloadFile(rawPhotoPath);
                finalPhotoPath = downloadedPhotoPath;
                console.log(`   ✅ Photo downloaded to: ${finalPhotoPath}`);
            } catch (err) {
                console.error('   ❌ Failed to download photo:', err.message);
                finalPhotoPath = null;
            }
        } else if (rawPhotoPath) {
            console.log(`📸 [PHOTO] Local path detected: ${rawPhotoPath}`);
        } else {
            console.log(`⚠️ [PHOTO] No photo path provided.`);
        }

        // --- LOGIN ---
        console.log('-----------------------------------------------------------');
        console.log('🔐 [STEP 0] LOGIN');
        console.log(`   👤 User: ${formData.login.email}`);
        
        await loginToPortal(page, formData.login, formData.url);
        console.log('   ✅ Login action completed.');

        // --- NAVIGATION ---
        console.log('-----------------------------------------------------------');
        console.log('🌐 [STEP 0.5] NAVIGATION');
        
        // Close modal if exists
        await dismissPopup(page);

        const data = formData.formData;
        const isRenewal = data.applicationType === 'renewal' || data.applicationTypeId === '5';

        if (isRenewal) {
            console.log('   🔄 [MODE] RENEWAL Application detected.');
            console.log('   ➡️  Navigating directly to renewal form...');
            await page.goto('https://fns.immigration.go.ke/dash/permit/form25start.php?class=18');
        } else {
            console.log('   🆕 [MODE] NEW Application detected.');
            console.log('   ➡️  Navigating via menu structure...');
            await page.getByRole('link', { name: 'Submit new applications ' }).click();
            await page.locator('.panel > a').first().click();
            await page.locator('div:nth-child(7) > div > .panel > .panel-body > .col-md-2 > .btn').click();
            await page.getByRole('link', { name: 'Apply Now' }).click();
        }
        console.log('   ✅ Target form loaded.');

        // --- STEP 1: PERSONAL INFO ---
        console.log('-----------------------------------------------------------');
        console.log('📝 [STEP 1] PERSONAL & CONTACT INFO');

        const cleanVal = (val) => val ? val.toString().replace(/[^0-9]/g, '') : '';

        // Permit Config
        console.log('   🔹 Configuring Permit Details...');
        await fillOrSelect('#applicationtypeId', data.applicationTypeId || (isRenewal ? '5' : '1'), 'Application Type');
        await fillOrSelect('#prevpermit', cleanVal(data.previousPermitNumber), 'Previous Permit Number');
        await fillOrSelect('#preferred_duration', cleanVal(data.applicationDuration) || '24', 'Application Duration');
        await fillOrSelect('#permitclassId', data.permitClassId || 'CLASS D- Employment', 'Permit Class');
        await fillOrSelect('#fileR', cleanVal(data.fileRNumber), 'File R. Number');

        // Personal Info
        console.log('   🔹 Filling Personal Details...');
        await fillOrSelect('#surname', data.surname, 'Surname');
        await fillOrSelect('#othernames', data.otherNames, 'Other Names');
        await fillOrSelect('#countryOfBirth', data.countryOfBirth, 'Country of Birth');
        await selectDatePickerDate('tr:has-text("Date of Birth") [placeholder="Click to choose date"]', data.dob, 'Date of Birth');
        await fillOrSelect('#genderId', data.genderId, 'Gender');
        await fillOrSelect('#presentNationality', data.nationality || 'INDIAN', 'Nationality');

        // Passport
        console.log('   🔹 Filling Passport Details...');
        await fillOrSelect('#passport_no', data.passportNo, 'Passport Number');
        await selectDatePickerDate('#dateOfIssue', data.passportIssueDate, 'Passport Issue Date');
        await selectDatePickerDate('#passportExpiryDate', data.passportExpiryDate, 'Passport Expiry Date');
        await fillOrSelect('#placeOfIssue', data.placeOfIssue, 'Place of Issue');

        // Contact
        console.log('   🔹 Filling Contact Details...');
        const phoneNumber = data.phoneNumber || data.kenyanCellphone || data.kenyanPhoneNumber || data.phone_no;
        await fillOrSelect('#phone_no', phoneNumber, 'Phone Number');
        await fillOrSelect('#email_address', data.emailAddress || data.email || data.email_address, 'Email Address');
        await fillOrSelect('#postaladdress', data.postalAddress || data.postaladdress || data.homeAddress, 'Postal Address');
        await fillOrSelect('#postalcode', data.postalCode || data.postalcode, 'Postal Code');
        await fillOrSelect('#city', data.city || data.town, 'City/Town');
        await fillOrSelect('#kenyancellphone', data.kenyanCellphone || data.phoneNumber || phoneNumber, 'Kenyan Cellphone');

        // Location
        console.log('   🔹 Filling Location Details...');
        await fillOrSelect('#county', data.countyId || data.county, 'County');
        console.log('      ⏳ Waiting for Subcounties to load...');
        await wait(2.5); 
        await fillOrSelect('#subcounty', data.subcounty || data.subcountyId, 'Subcounty');
        await fillOrSelect('#location', data.location || data.locationEstate, 'Location');
        await fillOrSelect('#road', data.road || data.street, 'Road');
        await fillOrSelect('#plotNo', data.plotNo || data.buildingName, 'Plot Number');
        await fillOrSelect('#landmark', data.landmark || data.nearestLandmark, 'Nearest Landmark');
        await fillOrSelect('#town', data.town || data.city, 'Town');

        // Additional
        console.log('   🔹 Filling Employment/Status Details...');
        await fillOrSelect('#imigrationStatus', data.immigrationStatus || data.imigrationStatus || data.currentStatus, 'Immigration Status');
        await fillOrSelect('#name_employer_business', data.employerName || data.employerBusiness || data.name_employer_business, 'Employer/Business Name');
        await fillOrSelect('#highest_education_level', data.highestEducationLevel || data.educationLevel || data.highest_education_level, 'Highest Education Level');
        await fillOrSelect('#profession', data.profession || data.occupation, 'Profession/Area of Speciality');
        
        await fillOrSelect('#home_country_paddress', data.homeCountryAddress || data.homeAddress || data.homeCountryPaddress, 'Home Country Address');
        await fillOrSelect('#phone_no_home_country', data.homeCountryTelephone || data.homeTelephone || data.phoneNoHomeCountry, 'Home Country Telephone');
        await fillOrSelect('#nameOfSpouse', data.nameOfSpouse || data.spouseName, 'Spouse Name');

        // Photo Upload
        console.log('   🔹 Uploading Passport Photo...');
        if (finalPhotoPath) {
            await uploadFile('#photoToUpload', finalPhotoPath);
        } else {
            console.log('      ⚠️ Skipping photo upload (No path provided)');
        }

        // Save
        console.log('   💾 Saving Step 1...');
        try {
            // Safer selector for the Save button
            const saveButton = page.locator('input[type="submit"][value="Save"]').first();
            
            // Wait a moment for UI to stabilize
            await wait(1);

            await Promise.all([
                page.waitForNavigation({ timeout: 45000 }).catch(() => console.log('      ℹ️ Navigation notice after Save')),
                saveButton.click({ force: true })
            ]);
            
            console.log('   ✅ Step 1 Save Clicked.');
            await wait(2); 
        } catch (e) {
            console.log('   ❌ Save failed:', e.message);
        }

        // --- TRANSITION / RECOVERY HANDLER ---
        console.log('-----------------------------------------------------------');
        console.log('🔄 [TRANSITION] Checking application state...');
        
        let currentUrl = page.url();
        console.log(`   📍 Current URL: ${currentUrl}`);

        // FIX: If redirected to Dashboard (form25.php without query params), finding and resuming the app
        if (currentUrl.includes('form25.php') && !currentUrl.includes('start')) {
            console.log('   ⚠️ Redirected to Dashboard. Attempting to resume application...');
            
            // Look for the "Edit" icon/link in the first row of the table
            // Usually formatted as <a href="form25.php?id=...">Edit</a> or similar icon
            try {
                // Wait for table to load
                await page.locator('table').first().waitFor({ state: 'visible', timeout: 5000 });
                
                // Assuming new app is at top. Locator for the Edit link/button in first row.
                // Adjust selector if needed: often .btn-info or .btn-primary or 'Edit' text
                const editButton = page.locator('table tbody tr:first-child a').first();
                
                if (await editButton.isVisible()) {
                    console.log('   🖱️ Clicking "Edit/Resume" on top-most application...');
                    await Promise.all([
                        page.waitForNavigation(),
                        editButton.click()
                    ]);
                    console.log('   ✅ Resumed application successfully.');
                } else {
                    console.log('   ❌ Could not find an "Edit" button on the dashboard.');
                }
            } catch (e) {
                console.log(`   ❌ Auto-resume failed: ${e.message}`);
                console.log('   ℹ️  Continuing to check for next steps just in case...');
            }
        }

        // Initialize helper for document uploads in later steps
        const formDataObj = formData.formData || {};

        // =========================================================================
        // STEP 2: DEPENDANTS & PERMITS
        // =========================================================================
        console.log('-----------------------------------------------------------');
        console.log('🚀 [STEP 2] DEPENDANTS & PREVIOUS PERMITS');

        // 1. Dependants
        const dependantsList = Array.isArray(formDataObj.dependantDetails) ? formDataObj.dependantDetails : 
                             (Array.isArray(formDataObj.dependant) ? formDataObj.dependant : 
                             (formDataObj.dependantDetails ? [formDataObj.dependantDetails] : []));
        
        console.log(`   📋 Dependants found: ${dependantsList.length}`);

        if (dependantsList.length > 0) {
            for (let i = 0; i < dependantsList.length; i++) {
                const dep = dependantsList[i];
                console.log(`      👤 Processing Dependant ${i + 1}: ${dep.firstName}`);

                if (i > 0) {
                    console.log('         ➕ Clicking "Add Dependant"...');
                    await page.locator('div.panel-body > input:nth-of-type(1)').click();
                    await wait(1.5);
                }

                await fillOrSelect('#firstname', dep.firstName, 'First Name');
                await fillOrSelect('#middlename', dep.middleName, 'Middle Name');
                await fillOrSelect('#surname:last-of-type', dep.surname, 'Surname');
                await selectDatePickerDate('#dateOfBirth', dep.dob, 'Date of Birth');
                await fillOrSelect('#genderId', dep.genderId, 'Gender');
                await fillOrSelect('#countryofBirth', dep.countryOfBirthId, 'Country of Birth');

                console.log(`         💾 Saving Dependant ${i + 1}...`);
                await Promise.all([
                    page.waitForNavigation({ timeout: 45000 }).catch(() => {}),
                    page.locator('#loaddependant > form > table > tbody > tr:nth-child(7) > td:nth-child(2) > input').click()
                ]);
            }
        }

        // 2. Previous Permits
        const permitList = Array.isArray(formDataObj.permitDetails) ? formDataObj.permitDetails : (formDataObj.permitDetails ? [formDataObj.permitDetails] : []);
        console.log(`   📋 Previous Permits found: ${permitList.length}`);

        if (permitList.length > 0) {
            for (let i = 0; i < permitList.length; i++) {
                const permit = permitList[i];
                console.log(`      🎫 Processing Permit ${i + 1}: ${permit.permitNo}`);

                if (i > 0) {
                    console.log('         ➕ Clicking "Add Previous Permit"...');
                    await page.locator('div.panel-body > input:nth-of-type(2)').click();
                    await wait(1.5);
                }

                await fillOrSelect('#permitclassId', permit.permitClassId, 'Permit Class');
                await fillOrSelect('#permittype', permit.permitType, 'Permit Type');
                await fillOrSelect('#permitNo', permit.permitNo, 'Permit Number');
                await selectDatePickerDate('#dateIssued', permit.dateIssued, 'Issue Date');
                await page.keyboard.press('Escape'); 
                await page.waitForTimeout(500);

                // --- DEFENSIVE DURATION HANDLING ---
                let rawDuration = String(permit.duration || '2');
                let permitDuration = '2 years'; 
                
                if (rawDuration.includes('1')) permitDuration = '1 year';
                else if (rawDuration.includes('2')) permitDuration = '2 years';
                else if (rawDuration.includes('3')) permitDuration = '3 years';
                else if (rawDuration.includes('4')) permitDuration = '4 years';
                else if (rawDuration.includes('5')) permitDuration = '5 years';
                
                if (rawDuration.includes('Invalid') || rawDuration === 'undefined' || rawDuration === '') {
                    console.log(`         ℹ️ Duration invalid/missing ("${rawDuration}"), defaulting to "2 years"`);
                }
                
                await fillOrSelect('#duration', permitDuration, 'Duration');
                await page.keyboard.press('Escape'); 

                console.log(`         💾 Saving Permit ${i + 1}...`);
                await Promise.all([
                    page.waitForNavigation({ timeout: 45000 }).catch(() => console.log('         ℹ️ Navigation timeout after saving permit')),
                    page.locator('#loadpreviouspermit > form > table > tbody > tr:nth-child(6) > td:nth-child(2) > input').click({ force: true }).catch(() =>
                        page.getByRole('button', { name: 'Save previous permit details' }).click({ force: true })
                    )
                ]);
            }
        }

        console.log('   ➡️  Proceeding to Step 3...');
        await page.keyboard.press('Escape'); 
        try {
            await Promise.all([
                page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle' }).catch(() => console.log('   ℹ️ Navigation timeout (Step 2 -> 3)')),
                page.locator('input[value="Proceed"]').last().click({ force: true }).catch(() => 
                    page.getByRole('button', { name: 'Proceed' }).click({ force: true })
                )
            ]);
            console.log('   ✅ Proceeded from Step 2.');
        } catch(e) {
            console.log(`   ⚠️ Proceed click failed: ${e.message}`);
        }

        // =========================================================================
        // STEP 3: DOCS & EXPERIENCE (PART I OF FORM 25)
        // =========================================================================
        console.log('-----------------------------------------------------------');
        console.log('🚀 [STEP 3] EDUCATION, EXPERIENCE & DOCUMENTS');
        
        await page.waitForTimeout(2000);

        // 1. Education/Academic
        const education = Array.isArray(formDataObj.educational) ? formDataObj.educational[0] : formDataObj.educational;
        if (education) {
            console.log('   🎓 [STEP 3] Filling Academic Qualifications...');
            await fillOrSelect('#institution', education.institution || education.university || 'University', 'Institution');
            await fillOrSelect('#description', education.description || education.programme_name || 'Degree', 'Description');
            await selectDatePickerDate('#startdate', education.startDate || education.start_date, 'Start Date');
            await selectDatePickerDate('#enddate', education.endDate || education.end_date, 'End Date');
            await page.keyboard.press('Escape');

            await handleDocumentUpload(
                page, 
                '#educationalfileToUpload', 
                rawPhotoPath, 
                'academic_docs', 
                '#loadeducationalupload > form > input'
            );
        }

        // 2. Technical Qualifications
        const technical = Array.isArray(formDataObj.technical) ? formDataObj.technical[0] : formDataObj.technical;
        if (technical) {
            console.log('   🔧 [STEP 3] Filling Technical Qualifications...');
            await fillOrSelect('#technicalinstitution', technical.institution || technical.profession || data.profession, 'Profession Dropdown');
            await page.locator('#technicaldescription').fill(technical.description || 'Professional qualifications and certifications');
            await selectDatePickerDate('#technicalstartdate', technical.startDate, 'Start Date');
            await selectDatePickerDate('#technicalenddate', technical.endDate || { year: '2020', month: 'Jan', day: '01' }, 'End Date');
            await page.keyboard.press('Escape');

            await handleDocumentUpload(
                page, 
                '#fileToUpload', 
                rawPhotoPath, 
                'technical_docs', 
                'input[value="Save technical details"]'
            );
        }

        // 3. Previous Experience
        const experience = Array.isArray(formDataObj.experience) ? formDataObj.experience[0] : formDataObj.experience;
        if (experience) {
            console.log('   💼 [STEP 3] Filling Previous Experience...');
            await fillOrSelect('#employer', experience.employer || 'Previous Employer', 'Employer');
            await page.locator('#natureOfEmployment').fill(experience.natureOfEmployment || 'Management and Operations');
            await selectDatePickerDate('#employmentstartdate', experience.startDate, 'Start Date');
            await selectDatePickerDate('#employmentenddate', experience.endDate, 'End Date');
            await page.keyboard.press('Escape');

            await handleDocumentUpload(
                page, 
                '#employmentfileToUpload', 
                rawPhotoPath, 
                'experience_docs', 
                'input[value="Save previous experience"]'
            );
        }

        // 4. Skills confirmation (Confirming no local skills)
        console.log('   🎯 [STEP 3] Filling Local Skills Confirmation...');
        await page.locator('#confirmskilldescription').fill(formDataObj.skillsDescription || 'No local qualified personnel found for this specific technical role despite advertising.');
        await handleDocumentUpload(
            page, 
            '#skillsfileToUpload', 
            rawPhotoPath, 
            'skills_proof', 
            '#loadskills > form > table > tbody input[value="Save"]'
        );

        // --- FINAL SUBMIT ---
        console.log('🚀 [FINAL] Submitting entire Step 3 application...');
        await Promise.all([
            page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle' }).catch(() => {}),
            page.locator('input[value="Save and Submit"]').click({ force: true })
        ]);

        console.log('===========================================================');
        console.log('✅ CLASS D AUTOMATION COMPLETED SUCCESSFULLY!');
        console.log('===========================================================');
        return { success: true, message: 'Class D Automation completed successfully!' };

    } catch (error) {
        console.error('===========================================================');
        console.error('❌ FATAL ERROR:', error.message);
        console.error('===========================================================');
        throw error;
    } finally {
        if (downloadedPhotoPath) {
            safeRemoveFile(downloadedPhotoPath);
        }
    }
}

export async function runClassDAutomation(formData) {
    return await runAutomation(formData);
}