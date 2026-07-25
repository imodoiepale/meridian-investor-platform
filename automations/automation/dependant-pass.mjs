import { createStealthBrowser } from './browser-setup.mjs';
import path from 'path';
import { createFormHelpers, loginToPortal, safeRemoveFile, handleDocumentUpload } from './form-helpers.mjs';

/**
 * Map immigration status logic
 */
function mapImmigrationStatus(formDataValue) {
    if (!formDataValue) return undefined;
    const specificToCategoryMap = {
        'Approved religious or charitable activities (KEP/I)': 'Permit holder',
        'Prospecting and mining (KEP/A)': 'Permit holder',
        'Agriculture and animal husbandry (KEP/B)': 'Permit holder',
        'Prescribed profession (KEP/C)': 'Permit holder',
        'Employment (KEP/D)': 'Permit holder',
        'Specific manufacturing (KEP/F)': 'Permit holder',
        'Business or consultancy (KEP/G)': 'Permit holder',
        'Ordinary residents (KEP/K)': 'Permit holder',
        'Professionals in religious or charitable organizations (KEP/Q)': 'Permit holder',
        'Digital Nomads (KEP/N)': 'Permit holder',
        'Kenya Dependant Pass': 'Exemption',
        'Kenya Pupils Pass': 'Exemption',
        'Kenya Visitor\'s Pass': 'Exemption',
        'Refugee (KEP/M)': 'Exemption',
        'Special Pass': 'Exemption',
        'EAC Nationals (KEP/R)': 'Exemption',
        'Permanent Resident': 'Permanent resident'
    };
    const directMap = { 'Kenyan': 'Kenyan', 'Permit holder': 'Permit holder', 'Permanent resident': 'Permanent resident', 'Exemption': 'Exemption' };
    return specificToCategoryMap[formDataValue] || directMap[formDataValue] || formDataValue;
}


async function runDependantPassAutomation(requestData) {
    console.log('🚀 Starting Dependant\'s Pass automation...');

    const { login: credentials, formData, url } = requestData;
    // Extract dependant-specific data block
    const depData = (formData.dependantDetails && formData.dependantDetails.length > 0)
        ? formData.dependantDetails[0]
        : {};

    const { browser, context, page } = await createStealthBrowser({ viewport: { width: 1356, height: 1016 } });

    try {
        // Initialize form helpers
        const formHelpers = createFormHelpers(page);
        const {
            fillOrSelect,
            selectDatePickerDate,
            uploadFile
        } = formHelpers;

        // 1. Login
        await loginToPortal(page, credentials, url);

        // 2. Navigate to Form
        console.log('🌐 [STEP] Navigating to Application Form...');
        await page.goto('https://fns.immigration.go.ke/dash/permit/newdependantpassStart.php?cat=1');

        // --- SECTION 1: SPONSOR / APPLICANT DETAILS (Using formData) ---
        console.log('👤 [STEP] Filling Sponsor Details...');

        await fillOrSelect('#fileR', formData.fileRNumber, 'File Reference');

        const immigrationStatus = mapImmigrationStatus(formData.currentImmigrationStatus || formData.immigrationStatus);
        await fillOrSelect('#imigrationStatus', immigrationStatus, 'Immigration Status');

        await fillOrSelect('#surname', formData.surname, 'Sponsor Surname');
        await fillOrSelect('#othernames', formData.otherNames, 'Sponsor Other Names');
        await fillOrSelect('#genderId', formData.genderId || formData.gender, 'Sponsor Gender');
        await fillOrSelect('#presentNationality', formData.presentNationality || formData.nationality, 'Sponsor Nationality');

        await selectDatePickerDate('#dateOfIssue', formData.dateOfIssue, 'Sponsor Passport Issue Date');
        await fillOrSelect('#passport_no', formData.passportNo, 'Sponsor Passport No');
        await selectDatePickerDate('#passportExpiryDate', formData.passportExpiryDate, 'Sponsor Passport Expiry Date');
        await fillOrSelect('#placeOfIssue', formData.placeOfIssue, 'Sponsor Passport Place of Issue');

        const phoneNumber = formData.phoneNumber || formData.kenyanCellphone || formData.kenyanPhoneNumber;
        await fillOrSelect('#phone_no', phoneNumber, 'Sponsor Phone Number');
        await fillOrSelect('#email_address', formData.emailAddress || formData.email, 'Sponsor Email Address');
        await fillOrSelect('#postalcode', formData.postalCode, 'Sponsor Postal Code');
        await fillOrSelect('#postaladdress', formData.postalAddress, 'Sponsor Postal Address');
        await fillOrSelect('#applicantcity', formData.city, 'Sponsor City');
        await fillOrSelect('#kenyancellphone', phoneNumber, 'Sponsor Kenyan Cell');
        await fillOrSelect('#IDNo', formData.idNumber || formData.idNo, 'Sponsor ID No');
        await fillOrSelect('#dependantRelationship', formData.dependantRelationship, 'Relationship');
        await selectDatePickerDate('#applicantdateOfBirth', formData.applicantDateOfBirth || formData.dateOfBirth, 'Sponsor DOB');

        // --- SECTION 2: DEPENDANT DETAILS (Using depData) ---
        console.log('👦 [STEP] Filling Dependant Details...');

        // Dependant Profile Photo (Handled like a document now)
        await handleDocumentUpload(page, '#photoToUpload', depData.photoPath || depData.profileImage, 'Dependant Profile Photo');

        await fillOrSelect('#dependantsurname', depData.surname, 'Dependant Surname');
        await fillOrSelect('#dependantothernames', depData.otherNames, 'Dependant Other Names');
        await selectDatePickerDate('#dateOfBirth', depData.dateOfBirth, 'Dependant DOB');
        await fillOrSelect('#countryOfBirth', depData.countryOfBirth, 'Dependant Country of Birth');
        await fillOrSelect('#dependantgenderId', depData.genderId || depData.gender, 'Dependant Gender');
        await fillOrSelect('#dependantpresentNationality', depData.presentNationality || depData.nationality, 'Dependant Nationality');

        await selectDatePickerDate('#dependantpassportExpiryDate', depData.passportExpiryDate, 'Dependant Passport Expiry');
        await fillOrSelect('#dependantpassport_no', depData.passportNo, 'Dependant Passport No');
        await selectDatePickerDate('#dependantdateOfIssue', depData.dateOfIssue, 'Dependant Issue Date');
        await fillOrSelect('#dependantplaceOfIssue', depData.placeOfIssue, 'Dependant Place of Issue');

        await fillOrSelect('#dependantphone_no', depData.phoneNumber, 'Dependant Phone');
        await fillOrSelect('#dependantemail_address', depData.emailAddress || depData.email, 'Dependant Email');
        await fillOrSelect('#dependantpostaladdress', depData.postalAddress, 'Dependant Postal Address');
        await fillOrSelect('#dependantpostalcode', depData.postalCode, 'Dependant Postal Code');
        await fillOrSelect('#dependant_city', depData.city, 'Dependant City');
        await fillOrSelect('#dependant_town', depData.town, 'Dependant Town');

        // Dependant Location Info
        await fillOrSelect('#county', depData.countyId || depData.county, 'County');
        if (depData.countyId || depData.county) {
            await page.waitForTimeout(1000); // Wait for subcounty dropdown to populate
            await fillOrSelect('#subcounty', depData.subcountyId || depData.subcounty, 'Subcounty');
        }

        await fillOrSelect('#location', depData.location, 'Location');
        await fillOrSelect('#road', depData.road, 'Road');
        await fillOrSelect('#landmark', depData.landmark, 'Landmark');
        await fillOrSelect('#plotNo', depData.plotNo, 'Plot No');

        await fillOrSelect('#highest_education_level', depData.educationLevel, 'Education Level');
        await fillOrSelect('#phone_no_home_country', depData.phoneNoHomeCountry, 'Home Country Phone');
        await fillOrSelect('#home_country_paddress', depData.homeCountryAddress, 'Home Country Address');
        await fillOrSelect('#maritalstatus', depData.maritalStatus, 'Marital Status');

        // --- SECTION 3: DEPENDANT DOCUMENTS & FINAL FIELDS (Using depData) ---
        console.log('📎 [STEP] Handling Dependant Documents...')

        // Upload documents
        await handleDocumentUpload(page, '#photoToUpload', depData.photoPath || depData.profileImage, 'Dependant Profile Photo');
        await handleDocumentUpload(page, '#birthcertfileToUpload', depData.birthCertPath, 'Birth Certificate');
        await handleDocumentUpload(page, '#marriageprooffileToUpload', depData.marriageProofPath, 'Marriage Proof');
        await handleDocumentUpload(page, '#namechangefileToUpload', depData.nameChangeProofPath, 'Name Change Proof');
        await handleDocumentUpload(page, '#deathcertificate', depData.deathCertPath, 'Death Certificate');

        await fillOrSelect('#deathcertNo', depData.deathCertNo, 'Death Cert No');
        await fillOrSelect('#namechange', depData.nameChangeInfo, 'Name Change Info');

        console.log('✅ Form filling completed successfully.');

        return { success: true, timestamp: new Date().toISOString() };

    } catch (error) {
        console.error('❌ Automation Error:', error);
        throw error;
    } finally {
        // await browser.close();
    }
}

export { runDependantPassAutomation };
