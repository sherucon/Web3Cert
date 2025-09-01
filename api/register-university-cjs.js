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
        const { name, registrationNumber } = req.body;

        if (!name || !registrationNumber) {
            return res.status(400).json({ error: 'Name and registration number are required' });
        }

        const contract = getContract();
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL));

        // Check if university is already registered
        try {
            const universityDetails = await contract.getUniversityDetails(signer.address);
            if (universityDetails.name && universityDetails.name !== '') {
                return res.json({
                    success: false,
                    message: 'University already registered',
                    existingDetails: {
                        name: universityDetails.name,
                        registrationNumber: universityDetails.registrationNumber,
                        isVerified: universityDetails.isVerified,
                        address: signer.address
                    },
                    action: 'University is already registered. You can proceed to issue certificates if verified.'
                });
            }
        } catch (checkError) {
            // University not found, proceed with registration
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

        // Handle specific error cases
        if (error.message.includes('University already registered')) {
            return res.json({
                success: false,
                message: 'University already registered',
                address: new ethers.Wallet(process.env.PRIVATE_KEY).address,
                action: 'This wallet address is already registered as a university. You can proceed to issue certificates if verified.'
            });
        }

        res.status(500).json({ error: error.message });
    }
};
