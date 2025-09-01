const { getContract, uploadToPinata, generateCertificatePDF } = require('./_utils.js');
const { ethers } = require('ethers');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { studentAddress, studentName, courseName, grade, completionDate } = req.body;

        if (!studentAddress || !studentName || !courseName || !grade || !completionDate) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const contract = getContract();
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL));

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
            completionDate: new Date(completionDate * 1000).toISOString(),
            issuer: signer.address
        };

        const pdfBuffer = await generateCertificatePDF(certificateData);
        const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(pdfBuffer, `certificate-${studentName}-${courseName}.pdf`);

        // Issue certificate on blockchain
        const tx = await contract.issueCertificate(
            studentAddress,
            studentName,
            courseName,
            ipfsHash,
            grade,
            completionDate
        );

        await tx.wait();

        // Get the certificate ID from events
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'CertificateIssued';
            } catch {
                return false;
            }
        });

        const certificateId = event ? contract.interface.parseLog(event).args.certificateId.toString() : 'unknown';

        res.json({
            success: true,
            certificateId,
            ipfsHash,
            ipfsUrl,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error issuing certificate:', error);
        res.status(500).json({ error: error.message });
    }
};
