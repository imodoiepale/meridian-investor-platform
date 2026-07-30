// Shared identity for the person filing on the investor's behalf — the
// eCitizen account holder (ECITIZEN_ID in .env), who is also the BRS
// director/shareholder in brs-private-ltd.mjs. NSSF and SHA registrations
// happen for this same person/company, so they default to it too instead of
// requiring a separate, never-configured set of credentials per portal.
export const DIRECTOR = {
  idNumber: process.env.ECITIZEN_ID || '39794454',
  fullName: process.env.DIRECTOR_FULL_NAME || 'James Epale',
  firstName: process.env.DIRECTOR_FIRST_NAME || 'James',
  surname: process.env.DIRECTOR_SURNAME || 'Epale',
  phone: process.env.DIRECTOR_PHONE || '+254743854888',
  email: process.env.DIRECTOR_EMAIL || 'ijepale@gmail.com',
};
