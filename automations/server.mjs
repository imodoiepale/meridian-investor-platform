import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'], override: true });
import express from 'express';

import path from 'path';
import { fileURLToPath } from 'url';
import { runClassDAutomation } from './automation/class-d.mjs';
import { runClassGAutomation } from './automation/class-g.mjs';
import { runClassRAutomation } from './automation/class-r.mjs';
import { runClassNAutomation } from './automation/class-n.mjs';
import { runStudentPassAutomation } from './automation/student-pass.mjs';
import { runSpecialPassAutomation, getJobProgress as getSpecialPassJobProgress, getLatestJobId as getLatestSpecialPassJobId, stopJob as stopSpecialPassJob } from './automation/special-pass.mjs';
import { runDownloadPermitAutomation } from './automation/download-permit.mjs';
import { runCitizenshipEndorsementAutomation } from './automation/citizenship-endorsement.mjs';
import { runDualCitizenshipAutomation } from './automation/dual-citizenship.mjs';
import { runChildrenDependantsAutomation } from './automation/children-dependants.mjs';
import { runDependantPassAutomation } from './automation/dependant-pass.mjs';
import { runUploadRequirementsAutomation } from './automation/uploadrequirments-permit.mjs';
import { runReEntryPassAutomation } from './automation/re-entry-pass.mjs';
import { runForeignNationalCertificateAutomation } from './automation/foreign-national-certificate.mjs';
import { runRegularizationAutomation } from './automation/regularization.mjs';
import { runRegistrationCitizenForm10Automation } from './automation/registration-citizen-form10.mjs';
import { runEtaKenyaAutomation, getJobProgress, getLatestJobId, getAllJobs, stopJob } from './automation/eta-kenya.mjs';
import { runBrsAutomation } from './scripts/brs.js';
import { runBrsPrivateLtd } from './automation/brs-private-ltd.mjs';
import { registerNssf } from './scripts/nssf.mjs';
import { registerSha } from './scripts/sha.mjs';
import { registerKraPin, fileNilReturn as fileKraNilReturn, checkKraCredentials } from './scripts/kra.mjs';
import { DIRECTOR } from './automation/director.mjs';






const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS middleware for frontend connection
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Immigration Permit Automation API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            docs: 'GET /api/docs',
            classD: 'POST /api/permit/class-d',
            classG: 'POST /api/permit/class-g',
            classR: 'POST /api/permit/class-r',
            classN: 'POST /api/permit/class-n',
            specialPass: 'POST /api/permit/special-pass',
            specialPassProgress: 'GET /api/permit/special-pass/progress/:jobId',
            specialPassLatest: 'GET /api/permit/special-pass/latest',
            downloadPermit: 'POST /api/permit/download',
            citizenshipEndorsement: 'POST /api/permit/citizenship-endorsement',
            dualCitizenship: 'POST /api/permit/dual-citizenship',
            childrenDependants: 'POST /api/permit/children-dependants',
            dependantPass: 'POST /api/permit/dependant-pass',
            uploadRequirements: 'POST /api/permit/upload-requirements',
            reEntryPass: 'POST /api/permit/re-entry-pass',
            foreignNationalCertificate: 'POST /api/permit/foreign-national-certificate',
            regularization: 'POST /api/permit/regularization',
            citizenRegistrationF10: 'POST /api/permit/citizen-registration-f10',
            etaKenya: 'POST /api/permit/eta-kenya',
            etaKenyaProgress: 'GET /api/permit/eta-kenya/progress/:jobId',
            brs: 'POST /api/brs',
            nssf: 'POST /api/nssf',
            sha: 'POST /api/sha'





        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Immigration Permit Automation API is running',
        timestamp: new Date().toISOString(),
        env: {
            port: PORT,
            headless: process.env.HEADLESS || 'false',
            autoClose: process.env.AUTO_CLOSE || 'false'
        }
    });
});

// Documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Immigration Permit Automation API',
        description: 'Automate Kenya Immigration permit applications for Classes D, G, R, and N',
        baseUrl: `http://localhost:${PORT}`,
        endpoints: [
            {
                method: 'POST',
                path: '/api/permit/class-d',
                description: 'Submit Class D (Dependant Pass) permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/class-g',
                description: 'Submit Class G (Trade/Business/Consultancy) permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/class-r',
                description: 'Submit Class R (Class R – EAC Nationals) permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/class-n',
                description: 'Submit Class N permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/student-pass',
                description: 'Submit Student Pass permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/special-pass',
                description: 'Submit Special Pass permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/download',
                description: 'Download permit PDF for an approved application'
            },
            {
                method: 'POST',
                path: '/api/permit/citizenship-endorsement',
                description: 'Submit Citizenship Endorsement application'
            },
            {
                method: 'POST',
                path: '/api/permit/dual-citizenship',
                description: 'Submit Dual Citizenship application'
            },
            {
                method: 'POST',
                path: '/api/permit/children-dependants',
                description: 'Submit Children & Dependants application'
            },
            {
                method: 'POST',
                path: '/api/permit/dependant-pass',
                description: 'Submit Dependant\'s Pass application (Form 28)'
            },
            {
                method: 'POST',
                path: '/api/permit/upload-requirements',
                description: 'Upload requirements/documents for a permit application'
            },
            {
                method: 'POST',
                path: '/api/permit/re-entry-pass',
                description: 'Submit Re-entry Pass application'
            },
            {
                method: 'POST',
                path: '/api/permit/foreign-national-certificate',
                description: 'Submit Application for Foreign National Certificate (Alien Card)'
            },
            {
                method: 'POST',
                path: '/api/permit/regularization',
                description: 'Submit Application for Regularization of Status'
            },
            {
                method: 'POST',
                path: '/api/permit/citizen-registration-f10',
                description: 'Submit Registration as Citizen (Form 10 - Lawful Residence)'
            },
            {
                method: 'POST',
                path: '/api/permit/eta-kenya',
                description: 'Submit eTA Kenya application'
            },
            {
                method: 'POST',
                path: '/api/brs',
                description: 'Retrieve business registration documents from BRS eCitizen (body: {ecitizenId, password, companyName})'
            },
            {
                method: 'POST',
                path: '/api/nssf',
                description: 'Register an individual with NSSF (body: profile object)'
            },
            {
                method: 'POST',
                path: '/api/sha',
                description: 'Register an employer with SHA (body: {companyName, directorName, mobile, email, code, password})'
            }





        ],
        permitTypes: {
            'class-d': {
                name: 'Class D',
                description: 'Dependant Pass',
                icon: '👨‍👩‍👧‍👦',
                estimatedTime: '2-3 hours'
            },
            'class-g': {
                name: 'Class G',
                description: 'Trade/Business/Consultancy',
                icon: '💼',
                estimatedTime: '2-3 hours'
            },
            'class-r': {
                name: 'Class R',
                description: 'Class R – EAC Nationals',
                icon: '🙏',
                estimatedTime: '2-3 hours'
            },
            'class-n': {
                name: 'Class N',
                description: 'Class N Permit',
                icon: '📋',
                estimatedTime: '2-3 hours'
            },
            'student-pass': {
                name: 'Student Pass',
                description: 'Student Pass',
                icon: '🎓',
                estimatedTime: '2-3 hours'
            },
            'special-pass': {
                name: 'Special Pass',
                description: 'Special Pass for temporary employment/business',
                icon: '⭐',
                estimatedTime: '1-2 hours'
            },
            'download': {
                name: 'Download Permit',
                description: 'Download approved permit PDF',
                icon: '📥',
                estimatedTime: '1-2 minutes'
            },
            'citizenship-endorsement': {
                name: 'Citizenship Endorsement',
                description: 'Submit Citizenship Endorsement application',
                icon: '🛡️',
                estimatedTime: '2-3 hours'
            },
            'dual-citizenship': {
                name: 'Dual Citizenship',
                description: 'Submit Dual Citizenship application',
                icon: '👥',
                estimatedTime: '2-3 hours'
            },
            'children-dependants': {
                name: 'Children & Dependants',
                description: 'Submit Children & Dependants application',
                icon: '👶',
                estimatedTime: '2-3 hours'
            },
            'dependant-pass': {
                name: 'Dependant\'s Pass',
                description: 'Submit Dependant\'s Pass application (Form 28)',
                icon: '🏠',
                estimatedTime: '2-3 hours'
            }
        }
    });
});

// Validation middleware
function validatePermitRequest(req, res, next) {
    const { login, formData } = req.body;

    if (!login || !login.email || !login.idNumber || !login.password) {
        return res.status(400).json({
            success: false,
            error: 'Login credentials are required (email, idNumber, password)'
        });
    }

    if (!formData) {
        return res.status(400).json({
            success: false,
            error: 'Form data is required'
        });
    }

    next();
}

// Validation middleware for download permit (doesn't require formData)
function validateDownloadRequest(req, res, next) {
    const { login, applicantName } = req.body;

    if (!login || !login.email || !login.idNumber || !login.password) {
        return res.status(400).json({
            success: false,
            error: 'Login credentials are required (email, idNumber, password)'
        });
    }

    if (!applicantName) {
        return res.status(400).json({
            success: false,
            error: 'Applicant name is required to identify the permit to download'
        });
    }

    next();
}

// Validation middleware for eTA Kenya (doesn't require EFNS login)
function validateEtaKenyaRequest(req, res, next) {
    const { formData } = req.body;

    if (!formData) {
        return res.status(400).json({
            success: false,
            error: 'Form data is required'
        });
    }

    next();
}

// Class D endpoint
app.post('/api/permit/class-d', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Class D permit automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Class D automation started. Browser will open shortly.',
            permitClass: 'D',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runClassDAutomation(req.body)
            .then(result => console.log('✅ Class D completed:', result))
            .catch(error => console.error('❌ Class D failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Class G endpoint
app.post('/api/permit/class-g', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Class G permit automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Class G automation started. Browser will open shortly.',
            permitClass: 'G',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runClassGAutomation(req.body)
            .then(result => console.log('✅ Class G completed:', result))
            .catch(error => console.error('❌ Class G failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Class R endpoint
app.post('/api/permit/class-r', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Class R permit automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Class R automation started. Browser will open shortly.',
            permitClass: 'R',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runClassRAutomation(req.body)
            .then(result => console.log('✅ Class R completed:', result))
            .catch(error => console.error('❌ Class R failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Class N endpoint
app.post('/api/permit/class-n', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Class N permit automation request');
        console.log('👤 User:', req.body.formData?.mainApplication?.surname, req.body.formData?.mainApplication?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Class N automation started. Browser will open shortly.',
            permitClass: 'N',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runClassNAutomation(req.body)
            .then(result => console.log('✅ Class N completed:', result))
            .catch(error => console.error('❌ Class N failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Student Pass endpoint
app.post('/api/permit/student-pass', validatePermitRequest, async (req, res) => {
    try {
        console.log('🎓 Received Student Pass automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Student Pass automation started. Browser will open shortly.',
            permitClass: 'Student Pass',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runStudentPassAutomation(req.body)
            .then(result => console.log('✅ Student Pass completed:', result))
            .catch(error => console.error('❌ Student Pass failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Special Pass endpoint
app.post('/api/permit/special-pass', validatePermitRequest, async (req, res) => {
    try {
        console.log('⭐ Received Special Pass automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Generate a job ID for progress tracking
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

        // Send immediate response with job ID
        res.json({
            success: true,
            message: 'Special Pass automation started. Browser will open shortly.',
            permitClass: 'Special Pass',
            jobId: jobId,
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously with job ID
        runSpecialPassAutomation(req.body, jobId)
            .then(result => console.log('✅ Special Pass completed:', result))
            .catch(error => console.error('❌ Special Pass failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Special Pass progress query endpoint
app.get('/api/permit/special-pass/progress/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const progress = getSpecialPassJobProgress(jobId);

        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        res.json({
            success: true,
            progress: progress
        });
    } catch (error) {
        console.error('❌ Error fetching progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Special Pass stop job endpoint
app.delete('/api/permit/special-pass/progress/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const stopped = await stopSpecialPassJob(jobId);
        if (!stopped) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        res.json({ success: true, message: 'Automation stopped' });
    } catch (error) {
        console.error('❌ Error stopping job:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Special Pass latest job endpoint
app.get('/api/permit/special-pass/latest', (req, res) => {
    try {
        const latestJobId = getLatestSpecialPassJobId();

        if (!latestJobId) {
            return res.json({
                success: true,
                jobId: null,
                message: 'No jobs have been run yet'
            });
        }

        const progress = getSpecialPassJobProgress(latestJobId);
        res.json({
            success: true,
            jobId: latestJobId,
            progress: progress
        });
    } catch (error) {
        console.error('❌ Error fetching latest job:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download Permit endpoint
app.post('/api/permit/download', validateDownloadRequest, async (req, res) => {
    try {
        console.log('📥 Received Download Permit automation request');
        console.log('👤 Applicant:', req.body.applicantName);

        // Send immediate response
        res.json({
            success: true,
            message: 'Download permit automation started. Browser will open shortly.',
            permitClass: 'Download',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runDownloadPermitAutomation(req.body)
            .then(result => console.log('✅ Download Permit completed:', result))
            .catch(error => console.error('❌ Download Permit failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Citizenship Endorsement endpoint
app.post('/api/permit/citizenship-endorsement', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Citizenship Endorsement automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Citizenship Endorsement automation started. Browser will open shortly.',
            permitClass: 'Citizenship Endorsement',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runCitizenshipEndorsementAutomation(req.body)
            .then(result => console.log('✅ Citizenship Endorsement completed:', result))
            .catch(error => console.error('❌ Citizenship Endorsement failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Dual Citizenship endpoint
app.post('/api/permit/dual-citizenship', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Dual Citizenship automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Dual Citizenship automation started. Browser will open shortly.',
            permitClass: 'Dual Citizenship',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runDualCitizenshipAutomation(req.body)
            .then(result => console.log('✅ Dual Citizenship completed:', result))
            .catch(error => console.error('❌ Dual Citizenship failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Children & Dependants endpoint
app.post('/api/permit/children-dependants', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Children & Dependants automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Children & Dependants automation started. Browser will open shortly.',
            permitClass: 'Children & Dependants',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runChildrenDependantsAutomation(req.body)
            .then(result => console.log('✅ Children & Dependants completed:', result))
            .catch(error => console.error('❌ Children & Dependants failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Dependant's Pass endpoint
app.post('/api/permit/dependant-pass', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Dependant\'s Pass automation request');
        console.log('👤 Sponsor:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Dependant\'s Pass automation started. Browser will open shortly.',
            permitClass: 'Dependant\'s Pass',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runDependantPassAutomation(req.body)
            .then(result => console.log('✅ Dependant\'s Pass completed:', result))
            .catch(error => console.error('❌ Dependant\'s Pass failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Upload Requirements endpoint
app.post('/api/permit/upload-requirements', async (req, res) => {
    try {
        console.log('📤 Received Upload Requirements automation request');

        // Send immediate response
        res.json({
            success: true,
            message: 'Upload requirements automation started. Browser will open shortly.',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runUploadRequirementsAutomation(req.body)
            .then(result => console.log('✅ Upload Requirements completed:', result))
            .catch(error => console.error('❌ Upload Requirements failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Re-entry Pass endpoint
app.post('/api/permit/re-entry-pass', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Re-entry Pass automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Re-entry Pass automation started. Browser will open shortly.',
            permitClass: 'Re-entry Pass',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runReEntryPassAutomation(req.body)
            .then(result => console.log('✅ Re-entry Pass completed:', result))
            .catch(error => console.error('❌ Re-entry Pass failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Foreign National Certificate endpoint
app.post('/api/permit/foreign-national-certificate', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Foreign National Certificate automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Foreign National Certificate automation started. Browser will open shortly.',
            permitClass: 'Foreign National Certificate',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runForeignNationalCertificateAutomation(req.body)
            .then(result => console.log('✅ Foreign National Certificate completed:', result))
            .catch(error => console.error('❌ Foreign National Certificate failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Regularization endpoint
app.post('/api/permit/regularization', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Regularization automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Regularization automation started. Browser will open shortly.',
            permitClass: 'Regularization',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runRegularizationAutomation(req.body)
            .then(result => console.log('✅ Regularization completed:', result))
            .catch(error => console.error('❌ Regularization failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Registration Citizen Form 10 endpoint
app.post('/api/permit/citizen-registration-f10', validatePermitRequest, async (req, res) => {
    try {
        console.log('📥 Received Registration Citizen (Form 10) automation request');
        console.log('👤 User:', req.body.formData?.surname, req.body.formData?.otherNames);

        // Send immediate response
        res.json({
            success: true,
            message: 'Citizen Registration Form 10 automation started. Browser will open shortly.',
            permitClass: 'Registration Citizen F10',
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runRegistrationCitizenForm10Automation(req.body)
            .then(result => console.log('✅ Citizen Registration Form 10 completed:', result))
            .catch(error => console.error('❌ Citizen Registration Form 10 failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// eTA Kenya endpoint
app.post('/api/permit/eta-kenya', validateEtaKenyaRequest, async (req, res) => {
    try {
        console.log('📥 Received eTA Kenya automation request');
        console.log('👤 Nationality:', req.body.formData?.nationality);
        console.log('📧 Email:', req.body.formData?.emailAddress);

        // Generate a job ID for progress tracking
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

        // Send immediate response with job ID
        res.json({
            success: true,
            message: 'eTA Kenya automation started. Browser will open shortly.',
            permitClass: 'eTA',
            jobId: jobId,
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously with job ID
        runEtaKenyaAutomation(req.body, jobId)
            .then(result => console.log('✅ eTA Kenya completed:', result))
            .catch(error => console.error('❌ eTA Kenya failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// eTA Kenya progress query endpoint
app.get('/api/permit/eta-kenya/progress/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const progress = getJobProgress(jobId);

        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        res.json({
            success: true,
            progress: progress
        });
    } catch (error) {
        console.error('❌ Error fetching progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// eTA Kenya stop job endpoint
app.delete('/api/permit/eta-kenya/progress/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const stopped = await stopJob(jobId);
        if (!stopped) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        res.json({ success: true, message: 'Automation stopped' });
    } catch (error) {
        console.error('❌ Error stopping job:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// eTA Kenya latest job endpoint
app.get('/api/permit/eta-kenya/latest', (req, res) => {
    try {
        const latestJobId = getLatestJobId();

        if (!latestJobId) {
            return res.json({
                success: true,
                jobId: null,
                message: 'No jobs have been run yet'
            });
        }

        const progress = getJobProgress(latestJobId);

        res.json({
            success: true,
            jobId: latestJobId,
            progress: progress
        });
    } catch (error) {
        console.error('❌ Error fetching latest job:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});






// BRS (Business Registration Service) endpoint
app.post('/api/brs', async (req, res) => {
    try {
        console.log('📥 Received BRS automation request');
        // Precedence: explicit request body -> the eCitizen credentials already
        // configured in this service's .env (same ones brs-register uses) ->
        // the legacy Supabase table (rarely populated, kept for compatibility).
        const {
            ecitizenId = process.env.ECITIZEN_ID,
            password = process.env.ECITIZEN_PASSWORD,
            companyName,
        } = req.body || {};

        if ((ecitizenId && !password) || (!ecitizenId && password)) {
            return res.status(400).json({
                success: false,
                error: 'Both ecitizenId and password are required when providing direct credentials'
            });
        }

        // Generate a job ID for tracking
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

        // Send immediate response
        res.json({
            success: true,
            message: 'BRS automation started. Browser will open shortly.',
            jobId: jobId,
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        runBrsAutomation({ ecitizenId, password, companyName })
            .then(result => console.log('✅ BRS completed:', result))
            .catch(error => console.error('❌ BRS failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Private Limited Company incorporation — fills the BRS v2 wizard end to end
// and stops at the review screen. Credentials come from automations/.env unless
// the caller passes them explicitly.
app.post('/api/brs/private-ltd', async (req, res) => {
    try {
        console.log('📥 Received BRS private-ltd incorporation request');
        const { login = {}, profile = {}, overrides = {} } = req.body || {};

        const ecitizenId = login.ecitizenId || process.env.ECITIZEN_ID;
        const password = login.password || process.env.ECITIZEN_PASSWORD;
        if (!ecitizenId || !password) {
            return res.status(503).json({
                success: false,
                error: 'ecitizen_credentials_missing',
                message: 'Set ECITIZEN_ID and ECITIZEN_PASSWORD in automations/.env, or pass login.ecitizenId / login.password.'
            });
        }

        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

        res.json({
            success: true,
            message: 'BRS incorporation started. Browser will open shortly.',
            jobId: jobId,
            timestamp: new Date().toISOString()
        });

        runBrsPrivateLtd({ login: { ecitizenId, password }, profile, overrides })
            .then(result => console.log('✅ BRS private-ltd completed:', result))
            .catch(error => console.error('❌ BRS private-ltd failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// NSSF individual registration endpoint
app.post('/api/nssf', async (req, res) => {
    try {
        console.log('📥 Received NSSF registration request');
        const body = req.body?.profile || req.body || {};
        // NSSF registers the person who holds the eCitizen account this whole
        // filing runs under — default to that identity (same one BRS uses)
        // rather than requiring a National ID the investor's own profile
        // (a foreign passport holder) was never going to have.
        const profile = {
            name: DIRECTOR.fullName,
            idNumber: DIRECTOR.idNumber,
            firstName: DIRECTOR.firstName,
            surname: DIRECTOR.surname,
            telephone: DIRECTOR.phone,
            email: DIRECTOR.email,
            ...body,
        };

        if (!profile.name || !profile.idNumber) {
            return res.status(400).json({
                success: false,
                error: 'Profile is required with at least name and idNumber'
            });
        }

        console.log('👤 Registrant:', profile.name);

        // Generate a job ID for tracking
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

        // Send immediate response
        res.json({
            success: true,
            message: 'NSSF registration automation started. Browser will open shortly.',
            jobId: jobId,
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        registerNssf(profile)
            .then(result => console.log('✅ NSSF completed:', result))
            .catch(error => console.error('❌ NSSF failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// SHA employer registration endpoint
app.post('/api/sha', async (req, res) => {
    try {
        console.log('📥 Received SHA employer registration request');
        const body = req.body?.company || req.body || {};
        // Director identity defaults the same way as BRS/NSSF. companyName can
        // come through as the investor profile's company_name field too.
        const company = {
            directorName: DIRECTOR.fullName,
            mobile: DIRECTOR.phone,
            email: DIRECTOR.email,
            companyName: body.company_name,
            code: process.env.SHA_EMPLOYER_CODE,
            password: process.env.SHA_EMPLOYER_PASSWORD,
            ...body,
        };

        // code/password are the SHA employer portal's own login, issued after
        // registration — there is no sensible default, unlike the eCitizen
        // identity fields above.
        if (!company.code || !company.password) {
            return res.status(503).json({
                success: false,
                error: 'sha_credentials_missing',
                message: 'Set SHA_EMPLOYER_CODE and SHA_EMPLOYER_PASSWORD in automations/.env, or pass company.code / company.password.',
            });
        }

        const required = ['companyName', 'directorName', 'mobile', 'email', 'code', 'password'];
        const missing = required.filter(field => !company?.[field]);

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missing.join(', ')}`
            });
        }

        console.log('🏢 Company:', company.companyName);

        // Generate a job ID for tracking
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

        // Send immediate response
        res.json({
            success: true,
            message: 'SHA registration automation started. Browser will open shortly.',
            jobId: jobId,
            timestamp: new Date().toISOString()
        });

        // Run automation asynchronously
        registerSha(company)
            .then(result => console.log('✅ SHA completed:', result))
            .catch(error => console.error('❌ SHA failed:', error.message));

    } catch (error) {
        console.error('❌ Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// ═════════ KRA (Kenya Revenue Authority) endpoints ═════════
app.post('/api/kra/register-pin', async (req, res) => {
    try {
        console.log('📥 Received KRA PIN registration request');
        const profile = req.body?.profile || req.body;
        if (!profile?.firstName || !profile?.lastName) {
            return res.status(400).json({
                success: false,
                error: 'profile.firstName and profile.lastName are required'
            });
        }
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);
        res.json({
            success: true,
            message: 'KRA PIN registration started. Browser will open shortly.',
            jobId,
            timestamp: new Date().toISOString(),
        });
        registerKraPin(profile)
            .then(result => console.log('✅ KRA PIN completed:', result?.pin || result?.success))
            .catch(err => console.error('❌ KRA PIN failed:', err.message));
    } catch (error) {
        console.error('❌ KRA server error:', error);
        if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/kra/file-nil-return', async (req, res) => {
    try {
        console.log('📥 Received KRA nil-return request');
        const { kind = 'paye', company_name = '', returnPeriodYear } = req.body || {};
        // Falls back to .env so the browser never has to hold KRA credentials.
        const pin = req.body?.pin || process.env.KRA_PIN;
        const password = req.body?.password || process.env.KRA_PASSWORD;
        if (!pin || !password) {
            return res.status(400).json({ success: false, error: 'pin and password are required' });
        }
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);
        res.json({
            success: true,
            message: `KRA ${kind.toUpperCase()} nil-return filing started.`,
            jobId,
            kind,
            timestamp: new Date().toISOString(),
        });
        fileKraNilReturn({ pin, password, kind, company_name, returnPeriodYear }, { jobId })
            .then(result => console.log(`✅ KRA ${kind} nil-return completed:`, result?.acknowledgement || result?.success))
            .catch(err => console.error(`❌ KRA ${kind} nil-return failed:`, err.message));
    } catch (error) {
        console.error('❌ KRA nil-return error:', error);
        if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/kra/check-credentials', async (req, res) => {
    try {
        console.log('📥 Received KRA credential-check request');
        const { company_name = '' } = req.body || {};
        // Falls back to .env so the browser never has to hold KRA credentials.
        const pin = req.body?.pin || process.env.KRA_PIN;
        const password = req.body?.password || process.env.KRA_PASSWORD;
        if (!pin || !password) {
            return res.status(400).json({ success: false, error: 'pin and password are required' });
        }
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);
        res.json({
            success: true,
            message: 'KRA credential check started. Browser will open shortly.',
            jobId,
            timestamp: new Date().toISOString(),
        });
        checkKraCredentials({ pin, password, company_name }, { jobId })
            .then(result => console.log(`✅ KRA credential check: ${result.status}`))
            .catch(err => console.error('❌ KRA credential check failed:', err.message));
    } catch (error) {
        console.error('❌ KRA credential check error:', error);
        if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/docs',
            'POST /api/permit/class-d',
            'POST /api/permit/class-g',
            'POST /api/permit/class-r',
            'POST /api/permit/class-n',
            'POST /api/permit/student-pass',
            'POST /api/permit/special-pass',
            'POST /api/permit/download',
            'POST /api/permit/citizenship-endorsement',
            'POST /api/permit/dual-citizenship',
            'POST /api/permit/children-dependants',
            'POST /api/permit/dependant-pass',
            'POST /api/permit/foreign-national-certificate',
            'POST /api/permit/eta-kenya',
            'GET /api/permit/eta-kenya/progress/:jobId',
            'GET /api/permit/eta-kenya/latest',
            'POST /api/brs',
            'POST /api/nssf',
            'POST /api/sha'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    const isHeadless = process.env.HEADLESS?.trim().toLowerCase() !== 'false';
    const slowMo = parseInt(process.env.SLOW_MO) || 2;

    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Mode: ${isHeadless ? 'Headless' : 'Headful'}`);
    console.log(`⚡ Speed: ${slowMo}ms (slowMo)`);
    console.log(`Ready for automation!`);
});

export default app;
