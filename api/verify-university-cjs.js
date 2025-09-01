const { getContract } = require('./_utils.js');
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
        const { universityAddress } = req.body;

        if (!universityAddress) {
            return res.status(400).json({ error: 'University address is required' });
        }

        // Validate address format
        if (!ethers.isAddress(universityAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum address format' });
        }

        const contract = getContract();

        // Get university details
        try {
            const universityDetails = await contract.getUniversityDetails(universityAddress);
            
            if (!universityDetails.name || universityDetails.name === '') {
                return res.json({
                    success: false,
                    error: 'University not found or not registered',
                    address: universityAddress
                });
            }

            // Check if university is verified
            const isVerified = await contract.isUniversityVerified(universityAddress);

            res.json({
                success: true,
                university: {
                    name: universityDetails.name,
                    registrationNumber: universityDetails.registrationNumber,
                    isVerified: isVerified,
                    address: universityAddress,
                    admin: universityDetails.admin
                },
                message: isVerified ? 'University is verified and can issue certificates' : 'University is registered but not yet verified'
            });

        } catch (error) {
            console.error('Error getting university details:', error);
            res.json({
                success: false,
                error: 'University not found or not registered',
                address: universityAddress
            });
        }

    } catch (error) {
        console.error('Error verifying university:', error);
        res.status(500).json({ error: error.message });
    }
};
