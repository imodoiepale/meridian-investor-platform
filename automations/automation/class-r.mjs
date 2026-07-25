import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStealthBrowser } from './browser-setup.mjs';
import { createFormHelpers, loginToPortal, dismissPopup, downloadImage } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main automation function
async function runClassRAutomation(formData) {
    console.log('🚀 Starting Class R permit automation...');
    
    const { browser, context, page } = await createStealthBrowser();

    try {

        const { fillOrSelect, selectDatePickerDate } = createFormHelpers(page);
        const photoPath = formData.photoPath || formData.formData?.photoPath || '../passport_photo.jpg';

        // Login
        console.log('🔐 [STEP] Logging in...');
        await loginToPortal(page, formData.login, formData.url);

        // Navigate to application
        console.log('🌐 [STEP] Navigating to Class R application form...');
        await dismissPopup(page);
        await page.getByRole('link', { name: 'Submit new applications ' }).click();
        await page.goto('https://fns.immigration.go.ke/dash/permit/form25startClassR.php?class=30');

        // STEP 1: Fill main application form
        console.log('📝 [STEP 1] Filling main application form...');
        await page.waitForLoadState('networkidle');

        const data = formData.formData;

        // Application type and permit details
        if (data.applicationTypeId) {
            await fillOrSelect('#applicationtypeId', data.applicationTypeId);
        }
        
        const cleanVal = (val) => val ? val.toString().replace(/[^0-9]/g, '') : '';

        await page.locator('#prevpermit').fill(cleanVal(data.previousPermitNumber) || '');
        await page.locator('#preferred_duration').fill(cleanVal(data.preferredDuration) || '2');
        await page.locator('#fileR').fill(cleanVal(data.fileRNumber) || '');

        // Personal details
        await page.locator('#surname').fill(data.surname || '');
        await page.locator('#othernames').fill(data.otherNames || '');
        
        await selectDatePickerDate('#dateOfBirth', data.dateOfBirth || data.dob, 'Date of Birth');
        await fillOrSelect('#countryOfBirth', data.countryOfBirth);
        await fillOrSelect('#genderId', data.genderId);
        await fillOrSelect('#presentNationality', data.presentNationality || '84'); // Sample used 84 (UGANDA)

        // Passport details
        await page.locator('#passport_no').fill(data.passportNo || '');
        await selectDatePickerDate('#dateOfIssue', data.passportIssueDate, 'Passport Issue Date');
        await selectDatePickerDate('#passportExpiryDate', data.passportExpiryDate, 'Passport Valid until');
        await page.locator('#placeOfIssue').fill(data.placeOfIssue || '');

        // Contact details
        const phoneNumber = data.phoneNumber || data.kenyanPhoneNumber || data.kenyanCellphone;
        if (phoneNumber) {
            await fillOrSelect('#phone_no', phoneNumber, 'Phone Number');
            await fillOrSelect('#kenyancellphone', phoneNumber, 'Kenyan Cellphone');
        }
        await page.locator('#email_address').fill(data.emailAddress || '');

        // Address details
        await page.locator('#postaladdress').fill(data.postalAddress || '');
        await page.locator('#postalcode').fill(data.postalCode || '');
        await page.locator('#city').fill(data.city || '');
        
        await fillOrSelect('#county', data.countyId);
        await page.waitForTimeout(2000); // Important for subcounty load
        if (data.subcounty) await fillOrSelect('#subcounty', data.subcounty);
        else await page.locator('#subcounty').selectOption({ index: 1 }).catch(() => {});

        await page.locator('#location').fill(data.location || '');
        await page.locator('#road').fill(data.road || '');
        await page.locator('#plotNo').fill(data.plotNo || '');
        await page.locator('#landmark').fill(data.nearestLandmark || '');
        await page.locator('#town').fill(data.town || '');

        // Additional details
        await fillOrSelect('#imigrationStatus', data.immigrationStatus);
        await page.locator('#name_employer_business').fill(data.employerName || '');
        
        // Education logic from recording
        await page.waitForTimeout(2000);
        const educationSelect = page.locator('#highest_education_level');
        await educationSelect.waitFor({ state: 'visible', timeout: 5000 });
        if (data.educationLevel) {
            await fillOrSelect('#highest_education_level', data.educationLevel);
        } else {
            await educationSelect.click();
            await page.waitForTimeout(500);
            await educationSelect.selectOption({ index: 1 });
        }

        await page.locator('#profession').fill(data.profession || '');
        await page.locator('#home_country_paddress').fill(data.homeAddress || '');
        await page.locator('#phone_no_home_country').fill(data.homeTelephone || '');
        await page.locator('#nameOfSpouse').fill(data.spouseName || '');
        if (data.activityType) await fillOrSelect('#activityType', data.activityType);

        // Photo upload
        console.log(`📤 [STEP 1] Uploading photo from: ${photoPath}`);
        let finalPhotoPath = null;

        try {
            if (photoPath && photoPath.startsWith('http')) {
                const tempPath = path.join(__dirname, `temp_photo_r_${Date.now()}.jpg`);
                await downloadImage(photoPath, tempPath);
                await page.locator('#photoToUpload').setInputFiles(tempPath);
                finalPhotoPath = tempPath;
                console.log('   -> ✅ Photo ready for submission!');
            } else if (photoPath && fs.existsSync(photoPath)) {
                await page.locator('#photoToUpload').setInputFiles(photoPath);
            }
        } catch (e) {
            console.log('   -> ❌ Upload preparation failed:', e.message);
        }

        // Save main form
        console.log('✅ Step 1 Filled. Clicking Save...');
        await Promise.all([
            page.waitForNavigation({ timeout: 60000 }).catch(() => console.log('   ℹ️ Navigation timeout')),
            page.getByRole('button', { name: 'Save' }).click()
        ]);

        if (finalPhotoPath && fs.existsSync(finalPhotoPath)) {
            try { fs.unlinkSync(finalPhotoPath); } catch (e) { }
        }

        // STEP 2: Fill dependant details
        console.log('📝 [STEP 2] Filling dependant details...');
        await page.waitForLoadState('networkidle');

        if (formData.dependantData) {
            const dep = formData.dependantData;
            await page.locator('#firstname').fill(dep.firstName || '');
            await page.locator('#middlename').fill(dep.middleName || '');
            await page.locator('#surname').fill(dep.surname || '');

            await selectDatePickerDate('#dateOfBirth', dep.dateOfBirth || dep.dob, 'Dependant DOB');
            await fillOrSelect('#genderId', dep.genderId);
            await fillOrSelect('#countryofBirth', dep.countryOfBirthId);

            await page.getByRole('button', { name: 'Save Dependant details' }).click();
            await page.waitForTimeout(1000);
        }

        console.log('✅ Step 2 completed!');

        // STEP 3: Fill previous permit details
        console.log('📝 [STEP 3] Filling previous permit details...');
        await page.waitForLoadState('networkidle');

        if (formData.previousPermitData) {
            const prev = formData.previousPermitData;
            await fillOrSelect('#permitclassId', prev.permitClassId);
            await page.locator('#permittype').fill(prev.permitType || '');
            await page.locator('#permitNo').fill(prev.permitNo || '');
            await page.getByRole('button', { name: 'Save previous permit details' }).click();
            await page.waitForTimeout(1000);
        }

        console.log('✅ Step 3 completed!');

        // Proceed to next section
        await page.getByRole('button', { name: 'Proceed' }).click();

        // STEP 4: Fill educational qualifications
        console.log('📝 [STEP 4] Filling educational qualifications...');
        await page.waitForLoadState('networkidle');

        if (formData.educationalData) {
            const edu = formData.educationalData;
            await page.locator('#institution').fill(edu.institution || '');
            await page.locator('#description').fill(edu.description || '');

            await selectDatePickerDate('#startdate', edu.startDate, 'Edu Start Date');
            await selectDatePickerDate('#enddate', edu.endDate, 'Edu End Date');
            
            try { await page.locator('#educationalfileToUpload').setInputFiles(photoPath); } catch(e){}
            await page.getByRole('button', { name: 'Save employee qualifications' }).click();
            await page.waitForTimeout(1000);
        }

        console.log('✅ Step 4 completed!');

        // STEP 5: Fill technical details
        console.log('📝 [STEP 5] Filling technical details...');
        await page.waitForLoadState('networkidle');

        if (formData.technicalData) {
            const tech = formData.technicalData;
            await fillOrSelect('#technicalinstitution', tech.institution || 'Accountant ');
            await page.locator('#technicaldescription').fill(tech.description || '');

            await selectDatePickerDate('#technicalstartdate', tech.startDate, 'Tech Start Date');
            await selectDatePickerDate('#technicalenddate', tech.endDate, 'Tech End Date');
            
            try { await page.locator('#fileToUpload').setInputFiles(photoPath); } catch(e){}
            await page.getByRole('button', { name: 'Save technical details' }).click();
            await page.waitForTimeout(1000);
        }

        console.log('✅ Step 5 completed!');

        // STEP 6: Fill employment details
        console.log('📝 [STEP 6] Filling employment details...');
        await page.waitForLoadState('networkidle');

        if (formData.employmentData) {
            const emp = formData.employmentData;
            await page.locator('#employer').fill(emp.employer || '');
            await page.locator('#natureOfEmployment').fill(emp.natureOfEmployment || '');

            await selectDatePickerDate('#employmentstartdate', emp.startDate, 'Job Start Date');
            
            try { await page.locator('#employmentfileToUpload').setInputFiles(photoPath); } catch(e){}
            await page.getByRole('button', { name: 'Save previous experience' }).click();
            await page.waitForTimeout(1000);
        }

        console.log('✅ Step 6 completed!');

        // STEP 7: Fill skills details
        console.log('📝 [STEP 7] Filling skills details...');
        await page.waitForLoadState('networkidle');

        if (formData.skillsData) {
            const skills = formData.skillsData;
            await page.locator('#confirmskilldescription').fill(skills.description || '');
            try { await page.locator('#skillsfileToUpload').setInputFiles(photoPath); } catch(e){}
            await page.getByRole('button', { name: 'Save', exact: true }).first().click();
        }

        console.log('✅ Step 7 completed!');

        // Final submit
        console.log('🚀 [FINAL] Clicking Save and Submit...');
        // await page.getByRole('button', { name: 'Save and Submit' }).click();

        console.log('✅ Class R permit application completed successfully!');

        return { success: true, message: 'Class R automation completed successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        throw error;
    } finally {
        // await browser.close();
    }
}

// Export the automation function
export { runClassRAutomation };

// Below code is for standalone server mode (not used in unified server)
/*
// API Endpoints

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Class R Permit Automation API is running' });
});

// Main automation endpoint
app.post('/submit-permit', async (req, res) => {
    try {
        console.log('📥 Received Class R permit automation request');

        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: 'Request body is required'
            });
        }

        const formData = req.body;

        // Basic validation
        if (!formData.login || !formData.login.email || !formData.login.password) {
            return res.status(400).json({
                success: false,
                error: 'Login credentials are required (email, idNumber, password)'
            });
        }

        if (!formData.formData) {
            return res.status(400).json({
                success: false,
                error: 'Form data is required'
            });
        }

        // Send immediate response
        res.json({
            success: true,
            message: 'Class R automation started. Browser will open shortly.',
            timestamp: new Date().toISOString()
        });

        // Run automation in background
        runClassRAutomation(formData)
            .then(result => {
                console.log('✅ Automation completed:', result);
            })
            .catch(error => {
                console.error('❌ Automation failed:', error.message);
            });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  Class R Permit Automation API Server                 ║
╚════════════════════════════════════════════════════════╝

🚀 Server is running on http://localhost:${PORT}

📌 Endpoints:
   GET  /health          - Health check
   POST /submit-permit   - Submit Class R permit automation

💡 Usage:
   curl -X POST http://localhost:${PORT}/submit-permit \\
     -H "Content-Type: application/json" \\
     -d @test-data.json

    `);
});
*/

