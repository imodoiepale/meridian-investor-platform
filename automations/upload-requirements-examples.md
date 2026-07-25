# Upload Requirements API Example

This endpoint is used to upload supporting documents for an existing permit application.

## Endpoint

`POST http://localhost:5000/api/permit/upload-requirements`

## cURL Command

```bash
curl -X POST http://localhost:5000/api/permit/upload-requirements \
     -H "Content-Type: application/json" \
     -d '{
  "login": {
    "email": "your-email@example.com",
    "idNumber": "your-id",
    "password": "your-password"
  },
  "applicationId": "478326",
  "applicationType": "Special Pass",
  "documents": {
    "applicationForm": "C:\\path\\to\\form32.pdf",
    "coverLetter": "C:\\path\\to\\cover_letter.pdf",
    "passportPhoto": "C:\\path\\to\\photo.jpg",
    "registrationCert": "C:\\path\\to\\reg_cert.pdf",
    "permitsHeld": "C:\\path\\to\\old_permits.pdf",
    "receiptAcknowledgement": "C:\\path\\to\\receipt.pdf",
    "clearanceLetter": "C:\\path\\to\\clearance.pdf",
    "immigrationStatus": "C:\\path\\to\\status.pdf",
    "passportCopy": "C:\\path\\to\\passport_biodata.pdf",
    "academicCertificates": "C:\\path\\to\\academic.pdf",
    "policeClearance": "C:\\path\\to\\police_clearance.pdf",
    "contractEngagement": "C:\\path\\to\\contract.pdf"
  }
}'
```

## Document Mapping Details

The automation maps the incoming keys to the following portal field IDs:

| Key | ID | Description |
| :--- | :--- | :--- |
| `applicationForm` | 17 | Application form (e.g., Form 32) |
| `coverLetter` | 18 | Detailed cover letter |
| `passportPhoto` | 19 | Current passport photo |
| `registrationCert` | 20 | Copy of registration cert |
| `permitsHeld` | 21 | Copy of any permit/passes held |
| `receiptAcknowledgement` | 22 | Receipt/Acknowledgement |
| `clearanceLetter` | 23 | Clearance letter |
| `immigrationStatus` | 24 | Current status (Visa/Permit) |
| `passportCopy` | 25 | Valid passport biodata copy |
| `academicCertificates` | 37 | Academic certificates |
| `policeClearance` | 40 | Police Clearance certificate |
| `contractEngagement` | 50 | Contract/Engagement letter |

## Filtering

- `applicationId`: (Optional) The ID of the application in the dashboard table. If omitted, the first row is selected.
- `applicationType`: (Optional) The tab name to select (e.g., "Permit", "Dependant Pass", "Special Pass"). Defaults to "Special Pass".
