import { getContract } from './_utils.js';

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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Certificate ID is required' });
        }

        const contract = getContract();
        const [certificate, isValid] = await contract.verifyCertificate(id);

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
}
