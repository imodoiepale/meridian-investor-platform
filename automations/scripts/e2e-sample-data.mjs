/**
 * Sample data for the Meridian E2E dry-run harness.
 *
 * Credentials sourced from the reference automation code in
 * `document-trainer-and-many-more/KRA Dupe/…` (already known-working PINs +
 * passwords). Passports and personal details are synthetic — safe for demos.
 *
 * All flows in the harness stop BEFORE the final government-side submit. These
 * credentials are only used for iTax login (which does not create records) and
 * to fill forms up to the point of review.
 */

export const SAMPLE_INVESTOR = {
  session_id: 'e2e-demo-investor-01',
  full_name: 'Alex Ngugi',
  first_name: 'Alex',
  last_name: 'Ngugi',
  nationality: 'United States',
  passport_no: 'US1234567',
  passport_issue_date: '2022-01-15',
  passport_expiry_date: '2032-01-14',
  place_of_issue: 'Washington DC',
  dob: '1988-04-12',
  gender: 'Male',
  email: 'alex.ngugi+meridian@example.com',
  phone: '+254712345678',
  sector: 'agritech',
  capital_usd: 250000,
  county: 'Nairobi',
  city: 'Nairobi',
  subcounty: 'Westlands',
  location: 'Parklands',
  road: 'Muthithi Road',
  plotNo: '17',
  nearestLandmark: 'ABC Place',
  postalAddress: 'P.O. Box 12345',
  postalCode: '00100',
  company_name: 'XTRA CAB CABLES LTD',
  origin_city: 'San Francisco',
  destination_country: 'kenya',
  immigrationStatus: 'Applying',
  employerName: 'XTRA CAB CABLES LTD',
  educationLevel: 'degree',
  profession: 'Founder / Investor',
  spouseName: '',
  countryOfBirth: 'United States',
};

/**
 * Known-working KRA (iTax) credentials from the reference PAYE nil-return code.
 * These are login-only tests — the harness stops BEFORE clicking Submit on any
 * nil-return form, so no filings are created.
 */
export const SAMPLE_KRA_ACCOUNTS = [
  { company_name: 'XTRA CAB CABLES LTD',              pin: 'P052191233J', password: 'bclitax2024' },
  { company_name: 'VISHNU BUILDERS AND COMPANY LTD',  pin: 'P051642956N', password: 'bclitax2025' },
];

/** eFNS/eCitizen dry-run credentials (never posted — validation-only). */
export const SAMPLE_EFNS_LOGIN = {
  email: SAMPLE_INVESTOR.email,
  idNumber: SAMPLE_INVESTOR.passport_no,
  password: 'DryRunNotSubmitted!23',
};

/** Class G formData (matches profile_to_class_g output shape). */
export const SAMPLE_CLASS_G_FORM = {
  surname: SAMPLE_INVESTOR.last_name,
  otherNames: SAMPLE_INVESTOR.first_name,
  countryOfBirth: SAMPLE_INVESTOR.countryOfBirth,
  dob: SAMPLE_INVESTOR.dob,
  genderId: 1,
  presentNationality: SAMPLE_INVESTOR.nationality,
  passportNo: SAMPLE_INVESTOR.passport_no,
  passportIssueDate: SAMPLE_INVESTOR.passport_issue_date,
  passportExpiryDate: SAMPLE_INVESTOR.passport_expiry_date,
  placeOfIssue: SAMPLE_INVESTOR.place_of_issue,
  emailAddress: SAMPLE_INVESTOR.email,
  phoneNumber: SAMPLE_INVESTOR.phone,
  postalAddress: SAMPLE_INVESTOR.postalAddress,
  postalCode: SAMPLE_INVESTOR.postalCode,
  city: SAMPLE_INVESTOR.city,
  countyId: 1,
  subcounty: SAMPLE_INVESTOR.subcounty,
  location: SAMPLE_INVESTOR.location,
  road: SAMPLE_INVESTOR.road,
  plotNo: SAMPLE_INVESTOR.plotNo,
  nearestLandmark: SAMPLE_INVESTOR.nearestLandmark,
  immigrationStatus: SAMPLE_INVESTOR.immigrationStatus,
  employerName: SAMPLE_INVESTOR.employerName,
  educationLevel: 5,
  profession: SAMPLE_INVESTOR.profession,
  spouseName: '',
  applicationDuration: '2years',
  preferredDuration: '2 years',
  declinedApplication: 'No',
};

export const SAMPLE_ETA_FORM = {
  surname: SAMPLE_INVESTOR.last_name,
  givenNames: SAMPLE_INVESTOR.first_name,
  nationality: SAMPLE_INVESTOR.nationality,
  passportNo: SAMPLE_INVESTOR.passport_no,
  passportExpiryDate: SAMPLE_INVESTOR.passport_expiry_date,
  emailAddress: SAMPLE_INVESTOR.email,
  phone: SAMPLE_INVESTOR.phone,
  purposeOfVisit: 'Business / Investment prospecting',
};

export const SAMPLE_NSSF_PROFILE = {
  name: `${SAMPLE_INVESTOR.first_name} ${SAMPLE_INVESTOR.last_name}`,
  idNumber: SAMPLE_INVESTOR.passport_no,
  email: SAMPLE_INVESTOR.email,
  phone: SAMPLE_INVESTOR.phone,
  dob: SAMPLE_INVESTOR.dob,
  gender: SAMPLE_INVESTOR.gender,
};

export const SAMPLE_SHA_COMPANY = {
  companyName: SAMPLE_INVESTOR.company_name,
  directorName: `${SAMPLE_INVESTOR.first_name} ${SAMPLE_INVESTOR.last_name}`,
  mobile: SAMPLE_INVESTOR.phone,
  email: SAMPLE_INVESTOR.email,
  code: 'DRYRUN',
  password: 'DryRunNotSubmitted!23',
};

export const SAMPLE_BRS = {
  ecitizenId: SAMPLE_INVESTOR.email,
  password: 'DryRunNotSubmitted!23',
  companyName: SAMPLE_INVESTOR.company_name,
};

export const SAMPLE_KRA_PIN_PROFILE = {
  taxpayerType: 'Non-Resident Individual',
  firstName: SAMPLE_INVESTOR.first_name,
  lastName: SAMPLE_INVESTOR.last_name,
  dateOfBirth: SAMPLE_INVESTOR.dob,
  gender: SAMPLE_INVESTOR.gender,
  nationality: SAMPLE_INVESTOR.nationality,
  idType: 'Passport',
  idNumber: SAMPLE_INVESTOR.passport_no,
  email: SAMPLE_INVESTOR.email,
  phone: SAMPLE_INVESTOR.phone,
  postalAddress: SAMPLE_INVESTOR.postalAddress,
  postalCode: SAMPLE_INVESTOR.postalCode,
  city: SAMPLE_INVESTOR.city,
  county: SAMPLE_INVESTOR.county,
};
