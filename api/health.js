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

    res.json({
        status: 'OK',
        message: 'Web3 Certificate API is running on Vercel',
        timestamp: new Date().toISOString(),
        environment: {
            hasPrivateKey: !!process.env.PRIVATE_KEY,
            hasAmoyRpcUrl: !!process.env.AMOY_RPC_URL,
            hasContractAddress: !!process.env.CONTRACT_ADDRESS,
            hasPinataApiKey: !!process.env.PINATA_API_KEY,
            hasPinataSecretKey: !!process.env.PINATA_SECRET_KEY
        }
    });
}
