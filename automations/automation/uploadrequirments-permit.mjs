import express from 'express';
import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createFormHelpers, loginToPortal, dismissPopup } from './form-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

/**
 * Automation for uploading requirements/documents for a permit application
 * @param {Object} formData - Data containing login, application context, and document paths
 */
async function runUploadRequirementsAutomation(formData) {
    console.log('🚀 Starting Permit Requirements Upload automation...');

    const { browser, context, page } = await createStealthBrowser({ grantClipboard: true });

    try {
        // Initialize form helpers
        const formHelpers = createFormHelpers(page);
        const { downloadFile, uploadFile } = formHelpers;

        // Login
        await loginToPortal(page, formData.login, formData.url);
        
        // Close dashboard modal if exists
        await dismissPopup(page);

        // Map permit types to URL parameters
        const permitTypeMapping = {
            'permit': 'permit',
            'class g': 'permit',
            'class-g': 'permit',
            'class n': 'permit',
            'class-n': 'permit',
            'dependant pass': 'dependant',
            'student pass': 'student',
            'special pass': 'special'
        };

        // Get permit type from formData (default to 'special')
        const permitType = (formData.permitType || 'special pass').toLowerCase();
        const permitGroup = permitTypeMapping[permitType] || 'special';
        
        // Determine the permit class for document mapping
        // Class G and Class N both use 'permit' group but have different document fields
        let documentKey = permitGroup;
        if (permitType.includes('class g') || permitType.includes('class-g')) {
            documentKey = 'class-g';
        } else if (permitType.includes('class n') || permitType.includes('class-n')) {
            documentKey = 'class-n';
        }
        
        // Navigate directly to the upload requirements page
        console.log(`🌐 [STEP] Navigating to Upload Requirements page for ${permitType}...`);
        const uploadUrl = `https://fns.immigration.go.ke/dash/uploadApplicationRequirements.php?type=permit&permit_group=${permitGroup}`;
        await page.goto(uploadUrl);
        await page.waitForLoadState('networkidle');
        console.log(`   ✅ Navigated to: ${uploadUrl}`);

        // Wait for the table to load
        await page.waitForSelector('#myTable14', { timeout: 10000 });

        // Find applicant in table by name
        console.log('🔎 [STEP] Finding applicant in table...');
        const applicantName = formData.applicantName;
        
        if (!applicantName) {
            throw new Error('applicantName is required in formData');
        }

        console.log(`   🔍 Searching for applicant: "${applicantName}"`);

        // Find the row containing the applicant name
        const applicantRow = page.locator(`#myTable14 tbody tr:has-text("${applicantName}")`).first();
        
        if (!(await applicantRow.isVisible({ timeout: 5000 }))) {
            throw new Error(`Could not find applicant "${applicantName}" in the table`);
        }

        console.log(`   ✅ Found applicant: "${applicantName}"`);

        // Find the upload button in the Actions column
        // Priority: Upload Processing Documents (upload.png) > Upload Issuance Documents (issuanceupload.png) > Edit Uploads (edit-icon.png)
        let uploadBtn;
        
        // Try to find "Upload Processing Documents" button first
        uploadBtn = applicantRow.locator('input[type="image"][src*="upload.png"]').first();
        
        if (await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('   📤 Found "Upload Processing Documents" button');
        } else {
            // Try "Upload Issuance Documents" button
            uploadBtn = applicantRow.locator('input[type="image"][src*="issuanceupload.png"]').first();
            
            if (await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('   📤 Found "Upload Issuance Documents" button');
            } else {
                // Try "Edit Uploads" button
                uploadBtn = applicantRow.locator('input[type="image"][src*="edit-icon.png"]').first();
                
                if (await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('   ✏️ Found "Edit Uploads" button');
                } else {
                    throw new Error(`No upload button found for applicant "${applicantName}"`);
                }
            }
        }

        // Click the upload button
        await uploadBtn.click();
        console.log('   🖱️ Clicked upload button');
        
        // Wait for navigation to upload page
        await page.waitForLoadState('networkidle');
        console.log('   ✅ Upload page loaded');

        const docs = formData.documents || {};
        
        // Dynamic document mappings for each permit type
        const documentMappings = {
            'special': {
                applicationForm: '#appFormUpload17',
                coverLetter: '#appFormUpload18',
                passportPhoto: '#appFormUpload19',
                registrationCert: '#appFormUpload20',
                permitsHeld: '#appFormUpload21',
                receiptAcknowledgement: '#appFormUpload22',
                clearanceLetter: '#appFormUpload23',
                immigrationStatus: '#appFormUpload24',
                passportCopy: '#appFormUpload25',
                academicCertificates: '#appFormUpload37',
                policeClearance: '#appFormUpload40',
                contractEngagement: '#appFormUpload50'
            },
            'student': {
                applicationForm: '#appFormUpload9',
                passportPhoto: '#appFormUpload10',
                passportCopy: '#appFormUpload11',
                commitmentLetter: '#appFormUpload12',
                coverLetter: '#appFormUpload13',
                sponsorPassport: '#appFormUpload14',
                parentConsent: '#appFormUpload15',
                proofOfFunds: '#appFormUpload16',
                immigrationStatus: '#appFormUpload28',
                academicCertificates: '#appFormUpload29',
                previousPass: '#appFormUpload30',
                parentPassport: '#appFormUpload31',
                birthCertificate: '#appFormUpload32',
                registrationCert: '#appFormUpload33',
                refugeeClearance: '#appFormUpload35',
                cv: '#appFormUpload36',
                policeClearance: '#appFormUpload39',
                progressReport: '#appFormUpload45',
                transcript: '#appFormUpload46',
                taxCompliance: '#appFormUpload54',
                companyRegistration: '#appFormUpload55'
            },
            'dependant': {
                applicationForm: '#appFormUpload1',
                passportPhoto: '#appFormUpload2',
                passportCopy: '#appFormUpload3',
                relationshipProof: '#appFormUpload4',
                proofOfIncome: '#appFormUpload5',
                affidavit: '#appFormUpload6',
                workPermit: '#appFormUpload7',
                dependantPhoto: '#appFormUpload8',
                coverLetter: '#appFormUpload26',
                dependantImmigrationStatus: '#appFormUpload27',
                policeClearance: '#appFormUpload38',
                applicantImmigrationStatus: '#appFormUpload42',
                dependantPassport: '#appFormUpload43'
            },
            'class-n': {
                proofOfPayment: '#appFormUpload235',
                noObjectionLetter: '#appFormUpload240',
                proofOfAccommodation: '#appFormUpload241',
                bankStatement: '#appFormUpload242',
                employerCoverLetter: '#appFormUpload243',
                applicantCoverLetter: '#appFormUpload244',
                immigrationStatus: '#appFormUpload245',
                passportCopy: '#appFormUpload246',
                passportPhoto: '#appFormUpload247',
                applicationForm: '#appFormUpload248'
            },
            'class-g': {
                previousPermits: '#appFormUpload52',
                taxComplianceIndividual: '#appFormUpload53',
                passportCopy: '#appFormUpload90',
                passportPhoto: '#appFormUpload91',
                applicationForm: '#appFormUpload92',
                companyCoverLetter: '#appFormUpload93',
                immigrationStatus: '#appFormUpload94',
                taxComplianceCompany: '#appFormUpload117',
                proofOfPayment: '#appFormUpload124',
                shareholdersCertificate: '#appFormUpload137',
                certificateOfIncorporation: '#appFormUpload141',
                proofOfCapital: '#appFormUpload142',
                previousPassHeld: '#appFormUpload169',
                auditedReport: '#appFormUpload184',
                otherDocuments: '#appFormUpload185'
            }
        };

        // Get the correct mapping based on permit type/class
        const documentMapping = documentMappings[documentKey] || documentMappings['special'];

        console.log('📤 [STEP] Uploading documents...');

        for (const [key, selector] of Object.entries(documentMapping)) {
            const filePath = docs[key];
            
            if (!filePath) {
                console.log(`   [SKIP] No file provided for ${key}`);
                continue;
            }

            console.log(`   -> Processing ${key} from ${filePath}`);
            
            try {
                let finalPath = filePath;
                let downloadedPath = null;

                if (filePath.startsWith('http')) {
                    downloadedPath = await downloadFile(filePath);
                    finalPath = downloadedPath;
                }

                if (fs.existsSync(finalPath)) {
                    await uploadFile(selector, finalPath);
                } else {
                    console.error(`      ❌ Local file not found: ${finalPath}`);
                }

                if (downloadedPath && fs.existsSync(downloadedPath)) {
                    fs.unlinkSync(downloadedPath);
                }
            } catch (err) {
                console.error(`      ❌ Failed to upload ${key}:`, err.message);
            }
        }

        console.log('✅ Documentation upload attempted for all provided files.');
        
        return { success: true, message: 'Requirement documents uploaded successfully!' };

    } catch (error) {
        console.error('❌ An error occurred during upload automation:', error);
        throw error;
    } finally {
        // browser.close();
    }
}

export { runUploadRequirementsAutomation };
