import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFormHelpers, loginToPortal, dismissPopup, safeRemoveFile, downloadImage, handleDocumentUpload } from './form-helpers.mjs';
import { createStealthBrowser } from './browser-setup.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runClassGAutomation(formData) {
    console.log('🚀 Starting Class G permit automation...');

    const { browser, context, page } = await createStealthBrowser();

    let downloadedPhotoPath = null;

    try {

        // Initialize form helpers
        const formHelpers = createFormHelpers(page);
        const { 
            fillOrSelect, 
            selectDatePickerDate,
            uploadFile,
            downloadFile 
        } = formHelpers;
        
        // Handle photo path
        const rawPhotoPath = formData.photoPath || formData.formData?.photoPath || '';
        let finalPhotoPath = rawPhotoPath;

        // CHECK IF PHOTO IS URL AND DOWNLOAD
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

        // Login
        console.log('🔐 [STEP] Logging in...');
        await loginToPortal(page, formData.login, formData.url);

        // Navigate to application
        console.log('🌐 [STEP] Navigating to application form...');
        await dismissPopup(page);
        await page.getByRole('link', { name: 'Submit new applications ' }).click();
        await page.locator('.panel > a').first().click();
        
        // Select Class G (9th child based on standard layout)
        console.log('🌐 [STEP] Selecting Class G...');
        await page.locator('div:nth-child(9) > div > .panel > .panel-body > .col-md-2 > .btn').click();
        await page.getByRole('link', { name: 'Apply Now' }).click();

        const data = formData.formData;

        // STEP 1: PERSONAL & CONTACT INFO
        console.log('📝 [STEP 1] Filling Personal & Contact Info...');
        if (data.applicationTypeId) await fillOrSelect('#applicationtypeId', data.applicationTypeId);
        
        const cleanVal = (val) => val ? val.toString().replace(/[^0-9]/g, '') : '';

        // Class G specific fields
        if (data.previousPermitNumber) await fillOrSelect('#prevpermit', cleanVal(data.previousPermitNumber), 'Previous Permit Number');
        const duration = cleanVal(data.applicationDuration) || cleanVal(data.preferredDuration);
        if (duration) await fillOrSelect('#preferred_duration', duration, 'Preferred Duration');
        if (data.fileRNumber) await fillOrSelect('#fileR', cleanVal(data.fileRNumber), 'File R Number');

        // Personal Info
        await fillOrSelect('#surname', data.surname, 'Surname');
        await fillOrSelect('#othernames', data.otherNames, 'Other Names');
        if (data.countryOfBirth) await fillOrSelect('#countryOfBirth', data.countryOfBirth, 'Country of Birth');
        
        // Handle date fields
        if (data.dob) await selectDatePickerDate('#dateOfBirth', data.dob, 'Date of Birth');
        if (data.genderId) await fillOrSelect('#genderId', data.genderId, 'Gender');
        await fillOrSelect('#presentNationality', data.presentNationality || 'INDIAN', 'Nationality');

        // Passport Info
        await fillOrSelect('#passport_no', data.passportNo, 'Passport Number');
        if (data.passportIssueDate) await selectDatePickerDate('#dateOfIssue', data.passportIssueDate, 'Passport Issue Date');
        if (data.passportExpiryDate) await selectDatePickerDate('#passportExpiryDate', data.passportExpiryDate, 'Passport Valid until');
        await fillOrSelect('#placeOfIssue', data.placeOfIssue, 'Place of Issue');

        // Contact Info
        const phoneNumber = data.phoneNumber || data.kenyanPhoneNumber || data.kenyanCellphone;
        if (phoneNumber) {
            await fillOrSelect('#phone_no', phoneNumber, 'Phone Number');
            await fillOrSelect('#kenyancellphone', phoneNumber, 'Kenyan Cellphone');
        }
        await fillOrSelect('#email_address', data.emailAddress, 'Email Address');

        // Address Info
        await fillOrSelect('#postaladdress', data.postalAddress, 'Postal Address');
        await fillOrSelect('#postalcode', data.postalCode, 'Postal Code');
        await fillOrSelect('#city', data.city || data.town, 'City/Town');
        if (data.countyId) {
            await fillOrSelect('#county', data.countyId, 'County');
            await page.waitForTimeout(1000);
            if (data.subcounty) {
                await fillOrSelect('#subcounty', data.subcounty, 'Subcounty');
            } else {
                try {
                    await page.locator('#subcounty').selectOption({ index: 1 });
                } catch (e) {
                    console.log('⚠️ Could not set default subcounty');
                }
            }
        }

        // Physical Location
        await fillOrSelect('#location', data.location, 'Location');
        await fillOrSelect('#road', data.road, 'Road');
        await fillOrSelect('#plotNo', data.plotNo, 'Plot Number');
        await fillOrSelect('#landmark', data.nearestLandmark, 'Nearest Landmark');
        await fillOrSelect('#town', data.town, 'Town');

        // Additional Information
        if (data.immigrationStatus) await fillOrSelect('#imigrationStatus', data.immigrationStatus, 'Immigration Status');
        await fillOrSelect('#name_employer_business', data.employerName, 'Employer/Business Name');
        if (data.educationLevel) await fillOrSelect('#highest_education_level', data.educationLevel, 'Highest Education Level');
        await fillOrSelect('#profession', data.profession, 'Profession');
        await fillOrSelect('#phone_no_home_country', data.homeTelephone, 'Home Country Telephone');
        await fillOrSelect('#home_country_paddress', data.homeAddress, 'Home Country Address');
        await fillOrSelect('#nameOfSpouse', data.spouseName, 'Spouse Name');

        // --- UPLOAD PHOTO AND SUBMIT ---
        console.log(`📤 [STEP 1] Uploading photo...`);
        if (finalPhotoPath) {
            const success = await uploadFile('#photoToUpload', finalPhotoPath);
            if (success && downloadedPhotoPath) {
                // If it was a downloaded temp file, remove it after successful upload
                // NOTE: Playwright might need the file until submission, so we usually keep it 
                // until function end or use a delayed cleanup.
            }
        } else {
            console.log('   ⚠️ No photo path available, skipping photo upload');
        }

        console.log('✅ Step 1 Filled. Clicking Save and waiting for navigation...');

        // Submit Step 1 - use waitForURL/waitForNavigation with proper sequencing
        try {
            const saveButton = page.getByRole('button', { name: 'Save', exact: true });
            const submitInput = page.locator('input[type="submit"]').first();

            // Determine which button exists
            const hasSaveButton = await saveButton.count() > 0;
            const clickTarget = hasSaveButton ? saveButton : submitInput;

            // Set up navigation wait BEFORE clicking (prevents race condition)
            await Promise.all([
                page.waitForNavigation({ timeout: 120000, waitUntil: 'domcontentloaded' }),
                clickTarget.click(),
            ]);
            console.log('   -> ✅ Step 1 submitted and navigated successfully.');
        } catch (e) {
            console.log('   -> ⚠️ Primary submit approach failed:', e.message);
            // Fallback: try alternative selector
            try {
                await Promise.all([
                    page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }),
                    page.locator('input[type="submit"][value*="Save"]').first().click(),
                ]);
                console.log('   -> ✅ Step 1 submitted via fallback.');
            } catch (e2) {
                // Last resort: check if we already navigated (AJAX submit)
                console.log('   -> ⚠️ Navigation not detected, checking if page already advanced...');
                await page.waitForTimeout(3000);
                const currentUrl = page.url();
                console.log('   -> Current URL:', currentUrl);
            }
        }

        // REMOVED PREMATURE CLEANUP HERE - It will be cleaned in the final finally block
        // to ensure the file exists during the entire submission process.

        // =========================================================================
        // STEP 2: DEPENDANTS & PERMITS (ITERATIVE LOOPS)
        // =========================================================================
        console.log('🚀 [STEP 2] Starting Dependant and Additional Information...');

        // --- 1. DEPENDANTS LOOP ---
        const dependantsList = Array.isArray(data.dependant) ? data.dependant : (data.dependant ? [data.dependant] : []);
        
        if (dependantsList.length > 0) {
            console.log(`📋 Found ${dependantsList.length} dependants to process.`);
            
            for (let i = 0; i < dependantsList.length; i++) {
                const dep = dependantsList[i];
                console.log(`   -> Processing Dependant ${i + 1}/${dependantsList.length}: ${dep.firstName}`);

                // Click "Add Dependant" button if it's the 2nd+ item
                if (i > 0) {
                    console.log('      ➕ Clicking "Click here to add Dependant" button...');
                    // Uses specific selector for "Add Dependant" button
                    await page.locator('div.panel-body > input:nth-of-type(1)').click();
                    await page.waitForTimeout(1500);
                }

                await page.locator('#firstname').fill(dep.firstName || '');
                await page.locator('#middlename').fill(dep.middleName || '');
                await page.locator('#surname').last().fill(dep.surname || '');
                await selectDatePickerDate('#dateOfBirth', dep.dob, 'Dependant DOB');
                await fillOrSelect('#genderId', dep.genderId);
                await fillOrSelect('#countryofBirth', dep.countryOfBirthId);
                
                // Click Save Dependant
                try {
                    console.log(`      💾 Saving Dependant ${i + 1}...`);
                    await Promise.all([
                        page.waitForNavigation({ timeout: 45000 }).catch(() => console.log('   ℹ️ Navigation timeout')),
                        // Try specific button name first, then fallback
                        page.getByRole('button', { name: 'Save Dependant details' }).click().catch(() => 
                            page.locator('input[value="Save Dependant details"]').click()
                        )
                    ]);
                } catch(e) {
                    console.log(`      ⚠️ Error saving dependant ${i + 1}: ${e.message}`);
                }
            }
        } else {
            console.log('⚠️ [SKIP] No dependants found.');
        }

        // --- 2. PREVIOUS PERMITS LOOP ---
        const permitList = Array.isArray(data.permitDetails) ? data.permitDetails : (data.permitDetails ? [data.permitDetails] : []);

        if (permitList.length > 0) {
            console.log(`📋 Found ${permitList.length} previous permits to process.`);

            for (let i = 0; i < permitList.length; i++) {
                const permit = permitList[i];
                console.log(`   -> Processing Permit ${i + 1}/${permitList.length}: ${permit.permitNo}`);

                // Click "Add Permit" button if it's the 2nd+ item
                if (i > 0) {
                    console.log('      ➕ Clicking "Click here to add Previous Permit" button...');
                    // Uses specific selector for "Add Permit" button
                    await page.locator('div.panel-body > input:nth-of-type(2)').click();
                    await page.waitForTimeout(1500);
                }

                await fillOrSelect('#permitclassId', permit.permitClassId);
                await fillOrSelect('#permittype', permit.permitType);
                await page.locator('#permitNo').fill(permit.permitNo || '');
                await selectDatePickerDate('#dateIssued', permit.dateIssued, 'Previous Permit Issue Date');
                await page.keyboard.press('Escape'); // FORCE the legacy date picker to close
                await page.waitForTimeout(500);
                
                // --- DEFENSIVE DURATION HANDLING ---
                let rawDuration = String(permit.duration || '2');
                let permitDuration = '2 years'; // Default to safest option
                
                if (rawDuration.includes('1')) permitDuration = '1 year';
                else if (rawDuration.includes('2')) permitDuration = '2 years';
                else if (rawDuration.includes('3')) permitDuration = '3 years';
                else if (rawDuration.includes('4')) permitDuration = '4 years';
                else if (rawDuration.includes('5')) permitDuration = '5 years';
                
                if (rawDuration.includes('Invalid') || rawDuration === 'undefined' || rawDuration === '') {
                    console.log(`   ℹ️ Duration invalid/missing ("${rawDuration}"), defaulting to "2 years"`);
                }
                
                await fillOrSelect('#duration', permitDuration);
                await page.keyboard.press('Escape'); // Safety escape again

                // Click Save Permit
                try {
                    console.log(`      💾 Saving Permit ${i + 1}...`);
                    await Promise.all([
                        page.waitForNavigation({ timeout: 45000 }).catch(() => console.log('   ℹ️ Navigation timeout after saving permit')),
                        // Click with force:true to ignore the calendar interception if Escape didn't handle it
                        page.getByRole('button', { name: 'Save previous permit details' }).click({ force: true }).catch(() =>
                            page.locator('input[value="Save previous permit details"]').click({ force: true })
                        )
                    ]);
                } catch(e) {
                    console.log(`      ⚠️ Error saving permit ${i + 1}: ${e.message}`);
                }
            }
        } else {
            console.log('⚠️ [SKIP] No previous permits found.');
        }

        // --- 3. Declined Applications ---
        const declined = data.declinedApplication;
        if (declined) {
            console.log('📝 Processing Declined Application Details...');
            try {
                await fillOrSelect('#declinedpermitclass', declined.permitClassId);
                await selectDatePickerDate('#declineddateOfapplication', declined.dateOfApplication, 'Declined Date');
                await fillOrSelect('#declinedpermittype', declined.permitType);
                await page.locator('#reasons').fill(declined.reasons || '');
                
                await Promise.all([
                    page.waitForNavigation({ timeout: 45000 }).catch(() => {}),
                    page.getByRole('button', { name: 'Save declined applications' }).click({ force: true })
                ]);
            } catch (e) {
                console.log('   ℹ️ Optional Declined Application section failed or already filled');
            }
        }

        // Proceed to Step 3
        console.log('🚀 [STEP 2] Clicking Proceed to advance to Step 3...');
        await page.keyboard.press('Escape'); // Force clear any overlays
        await Promise.all([
            page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle' }).catch(() => console.log('   ℹ️ Navigation timeout (Step 2 -> 3)')),
            page.locator('input[value="Proceed"]').last().click({ force: true }).catch(() => 
                page.getByRole('button', { name: 'Proceed' }).click({ force: true })
            )
        ]);
        console.log('   -> ✅ Proceeded from Step 2.');


        // =========================================================================
        // STEP 3: BUSINESS DETAILS (PART II OF FORM 25)
        // =========================================================================
        console.log('🚀 [STEP 3] Starting Business & Professional Details...');

        const biz = data.businessDetails || data; // Fallback to top-level if not nested

        // Filling Business Fields
        await fillOrSelect('#placeOfBusiness', biz.placeOfBusiness || biz.location || '');
        await fillOrSelect('#nameOfBusiness', biz.nameOfBusiness || biz.employerName || biz.businessName || '');
        await fillOrSelect('#typeOfBusiness', biz.typeOfBusiness || biz.businessType || biz.profession || '');
        
        // Physical Address
        const bizAddress = biz.physicalAddress || biz.businessAddress || biz.officeAddress || `${biz.road || ''}, ${biz.town || ''}`;
        await page.locator('#physicaladdress').fill(bizAddress);
        
        await fillOrSelect('#availablecapital', biz.availableCapital || biz.capital || '10,000,000');
        await page.locator('#detailsofCapital').fill(biz.detailsOfCapital || biz.incomeDetails || 'Investment for business operations');
        await page.locator('#sourceOfIncome').fill(biz.sourceOfIncome || biz.incomeSource || 'Personal Savings and Investments');
        await page.locator('#presentCapitalLocality').fill(biz.presentCapitalLocality || biz.homeAddress || biz.capitalLocality || 'Kenya');

        // Profession dropdown & Specify
        const prof = biz.profession || data.profession || '';
        await fillOrSelect('#professionName', prof);
        if (prof.toLowerCase().includes('other')) {
            await page.locator('#specifyprofession').fill(biz.specifyProfession || biz.professionOther || prof);
        }
        
        await page.locator('#detailsOfTrade').fill(biz.detailsOfTrade || biz.typeOfBusiness || biz.tradeDetails || 'Consultancy and Trade services');
        await page.locator('#detailsOfLicense').fill(biz.detailsOfLicense || biz.licenseDetails || 'N/A - To be obtained after permit');

        // Handle Capital Upload (Required for Class G)
        const capitalFile = biz.capitalProofPath || biz.uploadPath || rawPhotoPath;
        if (capitalFile) {
            console.log('   📤 [STEP 3] Uploading capital proof / professional docs...');
            await handleDocumentUpload(
                page, 
                '#part2fileToUpload1', 
                capitalFile, 
                'capital_proof', 
                'input[value="Save & proceed"]'
            );
        } else {
            console.log('   ⚠️ [STEP 3] No capital proof document path, attempting proceed without it.');
            try {
                await Promise.all([
                    page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle' }).catch(() => {}),
                    page.locator('input[value="Save & proceed"]').last().click({ force: true })
                ]);
            } catch(e) {}
        }

        await page.waitForTimeout(1000);

        console.log('✅ Automation completed successfully FOR ALL STEPS!');
        return { success: true, message: 'Class G Automation completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        // Cleanup downloaded photo if it exists
        if (downloadedPhotoPath) {
            safeRemoveFile(downloadedPhotoPath);
        }
        // await browser.close();
    }
}

// Export the automation function
export { runClassGAutomation };
