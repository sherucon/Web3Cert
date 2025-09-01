import { getContract, uploadToPinata, generateCertificatePDF } from './_utils.js';
import { ethers } from 'ethers';

export default async function handler(req, res) {
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

        // Generate certificate PDF (no file upload support for now to simplify)
        const certificateData = {
            studentName,
            courseName,
            grade,
            completionDate: parseInt(completionDate),
            university: (await contract.getUniversityDetails(signer.address)).name
        };

        // Generate default certificate
        const pdfBuffer = await generateCertificatePDF(certificateData);

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
}
