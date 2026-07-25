import { createStealthBrowser } from './browser-setup.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createFormHelpers, safeRemoveFile } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// ---- JOB STATE MANAGEMENT (mirrors eta-kenya.mjs so the agent/API can track progress) ----
const activeJobs = new Map();
let latestJobId = null;

const AUTOMATION_STEPS = [
    { id: 'browser_init', name: 'Initializing browser', progress: 5 },
    { id: 'login', name: 'Logging in', progress: 15 },
    { id: 'navigation', name: 'Navigating to Special Pass application', progress: 25 },
    { id: 'form_fill', name: 'Filling Special Pass form', progress: 50 },
    { id: 'photo_upload', name: 'Uploading photo', progress: 65 },
    { id: 'permit_details', name: 'Processing previous permit details', progress: 85 },
    { id: 'complete', name: 'Automation complete', progress: 100 }
];

function updateJobProgress(jobId, stepId, message = null) {
    const job = activeJobs.get(jobId);
    if (!job) return;

    const step = AUTOMATION_STEPS.find(s => s.id === stepId);
    if (step) {
        job.currentStep = step.name;
        job.progress = step.progress;
        if (message) job.message = message;
        job.updatedAt = new Date().toISOString();
    }
}

function addJobLog(jobId, level, stepId, message) {
    const job = activeJobs.get(jobId);
    if (!job) return;

    job.logs.push({
        timestamp: new Date().toISOString(),
        level,
        step: stepId,
        message
    });
}

// Export functions for querying job status (same shape as eta-kenya.mjs)
export function getJobProgress(jobId) {
    const job = activeJobs.get(jobId);
    if (!job) return null;
    return {
        id: job.id,
        isRunning: job.isRunning,
        progress: job.progress,
        currentStep: job.currentStep,
        message: job.message,
        logs: job.logs,
        startedAt: job.startedAt,
        updatedAt: job.updatedAt,
        error: job.error
    };
}

export function getLatestJobId() {
    return latestJobId;
}

export function getAllJobs() {
    return Array.from(activeJobs.values());
}

export async function stopJob(jobId) {
    const job = activeJobs.get(jobId);
    if (!job) return false;
    job.stopRequested = true;
    job.isRunning = false;
    job.message = 'Automation stopped by user';
    // createStealthBrowser uses a persistent context (no separate browser handle),
    // so closing the context is what tears down the browser process.
    if (job.context) {
        try { await job.context.close(); } catch (_) { }
        job.context = null;
    }
    return true;
}

async function runSpecialPassAutomation(formData, jobId = null) {
    console.log('🚀 Starting Special Pass automation...');

    // Create or use existing job ID
    const currentJobId = jobId || Date.now().toString() + Math.random().toString(36).substring(7);
    latestJobId = currentJobId;

    const job = {
        id: currentJobId,
        isRunning: true,
        progress: 0,
        currentStep: 'Initializing',
        message: 'Starting automation',
        logs: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        context: null,
        stopRequested: false,
        error: null
    };
    activeJobs.set(currentJobId, job);

    addJobLog(currentJobId, 'info', 'start', 'Special Pass automation started');

    // Pipe all console output to job logs so callers polling progress get the exact logs
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const toStr = (args) => args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    console.log = (...args) => { origLog(...args); addJobLog(currentJobId, 'info', 'running', toStr(args)); };
    console.warn = (...args) => { origWarn(...args); addJobLog(currentJobId, 'warn', 'running', toStr(args)); };
    console.error = (...args) => { origError(...args); addJobLog(currentJobId, 'error', 'running', toStr(args)); };

    updateJobProgress(currentJobId, 'browser_init', 'Launching browser...');

    // Launch Browser
    const { context, page } = await createStealthBrowser({ grantClipboard: true, profileId: 'special-pass' });
    job.context = context;

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
        updateJobProgress(currentJobId, 'login', 'Logging in...');
        console.log('🔐 [STEP] Logging in...');
        await page.goto(formData.url || 'https://fns.immigration.go.ke/account/login.html');
        await page.getByRole('textbox', { name: 'you@example.com' }).fill(formData.login.email);
        await page.getByRole('textbox', { name: 'Id No/Passport No/Alien No' }).fill(formData.login.idNumber);
        await page.getByRole('textbox', { name: 'Password' }).fill(formData.login.password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => { }),
            page.getByRole('button', { name: 'Login' }).click()
        ]);

        // Navigate
        updateJobProgress(currentJobId, 'navigation', 'Navigating to Special Pass application...');
        console.log('🌐 [STEP] Navigating to Special Pass application...');
        try { await page.getByRole('button', { name: 'close' }).click({ timeout: 3000 }); } catch (e) { }

        await page.goto('https://fns.immigration.go.ke/dash/submitapp.php');

        console.log('🔘 Clicking Special Pass tile...');
        const specialPassTile = page.locator('div:nth-of-type(2) > div:nth-of-type(2) a > div').first();
        await specialPassTile.click({ timeout: 10000 });

        console.log('🔄 Clicking Apply Now...');
        const applyNowButton = page.getByRole('link', { name: 'Apply Now' }).first();
        await applyNowButton.click({ timeout: 10000 });

        await page.waitForLoadState('networkidle');

        const data = formData.formData;

        // =========================================================================
        // STEP 1: FILL FORM
        // =========================================================================
        updateJobProgress(currentJobId, 'form_fill', 'Filling Special Pass form...');
        console.log('📝 [STEP 1] Filling Special Pass form...');

        await fillOrSelect('#passId', data.passType || '4', 'Pass Type');
        await fillOrSelect('#fileR', data.fileRNumber, 'File R Number');

        // Personal Info
        await fillOrSelect('#surname', data.surname, 'Surname');
        await fillOrSelect('#othernames', data.otherNames, 'Other Names');
        if (data.dateOfBirth) await selectDatePickerDate('#dateOfBirth', data.dateOfBirth, 'Date of Birth');
        if (data.countryOfBirth) await fillOrSelect('#countryOfBirth', data.countryOfBirth);
        if (data.genderId) await fillOrSelect('#genderId', data.genderId);
        if (data.presentNationality) await fillOrSelect('#presentNationality', data.presentNationality);

        // Employment Info
        await fillOrSelect('#jobtitle', data.jobTitle, 'Job Title');
        await fillOrSelect('#jobdescription', data.jobDescription, 'Job Description');
        await fillOrSelect('#employername', data.employerName, 'Employer Name');
        await fillOrSelect('#employerpostaladdress', data.employerPostalAddress, 'Employer Postal Address');
        await fillOrSelect('#employerpostalcode', data.employerPostalCode, 'Employer Postal Code');
        await fillOrSelect('#employercity', data.employerCity, 'Employer City');
        await fillOrSelect('#employerTelNo', data.employerTelNo, 'Employer Telephone');

        // Passport Info
        await fillOrSelect('#passport_no', data.passportNo, 'Passport Number');
        if (data.passportIssueDate) await selectDatePickerDate('#dateOfIssue', data.passportIssueDate, 'Passport Issue Date');
        if (data.passportExpiryDate) await selectDatePickerDate('#passportExpiryDate', data.passportExpiryDate, 'Passport Expiry Date');
        await fillOrSelect('#placeOfIssue', data.placeOfIssue, 'Place of Issue');

        // Visit Info
        await fillOrSelect('#reasonsOfVisit', data.reasonsOfVisit, 'Reasons for Visit');
        if (data.dateOfArrival) await selectDatePickerDate('#dateOfArrival', data.dateOfArrival, 'Date of Arrival');
        await fillOrSelect('#PeriodOfStay', data.periodOfStay, 'Period of Stay');

        // Contact Info
        const phoneNumber = data.kenyanPhoneNumber || data.phoneNumber || data.kenyanCellphone;
        await fillOrSelect('#phone_no', phoneNumber, 'Phone Number');
        await fillOrSelect('#email_address', data.emailAddress, 'Email Address');

        // Address Info
        await fillOrSelect('#postaladdress', data.postalAddress, 'Postal Address');
        await fillOrSelect('#postalcode', data.postalCode, 'Postal Code');
        await fillOrSelect('#city', data.city, 'City');
        await fillOrSelect('#kenyancellphone', phoneNumber, 'Kenyan Cellphone');

        // County Selection
        if (data.countyId) {
            await fillOrSelect('#county', data.countyId);
            await page.waitForTimeout(1000);
            if (data.subcountyId) {
                await fillOrSelect('#subcounty', data.subcountyId);
            } else {
                try {
                    await page.locator('#subcounty').selectOption({ index: 1 });
                } catch (e) { console.log('⚠️ Could not set default subcounty'); }
            }
        }

        // Physical Location
        await fillOrSelect('#location', data.location, 'Location');
        await fillOrSelect('#road', data.road, 'Road');
        await fillOrSelect('#plotNo', data.plotNo, 'Plot Number');
        await fillOrSelect('#landmark', data.nearestLandmark, 'Nearest Landmark');
        await fillOrSelect('#town', data.town, 'Town');

        // Status & Education
        if (data.maritalStatus) await fillOrSelect('#maritalstatus', data.maritalStatus, 'Marital Status');
        if (data.educationLevel) await fillOrSelect('#highest_education_level', data.educationLevel, 'Education Level');
        if (data.profession) await fillOrSelect('#profession', data.profession, 'Profession');
        if (data.specifyProfession) await fillOrSelect('#specifyprofession', data.specifyProfession, 'Specify Profession');

        // Home Country Info
        await fillOrSelect('#home_country_paddress', data.homeAddress, 'Home Country Address');
        await fillOrSelect('#phone_no_home_country', data.homeTelephone, 'Home Country Telephone');

        // --- UPLOAD PHOTO ---
        updateJobProgress(currentJobId, 'photo_upload', 'Uploading photo...');
        console.log(`📤 [STEP 1] Uploading photo...`);
        if (finalPhotoPath) {
            await uploadFile('#photoToUpload', finalPhotoPath);
        } else {
            console.log('   ⚠️ No photo path available, skipping photo upload');
        }

        console.log('✅ Form Filled.');

        // =========================================================================
        // STEP 2: PERMIT DETAILS
        // =========================================================================
        updateJobProgress(currentJobId, 'permit_details', 'Checking for previous permit details...');
        console.log('🚀 [STEP 2] Checking for Previous Permit Details...');

        const permitList = Array.isArray(data.permitDetails) ? data.permitDetails : (data.permitDetails ? [data.permitDetails] : []);

        if (permitList.length > 0) {
            console.log(`📋 Found ${permitList.length} previous permits to process.`);

            for (let i = 0; i < permitList.length; i++) {
                const permit = permitList[i];
                console.log(`   -> Processing Permit ${i + 1}/${permitList.length}: ${permit.permitNo}`);

                if (i > 0) {
                    console.log('      ➕ Clicking "Click here to add Previous Permit" button...');
                    await page.locator('div.panel-body > input:nth-of-type(1)').click();
                    await page.waitForTimeout(1500);
                }

                // The previous-permit panel can take longer than expected to render/attach
                // (it's rendered dynamically, and this row follows a long form-fill above).
                // #permitclassId is the confirmed correct selector (used successfully by
                // class-d.mjs, class-r.mjs, class-g.mjs against this same portal), so a
                // failure here is a timing race, not a wrong selector - give it a longer
                // wait and log it honestly (not silently) if it still doesn't show up.
                let permitClassRendered = true;
                try {
                    await page.locator('#permitclassId').scrollIntoViewIfNeeded().catch(() => { });
                    await page.locator('#permitclassId').waitFor({ state: 'visible', timeout: 10000 });
                } catch (e) {
                    permitClassRendered = false;
                    console.log(`   ⚠️ [WARNING] Permit Class field did not render in time for previous-permit row ${i + 1}; attempting fill anyway`);
                }

                await fillOrSelect('#permitclassId', permit.permitClassId || permit.permitClass, 'Permit Class');
                if (!permitClassRendered) {
                    console.log(`   ⚠️ [WARNING] Permit Class for previous-permit row ${i + 1} may not have been set - field was not visible in time`);
                }
                await fillOrSelect('#permittype', permit.permitType, 'Permit Type');
                await fillOrSelect('#permitNo', permit.permitNo, 'Permit Number');
                await selectDatePickerDate('#dateIssued', permit.dateIssued, 'Previous Permit Issue Date');
                await fillOrSelect('#permitduration', permit.duration, 'Duration');

                // UNCOMMENT TO SAVE PERMIT
                /*
                try {
                    console.log(`      💾 Saving Permit ${i + 1}...`);
                    await Promise.all([
                        page.waitForNavigation({ timeout: 45000 }).catch(() => {}),
                        page.locator('#loadpreviouspermit > form > table > tbody > tr:nth-child(6) > td:nth-child(2) > input').click()
                    ]);
                } catch(e) { console.log(`      ⚠️ Error saving permit: ${e.message}`); }
                */
            }
        } else {
            console.log('⚠️ [SKIP] No previous permits found.');
        }

        // COMMENTED SAVE FORM
        /*
        console.log('💾 Saving Application...');
        await Promise.all([
            page.waitForNavigation({ timeout: 60000 }).catch(() => {}),
            page.locator('input[type="submit"][value="Save"][onclick*="savespecialpass()"]').click()
        ]);
        */

        // Submission (Save Application / Save Permit) is intentionally left commented
        // out above pending manual review - so "done" here means the form was filled,
        // not that an application was actually filed. Surface that honestly, along with
        // anything that was skipped or didn't render, instead of a blanket success.
        const skippedFields = job.logs.filter(l => l.message.includes('[SKIP]')).length;
        const warnings = job.logs.filter(l => l.message.includes('[WARNING]')).map(l => l.message.replace(/^\s*⚠️\s*\[WARNING\]\s*/, ''));

        const summaryParts = [];
        if (skippedFields > 0) summaryParts.push(`${skippedFields} field(s) skipped (missing data)`);
        if (warnings.length > 0) summaryParts.push(...warnings);
        const summary = summaryParts.length > 0 ? ` — ${summaryParts.join('; ')}` : '';

        console.log(`✅ Form filled and ready for manual review (submission is NOT automated)${summary}.`);
        updateJobProgress(currentJobId, 'complete', 'Form filled - awaiting manual submission');
        job.isRunning = false;
        return {
            success: true,
            submitted: false,
            status: 'needs_review',
            message: `Form filled - NOT yet submitted, awaiting manual review${summary}.`,
            warnings: summaryParts,
        };

    } catch (error) {
        console.error('❌ An error occurred during automation:', error);
        job.isRunning = false;
        job.error = error.message;
        job.message = `Failed: ${error.message}`;
        throw error;
    } finally {
        // Restore console so the next job's logs don't get double-piped
        console.log = origLog;
        console.warn = origWarn;
        console.error = origError;

        // Cleanup downloaded photo if exists
        if (downloadedPhotoPath) {
            safeRemoveFile(downloadedPhotoPath);
        }
        // Browser/context intentionally left open (final submit is commented out above
        // pending manual review) — use stopJob() to close it early if needed.
    }
}

export { runSpecialPassAutomation };
