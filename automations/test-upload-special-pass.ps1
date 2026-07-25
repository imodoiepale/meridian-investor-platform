# Test Upload Requirements for Special Pass - fgh hfg

$body = @{
    login = @{
        email = $env:EFNS_EMAIL
        idNumber = $env:EFNS_ID_NUMBER
        password = $env:EFNS_PASSWORD
    }
    permitType = "special pass"
    applicantName = "fgh hfg"
    documents = @{
        applicationForm = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        coverLetter = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        passportPhoto = "C:\Users\user\Downloads\rr.png"
        registrationCert = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        permitsHeld = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        receiptAcknowledgement = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        clearanceLetter = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        immigrationStatus = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        passportCopy = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        academicCertificates = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        policeClearance = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
        contractEngagement = "C:\Users\user\Downloads\permit_INSERT_APPLICANT_NAME_HERE_1768893898641.pdf"
    }
} | ConvertTo-Json -Depth 10

Write-Host "Sending request to upload requirements for: fgh hfg (Special Pass)" -ForegroundColor Cyan
Write-Host "All 12 document fields included" -ForegroundColor Green

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/permit/upload-requirements" -Method POST -ContentType "application/json" -Body $body

Write-Host "`nResponse:" -ForegroundColor Yellow
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
