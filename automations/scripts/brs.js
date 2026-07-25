// Import necessary modules
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import os from "os";

// Function to format the date
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${day}.${month}.${year}`;
}

// Function to create directory if it doesn't exist
const createDirectory = directory => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Function to save downloads with error handling
async function saveDownload(download, downloadsDirectory, fileName) {
  try {
    const suggestedFilename = download.suggestedFilename();
    const downloadPath = path.join(downloadsDirectory, fileName || suggestedFilename);
    await download.saveAs(downloadPath);
    console.log(`Download saved to: ${downloadPath}`);
  } catch (error) {
    console.error(`Error saving download: ${error.message}`);
  }
}

// Function to get company details from the table
async function getCompanyDetails(page) {
  return await page.evaluate(() => {
    const tableSelector = 'body > div.container > div > div.col-sm-10.col-md-10.col-lg-10 > div:nth-child(2) > div.panel-body > div > div > table';
    const table = document.querySelector(tableSelector);
    if (!table) return [];

    return Array.from(table.querySelectorAll('tbody tr')).map(row => {
      const nameElement = row.querySelector('h1');
      const viewLink = row.querySelector('a[type="button"]');
      const dateElement = row.querySelector('p');

      return {
        companyName: nameElement ? nameElement.textContent.trim() : '',
        viewUrl: viewLink ? viewLink.getAttribute('href') : '',
        date: dateElement ? dateElement.textContent.trim() : '',
      };
    });
  });
}

// Function to capture screenshots
async function captureScreenshot(page, section, downloadsDirectory, user) {
  // Map section names to element selectors or navigation actions
  const sectionActions = {
    'Proposed Names': async () => {
      await page.waitForTimeout(1000); // Already on the view page
    },
    'Details': async () => {
      await page.getByRole("link", { name: " Details" }).click();
    },
    'Addresses': async () => {
      await page.getByRole("link", { name: " Addresses" }).click();
    },
    'Directors/Shareholders': async () => {
      await page.getByRole("link", { name: " Directors/Shareholders" }).click();
    },
    'Beneficial Owners': async () => {
      await page.getByRole("link", { name: " Beneficial Owners" }).click();
    },
    'Shares': async () => {
      await page.getByRole("link", { name: " Shares" }).click();
    },
    'Documents': async () => {
      await page.getByRole("link", { name: " Documents" }).click();
    }
  };

  // Execute the appropriate action for this section
  await sectionActions[section]();
  await page.waitForTimeout(1000);

  const fileName = `${user.company_name}-${section.replace('/', '_')}-SCREEN-DWN-${getFormattedDate()}.png`;

  await page.screenshot({
    path: path.join(downloadsDirectory, fileName),
    fullPage: true
  });
}

// Function to capture all screenshots in parallel
async function captureAllScreenshots(context, mainPage, downloadsDirectory, user) {
  console.log('Starting parallel screenshots...');
  const sections = [
    'Proposed Names',
    'Details',
    'Addresses',
    'Directors/Shareholders',
    'Beneficial Owners',
    'Shares',
    'Documents'
  ];

  console.log(`Processing sections: ${sections.join(', ')}`);

  const screenshotPromises = await Promise.all(
    sections.map(async (section) => {
      console.log(`Creating new page for section: ${section}`);
      const newPage = await context.newPage();
      await newPage.goto(mainPage.url());
      return captureScreenshot(newPage, section, downloadsDirectory, user)
        .then(async () => {
          console.log(`Successfully captured screenshot for ${section}`);
          await newPage.close();
        })
        .catch(async (error) => {
          console.error(`Error capturing ${section}:`, error);
          await newPage.close();
          throw error;
        });
    })
  ).catch(error => {
    console.error('Error in parallel screenshot capture:', error);
    throw error;
  });

  console.log('All screenshots completed');
}

// Fetch credentials from Supabase (fallback path when no direct credentials are provided)
async function fetchCredentialsFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "No credentials provided and SUPABASE_URL / SUPABASE_ANON_KEY are not set"
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: users, error } = await supabase
    .from("brs_ecitizen_credentials")
    .select("ecitizen_id_number, ecitizen_password, company_name, director_name");

  if (error) {
    throw new Error(`Error fetching users from Supabase: ${error.message}`);
  }

  if (!users || users.length === 0) {
    throw new Error("No users found in the database.");
  }

  return users;
}

// Main function to scrape data and generate PDFs.
// Accepts direct credentials { ecitizenId, password, companyName };
// falls back to Supabase (SUPABASE_URL / SUPABASE_ANON_KEY) when omitted.
export async function runBrsAutomation({ ecitizenId, password, companyName } = {}) {
  let browser;
  try {
    let users;

    if (ecitizenId && password) {
      users = [
        {
          ecitizen_id_number: ecitizenId,
          ecitizen_password: password,
          company_name: companyName || "",
          director_name: "",
        },
      ];
    } else {
      // Fallback: read credentials from Supabase
      users = await fetchCredentialsFromSupabase();
    }

    const loginId = ecitizenId || users[0].ecitizen_id_number;
    const loginPassword = password || users[0].ecitizen_password;

    // Initialize browser (headed when HEADLESS=false)
    const isHeadless = process.env.HEADLESS?.trim().toLowerCase() !== "false";
    browser = await chromium.launch({
      headless: isHeadless,
      slowMo: parseInt(process.env.SLOW_MO) || 0,
      acceptDownloads: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login to eCitizen
    await page.goto(
      "https://accounts.ecitizen.go.ke/en/login?redirect=%2Fen%2Fauthorize%3Freturn_url%3Dhttps%3A%2F%2Fbrs.ecitizen.go.ke%2Fauth%2Fsso-authorize"
    );
    await page.getByLabel("Email address or ID number").fill(String(loginId));
    await page.getByPlaceholder("Password").fill(String(loginPassword));
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.goto(
      "https://accounts.ecitizen.go.ke/en/authorize?context=true&locale=en&return_url=https://brs.ecitizen.go.ke/auth/sso-authorize"
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(2000);

    // Get all company details
    let companies = await getCompanyDetails(page);
    console.log('Found companies:', companies);

    // If a specific company was requested, only process that one
    if (companyName) {
      companies = companies.filter(
        c => c.companyName.toLowerCase().includes(companyName.toLowerCase())
      );
      if (companies.length === 0) {
        throw new Error(`Company "${companyName}" not found in the portal listing`);
      }
    }

    const processedCompanies = [];

    // Process each company
    for (const company of companies) {
      console.log(`Processing company: ${company.companyName}`);

      const user = {
        ...users[0],
        company_name: company.companyName
      };

      const homedir = os.homedir();
      const downloadsDirectory = path.join(homedir, `Downloads/4 AUTO_BRS_DOCS_DOWNLOAD-${getFormattedDate()}`);
      createDirectory(downloadsDirectory);

      // Navigate to the company's view page
      await page.goto(`https://brs.ecitizen.go.ke${company.viewUrl}`);
      await page.waitForTimeout(2000);

      // Capture screenshots for this company
      await captureAllScreenshots(context, page, downloadsDirectory, user);

      // Process documents
      await page.getByRole("link", { name: " Documents" }).click();
      await page.waitForTimeout(2000);

      try {
        console.log("Starting document downloads...");

        // Get document links and receipt information
        const { documentLinks, receiptInfo, additionalUrls } = await page.evaluate(() => {
          // Get View Original links
          const docLinks = [...document.querySelectorAll('a')]
            .filter(link => link.textContent.includes('View Original'))
            .map(link => link.href);

          // Get receipt information
          const receiptTable = document.querySelector('body > div.container > div > div.col-sm-10.col-md-10.col-lg-10 > div > div.panel-body.p-b-0 > div.panel.panel-success > div.panel-body.padding-0 > div > table');
          let receipt = null;

          if (receiptTable) {
            const row = receiptTable.querySelector('tbody tr');
            if (row) {
              receipt = {
                number: row.cells[0].textContent.trim(),
                amount: row.cells[1].textContent.trim().replace('KES', '').replace('.00', ''),
                receiptLink: row.querySelector('a.btn-success')?.href
              };
            }
          }

          // Get additional document URLs
          const tableSelector = 'body > div.container > div > div.col-sm-10.col-md-10.col-lg-10 > div > div.panel-body.p-b-0 > div.panel.panel-info > div.panel-body.padding-0 > table';
          const table = document.querySelector(tableSelector);

          const getDocumentUrls = (rowText) => {
            if (!table) return null;

            const row = Array.from(table.querySelectorAll('tr'))
              .find(tr => tr.textContent.trim().includes(rowText));

            if (row) {
              const regenerateLink = row.querySelector('a.btn-primary');
              return regenerateLink?.href || null;
            }
            return null;
          };

          return {
            documentLinks: docLinks,
            receiptInfo: receipt,
            additionalUrls: {
              nameReservation: getDocumentUrls('Name Reservation Certificate'),
              companyRegistration: getDocumentUrls('Company Registration Certificate'),
              companyCR12: getDocumentUrls('Company CR/12')
            }
          };
        });

        // Function to handle document downloads
        const downloadDocument = async (url, name) => {
          try {
            console.log(`Downloading ${name}...`);
            const response = await context.request.get(url);
            const buffer = await response.body();

            const filePath = path.join(
              downloadsDirectory,
              `${user.company_name}-${name}-Document-DWN-${getFormattedDate()}.pdf`
            );

            fs.writeFileSync(filePath, buffer);
            console.log(`Successfully saved ${name}`);
            return { success: true, name };
          } catch (error) {
            console.error(`Error downloading ${name}:`, error);
            return { success: false, name, error };
          }
        };

        // Prepare downloads
        const downloadPromises = [];

        // Add View Original documents
        const originalDocs = [
          { url: documentLinks[0], name: "BOF-1" },
          { url: documentLinks[1], name: "CR-1" },
          { url: documentLinks[2], name: "CR-2" },
          { url: documentLinks[3], name: "CR-8" },
          { url: documentLinks[4], name: "Statement-of-Nominal-Capital" }
        ];

        for (const doc of originalDocs) {
          if (doc.url) {
            downloadPromises.push(downloadDocument(doc.url, doc.name));
          }
        }

        // Add additional documents
        const additionalDocs = [
          {
            url: additionalUrls.nameReservation,
            name: "Name-Reservation-Certificate"
          },
          {
            url: additionalUrls.companyRegistration,
            name: "Company-Registration-Certificate"
          },
          {
            url: additionalUrls.companyCR12,
            name: "Company-CR12"
          }
        ];

        for (const doc of additionalDocs) {
          if (doc.url) {
            downloadPromises.push(downloadDocument(doc.url, doc.name));
          }
        }

        // Add receipt download
        if (receiptInfo?.receiptLink) {
          downloadPromises.push(
            downloadDocument(
              receiptInfo.receiptLink,
              `Receipt-${receiptInfo.amount}`
            )
          );
        }

        // Execute all downloads in parallel
        console.log(`Starting parallel downloads for ${downloadPromises.length} documents...`);
        const results = await Promise.all(downloadPromises);

        // Log results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`Download complete. ${successful.length} successful, ${failed.length} failed.`);
        if (failed.length > 0) {
          console.log('Failed downloads:', failed.map(f => f.name).join(', '));
        }

      } catch (error) {
        console.error("Error in document download section:", error);
      }

      processedCompanies.push(company.companyName);
    }

    // Close browser after processing all companies
    await context.close();
    await browser.close();
    browser = null;

    return { success: true, companies: processedCompanies };

  } catch (error) {
    console.error("An error occurred in the main script:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// Standalone execution (uses Supabase fallback or EFNS env credentials)
import { pathToFileURL } from "url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runBrsAutomation({
    ecitizenId: process.env.EFNS_ID_NUMBER,
    password: process.env.EFNS_PASSWORD,
  })
    .then(result => console.log("BRS automation completed:", result))
    .catch(error => {
      console.error("BRS automation failed:", error.message);
      process.exitCode = 1;
    });
}