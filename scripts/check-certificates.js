const { ethers } = require("ethers");
require('dotenv').config();

// Contract ABI for the functions we need
const contractABI = [
    "function getTotalCertificates() external view returns (uint256)",
    "function verifyCertificate(uint256 certificateId) external view returns (tuple(uint256 id, string studentName, string courseName, string university, string ipfsHash, uint256 issueDate, address issuer, bool isValid, string grade, uint256 completionDate) certificate, bool isValid)",
    "function certificates(uint256) public view returns (uint256 id, string studentName, string courseName, string university, string ipfsHash, uint256 issueDate, address issuer, bool isValid, string grade, uint256 completionDate)"
];

async function checkCertificates() {
    try {
        // Load deployment info
        const fs = require('fs');
        const deploymentInfo = JSON.parse(fs.readFileSync('./deployment.json', 'utf8'));

        // Connect to the network
        const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
        const contract = new ethers.Contract(deploymentInfo.address, contractABI, provider);

        console.log('📋 Checking certificates on contract:', deploymentInfo.address);
        console.log('🌐 Network:', deploymentInfo.network);

        // Get total number of certificates
        const totalCertificates = await contract.getTotalCertificates();
        console.log('📊 Total certificates issued:', totalCertificates.toString());

        if (totalCertificates > 0) {
            console.log('\n📜 Certificate Details:');
            console.log('='.repeat(80));

            // Get details for each certificate
            for (let i = 1; i <= totalCertificates; i++) {
                try {
                    const [certificate, isValid] = await contract.verifyCertificate(i);

                    console.log(`\n🎓 Certificate ID: ${certificate.id.toString()}`);
                    console.log(`👤 Student: ${certificate.studentName}`);
                    console.log(`📚 Course: ${certificate.courseName}`);
                    console.log(`🏫 University: ${certificate.university}`);
                    console.log(`📅 Issue Date: ${new Date(Number(certificate.issueDate) * 1000).toLocaleString()}`);
                    console.log(`📅 Completion Date: ${new Date(Number(certificate.completionDate) * 1000).toLocaleString()}`);
                    console.log(`🎖️  Grade: ${certificate.grade}`);
                    console.log(`📎 IPFS Hash: ${certificate.ipfsHash}`);
                    console.log(`🌐 IPFS URL: https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`);
                    console.log(`✅ Valid: ${isValid ? 'Yes' : 'No'}`);
                    console.log(`🔑 Issuer: ${certificate.issuer}`);
                    console.log('-'.repeat(80));
                } catch (error) {
                    console.log(`❌ Error reading certificate ${i}:`, error.message);
                }
            }
        } else {
            console.log('📭 No certificates have been issued yet.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkCertificates();
