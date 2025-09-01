const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Blockchain configuration
let provider, contract, signer;

// Contract ABI (simplified - you'll need to update this after compilation)
const contractABI = [
    "function registerUniversity(string memory name, string memory registrationNumber) external",
    "function verifyUniversity(address universityAddress) external",
    "function issueCertificate(address studentAddress, string memory studentName, string memory courseName, string memory ipfsHash, string memory grade, uint256 completionDate) external",
    "function verifyCertificate(uint256 certificateId) external view returns (tuple(uint256 id, string studentName, string courseName, string university, string ipfsHash, uint256 issueDate, address issuer, bool isValid, string grade, uint256 completionDate) certificate, bool isValid)",
    "function verifyCertificateByHash(string memory ipfsHash) external view returns (tuple(uint256 id, string studentName, string courseName, string university, string ipfsHash, uint256 issueDate, address issuer, bool isValid, string grade, uint256 completionDate) certificate, bool isValid)",
    "function getStudentCertificates(address studentAddress) external view returns (uint256[] memory)",
    "function isUniversityVerified(address universityAddress) external view returns (bool)",
    "function getUniversityDetails(address universityAddress) external view returns (tuple(string name, string registrationNumber, bool isVerified, address admin))"
];

// Initialize blockchain connection
async function initializeBlockchain() {
    try {
        provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
        signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        // Load contract address from deployment file
        const deploymentInfo = JSON.parse(fs.readFileSync('./deployment.json', 'utf8'));
        contract = new ethers.Contract(deploymentInfo.address, contractABI, signer);

        console.log('Blockchain connection initialized');
        console.log('Contract address:', deploymentInfo.address);
    } catch (error) {
        console.error('Failed to initialize blockchain connection:', error);
    }
}

// Pinata IPFS functions (using axios since pinata-web3 is deprecated)
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

async function uploadToPinata(buffer, filename) {
    // If Pinata credentials are not set, return a mock hash for testing
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY || PINATA_API_KEY === 'your_pinata_api_key_here') {
        console.log('⚠️  Using mock IPFS hash - Please configure Pinata credentials for production');
        return `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
        const FormData = require('form-data');
        const formData = new FormData();

        // Convert buffer to stream for form-data
        const { Readable } = require('stream');
        const stream = Readable.from(buffer);

        formData.append('file', stream, {
            filename: filename,
            contentType: 'application/pdf'
        });

        const pinataMetadata = JSON.stringify({
            name: filename,
        });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', pinataOptions);

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            maxBodyLength: 'Infinity',
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to Pinata:', error.message);
        throw new Error('Failed to upload to IPFS');
    }
}

// Generate certificate PDF
async function generateCertificatePDF(certificateData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const { width, height } = page.getSize();

    // Certificate template
    page.drawText('CERTIFICATE OF COMPLETION', {
        x: width / 2 - 150,
        y: height - 100,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0.8),
    });

    page.drawText('This is to certify that', {
        x: width / 2 - 80,
        y: height - 200,
        size: 14,
        font: font,
    });

    page.drawText(certificateData.studentName, {
        x: width / 2 - (certificateData.studentName.length * 6),
        y: height - 250,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0.8),
    });

    page.drawText('has successfully completed the course', {
        x: width / 2 - 110,
        y: height - 300,
        size: 14,
        font: font,
    });

    page.drawText(certificateData.courseName, {
        x: width / 2 - (certificateData.courseName.length * 5),
        y: height - 350,
        size: 18,
        font: boldFont,
    });

    page.drawText(`Grade: ${certificateData.grade}`, {
        x: width / 2 - 40,
        y: height - 400,
        size: 14,
        font: font,
    });

    page.drawText(`Issued by: ${certificateData.university}`, {
        x: 50,
        y: height - 500,
        size: 12,
        font: font,
    });

    page.drawText(`Date: ${new Date(certificateData.completionDate * 1000).toLocaleDateString()}`, {
        x: 50,
        y: height - 520,
        size: 12,
        font: font,
    });

    // Add blockchain verification info
    page.drawText('Blockchain Verified Certificate', {
        x: 50,
        y: 100,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Contract: ${contract.target}`, {
        x: 50,
        y: 80,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Web3 Certificate API is running' });
});

// Register university
app.post('/api/university/register', async (req, res) => {
    try {
        const { name, registrationNumber } = req.body;

        if (!name || !registrationNumber) {
            return res.status(400).json({ error: 'Name and registration number are required' });
        }

        const tx = await contract.registerUniversity(name, registrationNumber);
        await tx.wait();

        res.json({
            success: true,
            message: 'University registered successfully',
            transactionHash: tx.hash,
            address: signer.address
        });
    } catch (error) {
        console.error('Error registering university:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify university (admin only)
app.post('/api/university/verify', async (req, res) => {
    try {
        const { universityAddress } = req.body;

        if (!universityAddress) {
            return res.status(400).json({ error: 'University address is required' });
        }

        const tx = await contract.verifyUniversity(universityAddress);
        await tx.wait();

        res.json({
            success: true,
            message: 'University verified successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error verifying university:', error);
        res.status(500).json({ error: error.message });
    }
});

// Issue certificate
app.post('/api/certificate/issue', upload.single('template'), async (req, res) => {
    try {
        const { studentAddress, studentName, courseName, grade, completionDate } = req.body;

        if (!studentAddress || !studentName || !courseName || !grade || !completionDate) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if university is verified
        const isVerified = await contract.isUniversityVerified(signer.address);
        if (!isVerified) {
            return res.status(403).json({ error: 'University not verified' });
        }

        // Generate certificate PDF
        const certificateData = {
            studentName,
            courseName,
            grade,
            completionDate: parseInt(completionDate),
            university: (await contract.getUniversityDetails(signer.address)).name
        };

        let pdfBuffer;
        if (req.file) {
            // Use uploaded template
            pdfBuffer = req.file.buffer;
        } else {
            // Generate default certificate
            pdfBuffer = await generateCertificatePDF(certificateData);
        }

        // Upload to IPFS
        const filename = `certificate_${studentName}_${courseName}_${Date.now()}.pdf`;
        const ipfsHash = await uploadToPinata(pdfBuffer, filename);

        // Issue certificate on blockchain
        const tx = await contract.issueCertificate(
            studentAddress,
            studentName,
            courseName,
            ipfsHash,
            grade,
            parseInt(completionDate)
        );
        const receipt = await tx.wait();

        // Get certificate ID from the event logs
        let certificateId = null;
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog.name === 'CertificateIssued') {
                    certificateId = parsedLog.args.certificateId.toString();
                    break;
                }
            } catch (error) {
                // Skip logs that can't be parsed
            }
        }

        res.json({
            success: true,
            message: 'Certificate issued successfully',
            certificateId,
            ipfsHash,
            transactionHash: tx.hash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        });
    } catch (error) {
        console.error('Error issuing certificate:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify certificate by ID
app.get('/api/certificate/verify/:id', async (req, res) => {
    try {
        const certificateId = req.params.id;
        const [certificate, isValid] = await contract.verifyCertificate(certificateId);

        res.json({
            certificate: {
                id: certificate.id.toString(),
                studentName: certificate.studentName,
                courseName: certificate.courseName,
                university: certificate.university,
                ipfsHash: certificate.ipfsHash,
                issueDate: new Date(Number(certificate.issueDate) * 1000).toISOString(),
                grade: certificate.grade,
                completionDate: new Date(Number(certificate.completionDate) * 1000).toISOString(),
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`
            },
            isValid
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify certificate by IPFS hash
app.get('/api/certificate/verify-hash/:hash', async (req, res) => {
    try {
        const ipfsHash = req.params.hash;
        const [certificate, isValid] = await contract.verifyCertificateByHash(ipfsHash);

        res.json({
            certificate: {
                id: certificate.id.toString(),
                studentName: certificate.studentName,
                courseName: certificate.courseName,
                university: certificate.university,
                ipfsHash: certificate.ipfsHash,
                issueDate: new Date(Number(certificate.issueDate) * 1000).toISOString(),
                grade: certificate.grade,
                completionDate: new Date(Number(certificate.completionDate) * 1000).toISOString(),
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`
            },
            isValid
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get student certificates
app.get('/api/student/:address/certificates', async (req, res) => {
    try {
        const studentAddress = req.params.address;
        const certificateIds = await contract.getStudentCertificates(studentAddress);

        const certificates = [];
        for (const id of certificateIds) {
            const [certificate, isValid] = await contract.verifyCertificate(id);
            certificates.push({
                id: certificate.id.toString(),
                studentName: certificate.studentName,
                courseName: certificate.courseName,
                university: certificate.university,
                ipfsHash: certificate.ipfsHash,
                issueDate: new Date(Number(certificate.issueDate) * 1000).toISOString(),
                grade: certificate.grade,
                completionDate: new Date(Number(certificate.completionDate) * 1000).toISOString(),
                isValid,
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`
            });
        }

        res.json({ certificates });
    } catch (error) {
        console.error('Error getting student certificates:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check university verification status
app.get('/api/university/:address/status', async (req, res) => {
    try {
        const universityAddress = req.params.address;
        const isVerified = await contract.isUniversityVerified(universityAddress);
        const details = await contract.getUniversityDetails(universityAddress);

        res.json({
            isVerified,
            details: {
                name: details.name,
                registrationNumber: details.registrationNumber,
                admin: details.admin
            }
        });
    } catch (error) {
        console.error('Error checking university status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeBlockchain();
});

module.exports = app;
