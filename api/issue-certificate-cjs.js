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
        console.log('[API] Issue Certificate: Start');
        const { studentAddress, studentName, courseName, grade, completionDate } = req.body;
        console.log('[API] Payload:', { studentAddress, studentName, courseName, grade, completionDate });

        if (!studentAddress || !studentName || !courseName || !grade || !completionDate) {
            console.log('[API] Missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        let contract, signer;
        try {
            contract = getContract();
            signer = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL));
            console.log('[API] Contract and signer initialized');
        } catch (initError) {
            console.error('[API] Error initializing contract/signer:', initError);
            return res.status(500).json({ error: 'Failed to initialize contract or signer', details: initError.message });
        }

        // Check if university is verified
        let isVerified;
        try {
            isVerified = await contract.isUniversityVerified(signer.address);
            console.log('[API] University verified status:', isVerified);
        } catch (verifyError) {
            console.error('[API] Error checking university verification:', verifyError);
            return res.status(500).json({ error: 'Failed to check university verification', details: verifyError.message });
        }
        if (!isVerified) {
            console.log('[API] University not verified');
            return res.status(403).json({ error: 'University not verified' });
        }

        // Generate certificate PDF
        let pdfBuffer;
        try {
            const certificateData = {
                studentName,
                courseName,
                grade,
                completionDate: new Date(completionDate * 1000).toISOString(),
                issuer: signer.address
            };
            pdfBuffer = await generateCertificatePDF(certificateData);
            console.log('[API] PDF generated');
        } catch (pdfError) {
            console.error('[API] Error generating PDF:', pdfError);
            return res.status(500).json({ error: 'Failed to generate certificate PDF', details: pdfError.message });
        }

        // Upload to Pinata
        let ipfsHash, ipfsUrl;
        try {
            const uploadResult = await uploadToPinata(pdfBuffer, `certificate-${studentName}-${courseName}.pdf`);
            ipfsHash = uploadResult.hash;
            ipfsUrl = uploadResult.url;
            console.log('[API] Uploaded to Pinata:', ipfsHash);
        } catch (pinataError) {
            console.error('[API] Error uploading to Pinata:', pinataError);
            return res.status(500).json({ error: 'Failed to upload to Pinata', details: pinataError.message });
        }

        // Issue certificate on blockchain
        let tx, receipt, certificateId = 'unknown';
        try {
            tx = await contract.issueCertificate(
                studentAddress,
                studentName,
                courseName,
                ipfsHash,
                grade,
                completionDate
            );
            console.log('[API] Transaction sent:', tx.hash);
            receipt = await tx.wait();
            console.log('[API] Transaction confirmed');
            const event = receipt.logs.find(log => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed.name === 'CertificateIssued';
                } catch {
                    return false;
                }
            });
            certificateId = event ? contract.interface.parseLog(event).args.certificateId.toString() : 'unknown';
            console.log('[API] Certificate issued, ID:', certificateId);
        } catch (txError) {
            console.error('[API] Error issuing certificate on blockchain:', txError);
            return res.status(500).json({ error: 'Failed to issue certificate on blockchain', details: txError.message });
        }

        res.json({
            success: true,
            certificateId,
            ipfsHash,
            ipfsUrl,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('[API] Unexpected error issuing certificate:', error);
        res.status(500).json({ error: error.message });
    }
};
