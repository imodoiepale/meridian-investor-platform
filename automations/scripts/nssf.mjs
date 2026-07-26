import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { solveCaptcha } from './solve-captcha.js';

/**
 * NSSF individual member registration.
 *
 * @param {object} profile
 * @param {string} profile.name          Full name (used for the saved PDF filename)
 * @param {string} profile.idNumber      National ID number (also used as username/password on the portal)
 * @param {string} profile.firstName
 * @param {string} profile.surname
 * @param {string} profile.middleName
 * @param {string} profile.dateOfBirth   Format: DD/MM/YYYY
 * @param {string} [profile.nationality='4.24']
 * @param {string} [profile.countryOfBirth='4.24']
 * @param {string} [profile.address='Nairobi,Kenya']
 * @param {string} [profile.postalCode='00100']
 * @param {string} [profile.telephone]
 * @param {string} [profile.email]
 * @param {string} [profile.county='1.01']
 * @param {string} [profile.district]
 * @param {string} [profile.location]
 * @param {string} [profile.districtOfBirth]
 * @returns {Promise<{success: boolean, pdfPath: string}>}
 */
export async function registerNssf(profile) {
  if (!profile || !profile.name || !profile.idNumber) {
    throw new Error('profile.name and profile.idNumber are required');
  }

  const {
    name,
    idNumber: id,
    firstName,
    surname,
    middleName = '',
    dateOfBirth,
    nationality = '4.24',
    countryOfBirth = '4.24',
    address = 'Nairobi,Kenya',
    postalCode = '00100',
    telephone = '',
    email = '',
    county = '1.01',
    district = '',
    location = '',
    districtOfBirth = '',
  } = profile;

  const downloadsPath = path.join(os.homedir(), 'Downloads');
  const pdfPath = path.join(downloadsPath, `${name} - ${id}.pdf`);

  const isHeadless = process.env.HEADLESS?.trim().toLowerCase() !== 'false';
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: isHeadless,
    slowMo: parseInt(process.env.SLOW_MO) || 0,
  });
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    await page.goto('https://eservice.nssfkenya.co.ke/eApplicationMember/faces/newUser.xhtml');
    await page.locator('body').click();
    await page.getByRole('textbox', { name: 'Username:*' }).fill(String(id));
    await page.getByRole('textbox', { name: 'Password:*', exact: true }).fill(String(id));
    await page.getByRole('textbox', { name: 'Verify Password:*' }).fill(String(id));
    await page.getByRole('textbox', { name: 'ID No:*' }).fill(String(id));

    // Create a directory for captcha images if it doesn't exist
    const captchaDir = path.join(downloadsPath, 'captcha');
    await fs.mkdir(captchaDir, { recursive: true }).catch(console.error);
    const imagePath = path.join(captchaDir, `captcha-${id}.png`);

    console.log('Solving NSSF captcha...');
    try {
      // Find and screenshot the captcha image
      const captchaImage = await page.waitForSelector('img[id$="captchaImage"]');
      await captchaImage.screenshot({ path: imagePath });

      // Solve the captcha via Gemini (case-sensitive)
      const captchaText = await solveCaptcha(imagePath);
      console.log(`Detected captcha text: ${captchaText} (case-sensitive)`);

      // Enter the captcha text exactly as detected (preserving case)
      await page.locator('input[id$="captchaValue"]').fill(captchaText);

      // Submit the form
      await page.locator('input[id$="btnCreateNew"]').click();

      // Wait for response and check for errors
      await page.waitForTimeout(3000);

      // Check if there's an error message
      const errorVisible = await page.locator('span[class*="error"]').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('span[class*="error"]').textContent();
        console.log(`Error detected: ${errorText}`);
        if (errorText.toLowerCase().includes('captcha')) {
          console.log('Captcha validation failed, please check the image recognition settings');
        }
      } else {
        console.log('Registration form submitted successfully!');
      }

      // Clean up the captcha image
      await fs.unlink(imagePath).catch(() => {});

    } catch (error) {
      console.error(`Error solving captcha: ${error.message}`);
    }

    await page.getByRole('row', { name: 'ID Document Type:* Please' }).locator('span').click();
    await page.locator('#idDocType_panel').getByText('National Identity Card').click();
    await page.getByRole('textbox', { name: 'Nationality:*' }).fill(nationality);
    await page.getByRole('textbox', { name: 'Country of Birth:*' }).fill(countryOfBirth);

    await page.getByRole('textbox', { name: 'First Name:*' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Surname:*' }).fill(surname);
    await page.getByRole('textbox', { name: 'Middle Name:' }).fill(middleName);
    await page.locator('td:nth-child(3) > .ui-radiobutton > .ui-radiobutton-box').first().click();
    await page.getByRole('textbox', { name: 'Date of Birth:*' }).fill(dateOfBirth);
    await page.locator('#voluntaryFlg > tbody > tr > td:nth-child(3) > .ui-radiobutton > .ui-radiobutton-box').click();
    await page.getByRole('textbox', { name: 'P.O. Address 1:*' }).fill(address);
    await page.locator('#postalCode').fill(postalCode);
    await page.getByRole('textbox', { name: 'Telephone:' }).fill(telephone);
    await page.getByRole('textbox', { name: 'Email:' }).fill(email);

    await page.getByRole('textbox', { name: 'County:*' }).fill(county);
    await page.getByRole('textbox', { name: 'District:*' }).fill(district);
    await page.getByRole('textbox', { name: 'Location:*' }).fill(location);
    await page.getByRole('textbox', { name: 'District of Birth:*' }).fill(districtOfBirth);
    await page.locator('#CaptchaID').click();
    await page.waitForTimeout(10000);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForSelector('#locationSelector2');

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
    });

    console.log(`PDF has been saved successfully at: ${pdfPath}`);

    return { success: true, pdfPath };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

// Standalone execution for testing (profile supplied via environment variables)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  registerNssf({
    name: process.env.NSSF_NAME,
    idNumber: process.env.NSSF_ID_NUMBER,
    firstName: process.env.NSSF_FIRST_NAME,
    surname: process.env.NSSF_SURNAME,
    middleName: process.env.NSSF_MIDDLE_NAME,
    dateOfBirth: process.env.NSSF_DOB,
    telephone: process.env.NSSF_TELEPHONE,
    email: process.env.NSSF_EMAIL,
    district: process.env.NSSF_DISTRICT,
    location: process.env.NSSF_LOCATION,
    districtOfBirth: process.env.NSSF_DISTRICT_OF_BIRTH,
  })
    .then(result => console.log('NSSF registration completed:', result))
    .catch(error => {
      console.error('NSSF registration failed:', error.message);
      process.exitCode = 1;
    });
}
