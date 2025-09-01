import { getContract } from './_utils.js';
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
        const { name, registrationNumber } = req.body;

        if (!name || !registrationNumber) {
            return res.status(400).json({ error: 'Name and registration number are required' });
        }

        const contract = getContract();
        const tx = await contract.registerUniversity(name, registrationNumber);
        await tx.wait();

        res.json({
            success: true,
            message: 'University registered successfully',
            transactionHash: tx.hash,
            address: process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY).address : 'unknown'
        });
    } catch (error) {
        console.error('Error registering university:', error);
        res.status(500).json({ error: error.message });
    }
}
