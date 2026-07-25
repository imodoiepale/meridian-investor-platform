import { chromium } from "playwright";
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Validation function to check director name format
function validateDirectorName(name) {
    if (!name) return "Missing director name";
    const names = name.toString().trim().split(' ').filter(n => n);
    if (names.length < 2) return "Single name only";
    return null;
}


function formatMobileNumber(number) {
    if (!number || number === '-') return '';

    // Convert to string and remove all non-numeric characters
    let cleaned = number.toString().replace(/[^0-9]/g, '');

    // If number starts with 254, add +
    if (cleaned.startsWith('254')) {
        return '+' + cleaned;
    }
    // If number starts with 0, replace with +254
    else if (cleaned.startsWith('0')) {
        return '+254' + cleaned.substring(1);
    }
    // If number doesn't start with either, assume it needs +254
    else {
        return '+254' + cleaned;
    }
}

// Enhanced validation function
function validateCompanyData(company) {
    const errors = [];

    // Check all required fields exist
    if (!company['Company Name']) errors.push("Missing company name");

    // Check director name
    const nameError = validateDirectorName(company['Director Name']);
    if (nameError) errors.push(nameError);

    // Check code and password
    if (!company['Code']) errors.push("Missing code");
    if (!company['Password']) errors.push("Missing password");

    // Check mobile number
    if (!company['Mobile Number'] || company['Mobile Number'] === '-') {
        errors.push("Missing mobile number");
    } else {
        // Format and validate mobile number
        const formattedNumber = formatMobileNumber(company['Mobile Number']);
        if (!formattedNumber.startsWith('+254') || formattedNumber.length !== 13) {
            errors.push("Invalid mobile number format");
        }
        // Update the number to formatted version
        company['Mobile Number'] = formattedNumber;
    }

    // Check email
    if (!company['Email Address']) {
        errors.push("Missing email");
    } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(company['Email Address'].toString())) {
            errors.push("Invalid email format");
        }
    }

    return errors;
}


// Function to format data consistently
function formatCompanyData(company) {
    return {
        'Company Name': company['Company Name']?.toString().trim() || '',
        'Director Name': company['Director Name']?.toString().trim() || '',
        'Mobile Number': formatMobileNumber(company['Mobile Number']),
        'Email Address': company['Email Address']?.toString().trim().toLowerCase() || '',
        'Email Password': company['Email Password']?.toString().trim() || '',
        'Code': company['Code']?.toString().trim() || '',
        'Password': company['Password']?.toString().trim() || ''
    };
}


async function createSuccessReport(company, outputPath, status = 'Registered') {
    let successWorkbook;
    let successSheet;

    try {
        // Try to read existing file
        successWorkbook = new ExcelJS.Workbook();
        try {
            await successWorkbook.xlsx.readFile(outputPath);
            successSheet = successWorkbook.getWorksheet('Successful Registrations');
            console.log('Accessing existing success report...');
        } catch (error) {
            // If worksheet doesn't exist, create it
            console.log('Creating new success report worksheet...');
            successSheet = successWorkbook.addWorksheet('Successful Registrations');

            // Add headers
            successSheet.addRow([
                'Company Name',
                'Director Name',
                'Mobile Number',
                'Email Address',
                'Email Password',
                'Code',
                'Password',
                'Registration Date',
                'Status'
            ]);

            // Set column widths
            successSheet.columns = [
                { width: 40 }, // Company Name
                { width: 30 }, // Director Name
                { width: 20 }, // Mobile Number
                { width: 40 }, // Email Address
                { width: 20 }, // Email Password
                { width: 15 }, // Code
                { width: 15 }, // Password
                { width: 20 }, // Registration Date
                { width: 15 }  // Status
            ];

            // Style header row
            const headerRow = successSheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E2EFDA' }
            };
        }

        // Find the last row with data
        let lastRowNum = 1; // Start after header
        successSheet.eachRow((row, rowNumber) => {
            lastRowNum = rowNumber;
        });

        // Prepare the new row data
        const newRowData = [
            company['Company Name'],
            company['Director Name'],
            company['Mobile Number'],
            company['Email Address'],
            company['Email Password'],
            company['Code'],
            company['Password'],
            new Date().toISOString(),
            status
        ];

        // Add the new row
        const newRow = successSheet.addRow(newRowData);

        // Style the new row
        newRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Save the workbook
        await successWorkbook.xlsx.writeFile(outputPath);
        console.log(`✓ Success report updated: ${company['Company Name']} (${status}) - Row ${lastRowNum + 1}`);

    } catch (error) {
        console.error(`Error in createSuccessReport for ${company['Company Name']}:`, error);
        throw error;
    }
}


async function fillRegistrationForm(page, company) {
    // Login steps
    // await page.locator('i').first().click();

    // await page.getByText('Activate with NHIF e-Services').click();
    await page.locator('body > section > div > div > div > div.col-md-8 > div > div > div:nth-child(1) > div.col-12.row > div:nth-child(1) > div > div').click();
    await page.locator('.col-12 > div > .card').first().click();

    await page.getByPlaceholder('Enter Employer Username').fill(String(company['Code']));
    await page.getByPlaceholder('Enter password').fill(String(company['Password']));
    await page.getByRole('button', { name: 'Proceed' }).click();

    // Split director name
    const fullName = company['Director Name'];
    const names = fullName.split(' ').filter(n => n);
    const firstName = names[0];
    const lastName = names[names.length - 1];

    // Format and log phone number
    const phoneNumber = formatMobileNumber(company['Mobile Number']);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
    console.log(`Filling phone number for ${company['Company Name']}: ${formattedPhone}`);

    await page.locator('input[name="contact_phone"]').fill(String(formattedPhone));
    // Fill form
    await page.getByPlaceholder('Enter Full Name').fill(fullName);
    await page.getByPlaceholder('Enter First Name').fill(firstName);
    await page.getByPlaceholder('Enter Last Name').fill(lastName);
    await page.locator('input[name="phone"]').fill(String(formattedPhone));
    await page.locator('input[name="email"]').fill(String(company['Email Address']).toLowerCase());
    await page.locator('input[name="email_confirmation"]').fill(String(company['Email Address']).toLowerCase());
    await page.getByLabel('By proceeding, you agree to').check();
}

async function checkIfAlreadyRegistered(page, company) {
    try {
        // Click proceed and wait for potential error message
        await page.getByRole('button', { name: 'Proceed' }).click();

        // Check for the "already registered" message
        const alreadyRegisteredText = await page.getByRole('list').getByText('Business name has already').isVisible();

        if (alreadyRegisteredText) {
            return true; // Company is already registered
        }

        return false; // Company is not registered
    } catch (error) {
        console.error('Error checking registration status:', error);
        return false;
    }
}



/**
 * Register a single company with SHA (server/API mode).
 * Reuses the same fillRegistrationForm / validation logic as the Excel batch mode.
 *
 * @param {object} company
 * @param {string} company.companyName
 * @param {string} company.directorName  Full name (at least two names)
 * @param {string} company.mobile        Kenyan mobile number
 * @param {string} company.email
 * @param {string} company.code          Employer code (portal username)
 * @param {string} company.password      Portal password
 * @returns {Promise<{success: boolean, status: string, companyName: string}>}
 */
export async function registerSha(company) {
    // Map the API-style object to the internal Excel-column format
    const formatted = formatCompanyData({
        'Company Name': company?.companyName,
        'Director Name': company?.directorName,
        'Mobile Number': company?.mobile,
        'Email Address': company?.email,
        'Email Password': company?.emailPassword || '',
        'Code': company?.code,
        'Password': company?.password
    });

    const errors = validateCompanyData(formatted);
    if (errors.length > 0) {
        throw new Error(`Invalid company data: ${errors.join('; ')}`);
    }

    const isHeadless = process.env.HEADLESS?.trim().toLowerCase() !== 'false';
    const browser = await chromium.launch({
        headless: isHeadless,
        slowMo: parseInt(process.env.SLOW_MO) || 0
    });
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        console.log(`Processing company: ${formatted['Company Name']}`);

        // Navigate to registration page
        await page.goto('https://employers.sha.go.ke/registration/corporate', { timeout: 60000 });
        await page.goto('https://employers.sha.go.ke/', { timeout: 60000 });
        await page.goto('https://employers.sha.go.ke/registration/corporate', { timeout: 60000 });

        // Fill registration form (reuses batch-mode logic)
        await fillRegistrationForm(page, formatted);

        // Check if already registered (reuses batch-mode logic)
        const isAlreadyRegistered = await checkIfAlreadyRegistered(page, formatted);

        const status = isAlreadyRegistered ? 'Already Registered' : 'Newly Registered';
        console.log(`${status}: ${formatted['Company Name']}`);

        return {
            success: true,
            status,
            companyName: formatted['Company Name']
        };
    } finally {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
}

async function processRegistration() {
    console.log('Starting registration process...');
    const successPath = join(__dirname, 'registration_success.xlsx');

    // First, ensure the success report file exists with headers
    try {
        await createSuccessReport({
            'Company Name': 'HEADER_CHECK',
            'Director Name': '',
            'Mobile Number': '',
            'Email Address': '',
            'Email Password': '',
            'Code': '',
            'Password': ''
        }, successPath, 'INIT');

        // Delete the header check row
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(successPath);
        const ws = wb.getWorksheet('Successful Registrations');
        if (ws.rowCount > 1) {
            const lastRow = ws.lastRow;
            if (lastRow && lastRow.getCell(1).value === 'HEADER_CHECK') {
                ws.spliceRows(lastRow.number, 1);
                await wb.xlsx.writeFile(successPath);
            }
        }
    } catch (error) {
        console.error('Error initializing success report:', error);
    }

    // Read the Excel file with company data
    const excelPath = join(__dirname, 'companies.xlsx');
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(excelPath);
    } catch (error) {
        console.error(`Error reading Excel file: ${error.message}`);
        return;
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
        console.error('No worksheet found in Excel file');
        return;
    }

    // Get headers and validate required columns
    const headers = worksheet.getRow(1).values.slice(1);
    const requiredColumns = ['Company Name', 'Director Name', 'Mobile Number', 'Email Address', 'Code', 'Password'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        console.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
    }

    // Convert worksheet data to array of objects
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                rowData[headers[colNumber - 1]] = cell.value;
            });
            data.push(formatCompanyData(rowData));
        }
    });

    // Validate companies
    const validCompanies = [];
    const errorCompanies = [];

    for (let company of data) {
        const errors = validateCompanyData(company);
        if (errors.length === 0) {
            validCompanies.push(company);
        } else {
            errorCompanies.push({
                ...company,
                'Errors': errors.join('; ')
            });
        }
    }

    if (validCompanies.length > 0) {
        const browser = await chromium.launch({
            headless: false
        });
        const context = await browser.newContext();
        const logPath = join(__dirname, 'registration_log.txt');
        const logStream = fs.createWriteStream(logPath, { flags: 'a' });
        const timestamp = new Date().toISOString();

        const successfulRegistrations = [];
        const alreadyRegisteredCompanies = [];

        logStream.write(`\n\nRegistration Session Started: ${timestamp}\n`);
        console.log('\nStarting registration process...\n');

        try {
            for (let [index, company] of validCompanies.entries()) {
                const page = await context.newPage();

                try {
                    console.log(`\nProcessing company ${index + 1} of ${validCompanies.length}: ${company['Company Name']}`);
                    logStream.write(`\nProcessing: ${company['Company Name']}\n`);

                    // Navigate to registration page
                    await page.goto('https://employers.sha.go.ke/registration/corporate', { timeout: 60000 });
                    await page.goto('https://employers.sha.go.ke/', { timeout: 60000 });
                    await page.goto('https://employers.sha.go.ke/registration/corporate', { timeout: 60000 });

                    // Fill registration form
                    await fillRegistrationForm(page, company);

                    // Check if already registered
                    const isAlreadyRegistered = await checkIfAlreadyRegistered(page, company);

                    if (isAlreadyRegistered) {
                        console.log(`Company already registered: ${company['Company Name']}`);
                        logStream.write(`ℹ Already Registered: ${company['Company Name']}\n`);
                        alreadyRegisteredCompanies.push(company);
                        await createSuccessReport(company, successPath, 'Already Registered');
                    } else {
                        // Add to successful registrations and update Excel
                        successfulRegistrations.push(company);
                        await createSuccessReport(company, successPath, 'Newly Registered');
                        logStream.write(`✓ Success: ${company['Company Name']}\n`);
                        console.log(`✓ Success: ${company['Company Name']}`);
                    }

                } catch (error) {
                    logStream.write(`✗ Error for ${company['Company Name']}: ${error.message}\n`);
                    console.error(`Error processing ${company['Company Name']}:`, error);
                    // Add to success report with error status
                    await createSuccessReport(company, successPath, 'Error');
                } finally {
                    await page.close();
                }

                // Add a small delay between processing companies
                await sleep(1000);
            }
        } catch (error) {
            logStream.write(`Critical Error: ${error.message}\n`);
            console.error("Critical error:", error);
        } finally {
            await context.close();
            await browser.close();
            logStream.end();

            // Final summary
            console.log('\nRegistration Process Completed');
            console.log('----------------------------');
            console.log(`Total attempted: ${validCompanies.length}`);
            console.log(`Successfully registered: ${successfulRegistrations.length}`);
            console.log(`Already registered: ${alreadyRegisteredCompanies.length}`);
            console.log(`Failed registrations: ${validCompanies.length - (successfulRegistrations.length + alreadyRegisteredCompanies.length)}`);
            console.log(`Log file generated: ${logPath}`);
            console.log(`Success report updated: ${successPath}`);
        }
    }
}

// Run the Excel batch mode only when executed directly (node scripts/sha.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    processRegistration().catch(console.error);
}