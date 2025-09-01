const { ethers } = require('ethers');

// Contract ABI (simplified for the functions we need)
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
function getContract() {
    const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.CONTRACT_ADDRESS || '0x0fFA6B784CA4d1D97d37Bdc9717Dfa0296319659';

    return new ethers.Contract(contractAddress, contractABI, signer);
}

// Pinata upload function
async function uploadToPinata(buffer, filename) {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

    // If Pinata credentials are not set, return a mock hash for testing
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY || PINATA_API_KEY === 'your_pinata_api_key_here') {
        console.log('⚠️  Using mock IPFS hash - Please configure Pinata credentials for production');
        return `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
        const FormData = (await import('form-data')).default;
        const { Readable } = await import('stream');
        const axios = (await import('axios')).default;

        const formData = new FormData();
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
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

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

    const contractAddress = process.env.CONTRACT_ADDRESS || '0x0fFA6B784CA4d1D97d37Bdc9717Dfa0296319659';
    page.drawText(`Contract: ${contractAddress}`, {
        x: 50,
        y: 80,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
}

module.exports = {
    getContract,
    uploadToPinata,
    generateCertificatePDF
};
