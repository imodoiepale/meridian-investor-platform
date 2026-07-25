# Immigration Automation API Examples

This file contains all the available API endpoints and sample cURL requests for testing the automation.

## Base URL
All requests are sent to: `http://localhost:5000`

---

## 1. Dual Citizenship (Form F3)

Submits a Dual Citizenship application.

```bash
curl -X POST http://localhost:5000/api/permit/dual-citizenship \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "fileRNumber": "4534543",
  "surname": "PETER",
  "otherNames": "DG",
  "postalAddress": "GDG",
  "city": "FDGDF",
  "postalCode": "00100",
  "genderId": "1",
  "foreignAddress": "YDHJTFJ",
  "passportNo": "766",
  "phoneNumber": "07546754",
  "emailAddress": "JH@GMAIL.COM",
  "countyId": "38",
  "subcountyId": "232",
  "location": "CDS",
  "road": "DSFDS",
  "plotNo": "SFDS",
  "landmark": "DSFDS",
  "town": "DFDS",
  "kenyanBy": "1",
  "otherCitizenship": "66",
  "otherCitizenshipBy": "1",
  "placeOfBirth": "DSFD",
  "countryOfBirthId": "228",
  "dateOfBirth": "2008-01-08",
  "habitualAddress": "DSFDSF",
  "profileImagePath": "C:\\fakepath\\icon48.png"
}
}'
```

---

## 2. Citizenship Endorsement (Form F4)

Submits a Citizenship Endorsement application.

```bash
curl -X POST http://localhost:5000/api/permit/citizenship-endorsement \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "fileRNumber": "3232",
  "profileImagePath": "C:\\fakepath\\icon48.png",
  "goodConductPath": "C:\\fakepath\\permit_test.pdf",
  "surname": "Nyakundi",
  "otherNames": "Edwin",
  "postalAddress": "P.O. Box 123",
  "city": "Nairobi",
  "postalCode": "00100",
  "dateOfBirth": { "year": "1994", "month": "Mar", "day": "11" },
  "phoneNumber": "07059656596",
  "emailAddress": "your-email@example.com",
  "foreignAddress": "Nairobi, Kenya",
  "countyId": "29",
  "subcountyId": "173",
  "location": "Test Location",
  "road": "Test Road",
  "plotNo": "Plot 45",
  "landmark": "Near Mall",
  "town": "Nairobi",
  "kenyanBy": "1",
  "otherCitizenship": "204",
  "otherCitizenshipBy": "1",
  "passportNo": "AK6456546",
  "placeOfIssue": "Nairobi",
  "dateOfIssue": { "year": "2023", "month": "Sep", "day": "16" },
  "issuingAuthority": "Immigration",
  "genderId": "1",
  "habitualAddress": "Nairobi, Kenya"
}
}'
```
---

## 3. Special Pass

Submits a Special Pass application.

```bash
curl -X POST http://localhost:5000/api/permit/special-pass \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "surname": "DOE",
  "otherNames": "JOHN",
  "passportNo": "AK1234567",
  "phoneNumber": "0712345678",
  "emailAddress": "test@example.com",
  "dateOfBirth": { "year": "1990", "month": "Jan", "day": "01" }
}
}'
```

---

## 4. Class D (Dependant Pass)

Submits a Class D permit application.

```bash
curl -X POST http://localhost:5000/api/permit/class-d \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "mainApplication": {
    "applicationType": "4",
    "previousPermitNumber": "567667657",
    "preferredDuration": "2",
    "permitClass": "18",
    "fileRNumber": "1915495",
    "surname": "DOE",
    "otherNames": "JOHN",
    "dateOfBirth": "1992-08-23",
    "countryOfBirth": "84",
    "passportNumber": "5ryrtytryt",
    "passportDateOfIssue": "2015-01-01",
    "passportExpiryDate": "2025-01-01",
    "placeOfIssue": "Nairobi",
    "gender": "1",
    "presentNationality": "230",
    "phoneNumber": "085543545",
    "email": "dsfg@gmail.com",
    "postalCode": "00454",
    "postalAddress": "awfsf",
    "city": "Nairobi",
    "kenyanCellphone": "0700298298",
    "county": "46",
    "subCounty": "1",
    "location": "sfdsf",
    "road": "sfds",
    "plotNo": "fsf",
    "landmark": "Legacy Landmark",
    "town": "fsfs",
    "immigrationStatus": "12",
    "employerBusiness": "fdsf",
    "homeAddress": "fsfs",
    "educationLevel": "Bachelor\u0027s Degree",
    "profession": "sfdsf",
    "homePhone": "0762544564",
    "spouseName": "Jane Doe",
    "passportPhoto": "D:/imm-automations/permit/passport_photo.jpg",
    "isGratis": false
  },
  "dependantDetails": [
    {
      "firstName": "Child",
      "middleName": "One",
      "surname": "Doe",
      "dateOfBirth": "2020-01-01",
      "gender": "1",
      "countryOfBirth": "187"
    }
  ],
  "previousPermitDetails": [
    {
      "permitClass": "18",
      "permitType": "CLASS D",
      "permitNumber": "138287",
      "dateIssued": "2022-01-01",
      "duration": "2 years"
    }
  ],
  "education": {
    "institution": "Generic Univ",
    "description": "Degree",
    "startDate": "2010-01-01",
    "endDate": "2014-01-01",
    "upload": "D:/imm-automations/permit/passport_photo.jpg"
  },
  "technical": {
    "institution": "Accountant",
    "description": "CPA",
    "startDate": "2015-01-01",
    "endDate": "2016-01-01",
    "upload": "D:/imm-automations/permit/passport_photo.jpg"
  },
  "employment": {
    "employer": "Prev Corp",
    "natureOfEmployment": "Full Time",
    "startDate": "2016-02-01",
    "endDate": "2020-02-01",
    "upload": "D:/imm-automations/permit/passport_photo.jpg"
  },
  "skills": {
    "description": "Specialist",
    "upload": "D:/imm-automations/permit/passport_photo.jpg"
  }
}
}'
```

---

## 5. Class G (Trade/Business/Consultancy)

Submits a Class G permit application.

```bash
curl -X POST http://localhost:5000/api/permit/class-g \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "applicationTypeId": "Permit Renewal",
  "previousPermitNumber": "156170",
  "preferredDuration": "2",
  "fileRNumber": "795712",
  "surname": "BAROT",
  "otherNames": "RAJIVKUMAR HARIKRISHNA",
  "dob": { "year": "1973", "month": "May", "day": "16" },
  "countryOfBirth": "INDIA",
  "genderId": "Male",
  "presentNationality": "INDIAN",
  "passportNo": "P2533859",
  "passportIssueDate": { "year": "2016", "month": "Apr", "day": "27" },
  "passportExpiryDate": { "year": "2026", "month": "Apr", "day": "26" },
  "placeOfIssue": "NAIROBI",
  "phoneNumber": "+254 723 023311",
  "emailAddress": "barotrajiv@yahoo.com",
  "postalAddress": "22061",
  "postalCode": "00100",
  "kenyanPhoneNumber": "+254 723 023311",
  "city": "NAIROBI",
  "countyId": "NAIROBI",
  "subcounty": "Starehe",
  "location": "NAIROBI",
  "road": "NAIROBI",
  "plotNo": "NAIROBI",
  "nearestLandmark": "NAIROBI",
  "town": "NAIROBI",
  "immigrationStatus": "Specific trade, business or consultancy",
  "employerName": "ABC PLAZA TRADING",
  "educationLevel": "Bachelor's Degree",
  "profession": "DIRECTOR",
  "homeAddress": "TILAK POLE - 1, BRAHMAN WADA, BORSAD, KHEDA, GUJARAT - 387411",
  "homeTelephone": "+254 723 023311",
  "homeTelephone": "+254 723 023311",
  "photoPath": "d:\\imm-automations\\efns-frontend\\api-server\\passport_photo.jpg",
  "dependant": [],
  "permitDetails": {
    "permitClassId": "CLASS G",
    "permitType": "CLASS G",
    "permitNo": "156170",
    "dateIssued": { "year": "2025", "month": "Sep", "day": "11" },
    "duration": "TWO YEARS"
  }
}
}'
```

---

## 6. Class R (EAC Nationals)

Submits a Class R permit application.

```bash
curl -X POST http://localhost:5000/api/permit/class-r \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "applicationTypeId": "1",
  "previousPermitNumber": "88888",
  "preferredDuration": "2",
  "fileRNumber": "R-12345",
  "surname": "MUIGAI",
  "otherNames": "JOSEPH",
  "dateOfBirth": "1992-05-12",
  "countryOfBirth": "183",
  "genderId": "1",
  "presentNationality": "183",
  "passportNo": "UG999999",
  "passportIssueDate": { "day": "01", "month": "01", "year": "2020" },
  "passportExpiryDate": { "day": "01", "month": "01", "year": "2030" },
  "placeOfIssue": "Kampala",
  "phoneNumber": "0700111222",
  "emailAddress": "joseph.muigai@example.com",
  "postalAddress": "P.O. Box 444",
  "postalCode": "00200",
  "city": "Nairobi",
  "kenyanPhoneNumber": "0700111222",
  "countyId": "28",
  "subcounty": "165",
  "location": "Pangani",
  "road": "Juja Rd",
  "plotNo": "A2",
  "nearestLandmark": "Pangani Girls",
  "town": "Nairobi",
  "immigrationStatus": "3",
  "employerName": "East Africa Logistics",
  "educationLevel": "Bachelor\u0027s Degree",
  "profession": "Driver",
  "homeAddress": "Kampala Central",
  "homeTelephone": "+256123456",
  "spouseName": "Mary Muigai",
  "activityType": "Employment",
  "photoPath": "C:\\fakepath\\photo.jpg"
},
"educationalData": {
  "institution": "Makerere University",
  "description": "Logistics Diploma",
  "startDay": "01", "startMonth": "Sep", "startYear": "2010",
  "endDay": "30", "endMonth": "Jun", "endYear": "2013"
}
}'
```

---

## 7. Class N (Permit)

Submits a Class N permit application.

```bash
curl -X POST http://localhost:5000/api/permit/class-n \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "mainApplication": {
    "applicationType": "4",
    "previousWorkPermitNumbers": "123",
    "preferredDuration": "1",
    "immigrationFileNumber": "R7777",
    "surname": "WANG",
    "otherNames": "WEI",
    "dateOfBirth": "1988-10-10",
    "placeOfBirth": "44",
    "nationality": "44",
    "gender": "1",
    "passportNo": "C88888888",
    "passportValidUntil": "2028-10-10",
    "placeOfIssue": "Beijing",
    "passportDateOfIssue": "2018-10-10",
    "phoneNumber": "254700000000",
    "email": "wei.wang@example.com",
    "postalCode": "00100",
    "kenyanPostalAddress": "P.O. Box 999",
    "city": "Nairobi",
    "kenyanCellphone": "254700000000",
    "residentialCounty": "21",
    "subCounty": "135",
    "locationEstate": "Kilimani",
    "nearestRoadStreet": "Argwings Kodhek",
    "plotNoBuildingName": "Building X",
    "nearestLandmark": "Yaya Centre",
    "town": "Nairobi",
    "currentImmigrationStatus": "16",
    "highestEducationLevel": "Doctorate (Ph.D.)",
    "employerBusinessName": "China Kenya Corp",
    "profession": "Expert",
    "telephoneHomeCountry": "+8610000000",
    "physicalAddressHomeCountry": "Beijing St",
    "spouseNames": "Li Wang"
  }
}
}'
```

---

## 8. Student Pass

Submits a Student Pass application.

```bash
curl -X POST http://localhost:5000/api/permit/student-pass \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "surname": "STUDENT",
  "otherNames": "MARK",
  "dateOfBirth": "2005-01-01",
  "placeOfBirth": "43",
  "nationality": "43",
  "gender": "1",
  "passportNo": "S1234567",
  "passportDateOfIssue": "2022-01-01",
  "passportValidUntil": "2030-01-01",
  "placeOfIssue": "New York",
  "phoneNumber": "254711222333",
  "email": "student@example.com",
  "postalCode": "00100",
  "kenyanPostalAddress": "P.O. Box 111",
  "city": "Nairobi",
  "residentialCounty": "21",
  "subCounty": "135",
  "locationEstate": "Juja",
  "nearestRoadStreet": "Thika Rd",
  "plotNoBuildingName": "Hostel A",
  "nearestLandmark": "KU Gate",
  "town": "Nairobi",
  "institutionName": "Kenyatta University",
  "institutionPostalAddress": "P.O. Box 43844",
  "institutionPostalCode": "00100",
  "institutionCity": "Nairobi",
  "courseDescription": "Software Engineering",
  "courseDuration": "4 years",
  "admissionNumber": "S/123/2023",
  "passportPhoto": "C:\\fakepath\\photo.jpg"
}
}'
```

---

## 9. Download Permit

Downloads an existing permit from the dashboard.

```bash
curl -X POST http://localhost:5000/api/permit/download \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"applicantName": "DOE JOHN"
}'
```

---

## 10. Children & Dependants (Form F11)

Submits a Children & Dependants application.

```bash
curl -X POST http://localhost:5000/api/permit/children-dependants \
     -H "Content-Type: application/json" \
     -d '\''{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},

"formData": {
  "fileRNumber": "786876",
  "surname": "PETERSON",
  "otherNames": "JAMES",
  "postalAddress": "P.O BOX 500",
  "city": "Limuru",
  "postalCode": "00200",
  "countyId": "23",
  "subcountyId": "152",
  "location": "Limuru Town",
  "road": "Limuru Road",
  "plotNo": "Block 4",
  "landmark": "Near Church",
  "kenyanBy": "2",
  "phoneNumber": "0985656757",
  "emailAddress": "parent@example.com",
  "childDetails": {
    "surname": "fjjjj",
    "otherNames": "fjgj",
    "placeOfBirth": "fjgj",
    "dateOfBirth": { "year": "2008", "month": "Jan", "day": "13" },
    "countyId": "16",
    "subcountyId": "96",
    "location": "jgjg",
    "road": "gjfhjg",
    "plotNo": "fgjj",
    "landmark": "gfjj",
    "nationalityAtBirth": "183",
    "presentNationality": "204",
    "nationalityNo": "gjgj",
    "genderId": "1",
    "adopted": "No",
    "residence": "jgj",
    "firstArrivalDate": { "year": "2016", "month": "Apr", "day": "14" },
    "durationOfStay": "jgjj",
    "immigrationStatus": "2",
    "birthCertificateNo": "76576574",
    "passportNo": "765746476",
    "passportDateOfIssue": { "year": "2022", "month": "May", "day": "18" },
    "placeOfIssue": "546456"
  },
  "profileImagePath": "C:\\fakepath\\icon48.png"
}
}'\''
```

---

## 11. Dependant's Pass (Form 28)

Submits a Dependant's Pass application.

```bash
curl -X POST http://localhost:5000/api/permit/dependant-pass \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "fileRNumber": "345435",
  "imigrationStatus": "1",
  "surname": "SponsorSurname",
  "otherNames": "SponsorNames",
  "genderId": "3",
  "presentNationality": "6",
  "passportNo": "645646",
  "dateOfIssue": { "year": "2022", "month": "Jan", "day": "14" },
  "passportExpiryDate": { "year": "2026", "month": "Jan", "day": "10" },
  "placeOfIssue": "PlaceOfIssueSponsor",
  "phoneNumber": "0878768767",
  "emailAddress": "sponsor@example.com",
  "postalAddress": "P.O. BOX 123",
  "postalCode": "00100",
  "city": "Nairobi",
  "kenyanCellphone": "0711223344",
  "idNo": "545456566",
  "dependantRelationship": "Spouse",
  "dateOfBirth": { "year": "1990", "month": "Jan", "day": "9" },
  "dependantDetails": {
    "surname": "DepSurname",
    "otherNames": "DepNames",
    "dateOfBirth": { "year": "2016", "month": "Jan", "day": "9" },
    "countryOfBirth": "43",
    "genderId": "1",
    "presentNationality": "84",
    "passportNo": "DEP7657657",
    "dateOfIssue": { "year": "2022", "month": "Jan", "day": "14" },
    "passportExpiryDate": { "year": "2027", "month": "Jan", "day": "10" },
    "placeOfIssue": "DepPlaceOfIssue",
    "phoneNumber": "0722334455",
    "emailAddress": "dep@example.com",
    "postalAddress": "P.O. BOX 456",
    "postalCode": "00176",
    "city": "Mombasa",
    "town": "Tyt",
    "countyId": "31",
    "subcountyId": "182",
    "location": "Yutu",
    "road": "Tyuyt",
    "plotNo": "Tyu",
    "landmark": "Tuyt",
    "highestEducationLevel": "2",
    "profession": "62",
    "homeCountryAddress": "HomeAddress123",
    "phoneNoHomeCountry": "078564454",
    "maritalStatus": "Married",
    "nameChangeInfo": "None",
    "marriageProofPath": "C:\\fakepath\\marriage.pdf",
    "nameChangeFilePath": "C:\\fakepath\\namechange.pdf",
    "deathCertNo": "None",
    "deathCertificatePath": "C:\\fakepath\\death.pdf",
    "birthCertPath": "C:\\fakepath\\birth.pdf",
    "gratisLetterPath": "C:\\fakepath\\gratis.pdf"
  },
  "photoPath": "C:\\fakepath\\photo.jpg"
}
}'
```

---

## 12. Upload Requirements (Documents)

Uploads supporting documents for an existing permit application. The automation will:

1. Navigate directly to the upload page for the specified permit type
2. Search for the applicant by name in the table
3. Click the appropriate upload button (Processing, Issuance, or Edit)
4. Upload all provided documents

**Note:** `permitType` can be: "permit", "dependant pass", "student pass", or "special pass"

**Each permit type has different document fields!**

### Example 1: Special Pass (12 Fields)

```bash
curl -X POST http://localhost:5000/api/permit/upload-requirements \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"permitType": "special pass",
"applicantName": "fgh hfg",
"documents": {
  "applicationForm": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "coverLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportPhoto": "C:\\Users\\user\\Downloads\\rr.png",
  "registrationCert": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "permitsHeld": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "receiptAcknowledgement": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "clearanceLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "immigrationStatus": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportCopy": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "academicCertificates": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "policeClearance": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "contractEngagement": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
}
}'
```

### Example 2: Student Pass (21 Fields)

```bash
curl -X POST http://localhost:5000/api/permit/upload-requirements \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"permitType": "student pass",
"applicantName": "SUTHAR JIGISH KANUPRASAD",
"documents": {
  "applicationForm": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportPhoto": "C:\\Users\\user\\Downloads\\rr.png",
  "passportCopy": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "commitmentLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "coverLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "sponsorPassport": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "parentConsent": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "proofOfFunds": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "immigrationStatus": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "academicCertificates": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "previousPass": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "parentPassport": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "birthCertificate": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "registrationCert": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "refugeeClearance": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "cv": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "policeClearance": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "progressReport": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "transcript": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "taxCompliance": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "companyRegistration": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
}
}'
```

### Example 3: Dependant Pass (13 Fields)

```bash
curl -X POST http://localhost:5000/api/permit/upload-requirements \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"permitType": "dependant pass",
"applicantName": "BHATT DEEPAK JITENDRA",
"documents": {
  "applicationForm": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportPhoto": "C:\\Users\\user\\Downloads\\rr.png",
  "passportCopy": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "relationshipProof": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "proofOfIncome": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "affidavit": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "workPermit": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "dependantPhoto": "C:\\Users\\user\\Downloads\\rr.png",
  "coverLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "dependantImmigrationStatus": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "policeClearance": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "applicantImmigrationStatus": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "dependantPassport": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
}
}'
```

### Example 4: Class N - Digital Nomads (10 Fields)

```bash
curl -X POST http://localhost:5000/api/permit/upload-requirements \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"permitType": "class n",
"applicantName": "PAREKH SAMARTH SHAILESHKUMAR",
"documents": {
  "proofOfPayment": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "noObjectionLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "proofOfAccommodation": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "bankStatement": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "employerCoverLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "applicantCoverLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "immigrationStatus": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportCopy": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportPhoto": "C:\\Users\\user\\Downloads\\rr.png",
  "applicationForm": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
}
}'
```

### Example 5: Class G - Trade/Business/Consultancy (15 Fields)

```bash
curl -X POST http://localhost:5000/api/permit/upload-requirements \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"permitType": "class g",
"applicantName": "GALA MILAN KIRIT",
"documents": {
  "previousPermits": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "taxComplianceIndividual": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportCopy": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "passportPhoto": "C:\\Users\\user\\Downloads\\rr.png",
  "applicationForm": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "companyCoverLetter": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "immigrationStatus": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "taxComplianceCompany": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "proofOfPayment": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "shareholdersCertificate": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "certificateOfIncorporation": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "proofOfCapital": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "previousPassHeld": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "auditedReport": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf",
  "otherDocuments": "C:\\Users\\user\\Downloads\\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
}
}'
```

**Note:** The automation is fully dynamic - you only need to include the document fields you want to upload. Missing fields will be automatically skipped.

**Document Field Summary:**

| Permit Type | Total Fields | Example Applicant |
| ----------- | ------------ | ----------------- |
| Special Pass | 12 | fgh hfg |
| Student Pass | 21 | SUTHAR JIGISH KANUPRASAD |
| Dependant Pass | 13 | BHATT DEEPAK JITENDRA |
| Class N (Digital Nomads) | 10 | PAREKH SAMARTH SHAILESHKUMAR |
| Class G (Trade/Business) | 15 | GALA MILAN KIRIT |

---

## 13. Re-entry Pass

Submits a Re-entry Pass application.

```bash
curl -X POST http://localhost:5000/api/permit/re-entry-pass \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "surname": "DOE",
  "otherNames": "JOHN",
  "address": "P.O. Box 123",
  "city": "Nairobi",
  "postalCode": "00100",
  "genderId": "1",
  "phoneNumber": "0700298298",
  "emailAddress": "john.doe@example.com",
  "countyId": "36",
  "subcountyId": "211",
  "location": "KISUMU",
  "road": "RIVER PLAZA",
  "plotNo": "BONDO",
  "permitParticulars": "Class D Permit",
  "dateOfReturn": "2026-12-31",
  "passportNo": "S2379833",
  "placeOfIssue": "Nairobi",
  "fileR": "5464566",
  "passportIssueDate": "2023-01-01",
  "durationYears": "1"
}
}'
```

---

## 14. Foreign National Certificate (Alien Card)

Submits an application for a Foreign National Certificate (Alien Card).

```bash
curl -X POST http://localhost:5000/api/permit/foreign-national-certificate \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "applicationType": "6",
  "pinNo": "A012345678Z",
  "applyBefore": "1",
  "serialNo": "123456",
  "individualNo": "987654",
  "dualParentage": "1",
  "gpPath": "C:\\path\\to\\gp_doc.pdf",
  "wlPath": "C:\\path\\to\\wl_doc.pdf",
  "empIdPath": "C:\\path\\to\\emp_id.pdf",
  "surname": "SINGH",
  "otherNames": "DILEEP",
  "alias": "853060",
  "maritalStatus": "1",
  "genderId": "1",
  "parentName": "PARENT NAME",
  "passportNo": "H87654321",
  "passportIssueDate": "2023-01-01",
  "passportExpiryDate": "2028-01-01",
  "placeOfIssue": "NEW DELHI",
  "phoneNumber": "0700298298",
  "emailAddress": "dileep.singh@example.com",
  "dateOfBirth": "1994-01-01",
  "countryOfBirth": "168",
  "birthNationality": "230",
  "presentNationality": "230",
  "countryOfResidence": "72",
  "applicantCategory": "1",
  "physicalAddressInKenya": "123 Parklands",
  "city": "Nairobi",
  "postalCode": "00100",
  "countyId": "46",
  "subcountyId": "273",
  "location": "LOCATION NAME",
  "streetName": "STREET NAME",
  "plotNo": "PLOT 45",
  "landmark": "LANDMARK",
  "immigrationFileNumber": "5464566",
  "occupation": "ENGINEER",
  "employerName": "TECH CORP LTD",
  "positionHeld": "FINANCE CONTROLLER",
  "employerPostalAddress": "P.O. BOX 123",
  "employerPhysicalAddress": "OFFICE SUITE 5",
  "durationYears": "1",
  "profileImagePath": "C:\\path\\to\\photo.jpg"
}
}'
```

---

## 15. Regularization of Status

Submits an application for Regularization of Status.

```bash
curl -X POST http://localhost:5000/api/permit/regularization \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "surname": "DOE",
  "otherNames": "JOHN",
  "dateOfBirth": "1990-01-01",
  "genderId": "1",
  "presentNationality": "British",
  "passportNationality": "British",
  "passportNo": "P12345678",
  "dateOfIssue": "2020-01-01",
  "passportExpiryDate": "2030-01-01",
  "placeOfIssue": "London",
  "isRefugee": "0",
  "dateOfEntryToKenya": "2024-01-01",
  "reasonForExtendingVisit": "Awaiting issuance of permit/pass",
  "portOfEntry": "JKIA",
  "extensionPeriod": "90",
  "extensionPeriodIn": "Days",
  "visaType": "1",
  "phoneNumber": "0700123456",
  "emailAddress": "john.doe@example.com",
  "address": "P.O. Box 789",
  "postalCode": "00100",
  "city": "Nairobi",
  "countyId": "21",
  "subcountyId": "135",
  "location": "Kilimani",
  "road": "Argwings Kodhek",
  "plotNo": "Plot 12",
  "fileRNumber": "F123456"
}
}'
```

---

## 16. Registration as Citizen (Form 10 - Lawful Residence)

Submits an application for registration as a citizen of Kenya using Form 10.

```bash
curl -X POST http://localhost:5000/api/permit/citizen-registration-f10 \
     -H "Content-Type: application/json" \
     -d '{
"login": {
  "email": "your-email@example.com",
  "idNumber": "YOUR_ID_NUMBER",
  "password": "YOUR_PASSWORD"
},
"formData": {
  "fileRNumber": "6787687",
  "surname": "SINGH",
  "otherNames": "DILEEP",
  "address": "P.O. Box 456",
  "city": "Nairobi",
  "postalCode": "00100",
  "genderId": "3",
  "countyId": "37",
  "subcountyId": "219",
  "location": "480",
  "road": "RIVER PLAZA",
  "plotNo": "LR no.556",
  "landmark": "NEAR PLAZA",
  "placeOfBirth": "London",
  "dateOfBirth": "1993-01-23",
  "phoneNumber": "0700298298",
  "emailAddress": "john.doe@example.com",
  "nationalityAtBirthId": "74",
  "presentNationalityId": "204",
  "professionId": "3",
  "professionOther": "ENGINEER",
  "nameChangeParticulars": "NONE",
  "nationalityChangeParticulars": "NONE",
  "permitParticulars": "CLASS D PERMIT No. 123",
  "maritalStatusId": "1",
  "spouseName": "SPOUSE NAME",
  "profileImagePath": "C:\\path\\to\\photo.jpg",
  "marriageCertificatePath": "C:\\path\\to\\marriage_cert.pdf",
  "goodConductPath": "C:\\path\\to\\good_conduct.pdf"
}

}'
```

---

## 17. eTA Kenya

Submits an eTA Kenya application.

```bash
curl -X POST http://localhost:5000/api/permit/eta-kenya \
     -H "Content-Type: application/json" \
     -d '{
"formData": {
  "nationality": "India",
  "passportBiodataPath": "https://YOUR_SUPABASE_PROJECT.supabase.co/storage/v1/object/public/kyc-documents/example/passport_biodata.pdf",
  "selfiePath": "https://YOUR_SUPABASE_PROJECT.supabase.co/storage/v1/object/public/kyc-documents/example/selfie.pdf",
  "phoneNumber": "0700123456",
  "emailAddress": "john.doe@example.com",
  "physicalAddress": "123 Street, City",
  "occupationId": "331cb154-82a1-41c2-8eb6-02e101556cf9",
  "countryOfBirthId": "2bd8d346-14d4-427c-9ba0-f01cd35a1154",
  "nationalityAtBirthId": "2bd8d346-14d4-427c-9ba0-f01cd35a1154",
  "maritalStatus": "married",
  "financedByThirdParty": false,
  "recentlyConvicted": false,
  "previouslyDeniedEntry": false,
  "firstTimeVisit": true,
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "0700987654"
  },
  "travelReason": "Tourism",
  "arrivalDate": "2026-02-15",
  "airline": "Emirates",
  "flightNumber": "EK722",
  "arrivalAirport": "Jomo Kenyatta",
  "countryOfOrigin": "India",
  "departureDate": "2026-03-01",
  "destinationCountry": "India",
  "accommodation": {
    "name": "Sankara Hotel",
    "fromDate": "2026-02-15",
    "toDate": "2026-03-01"
  }
}
}'
```

---

## 18. Check API Status

Check if the server is running and see available routes.

```bash
curl http://localhost:5000/api/docs
```
