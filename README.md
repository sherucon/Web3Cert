# Web3 Certificate System

A blockchain-based tamper-proof certificate issuer and verifier for universities using Polygon Amoy testnet, IPFS (Pinata), and Hardhat.

## Features

- **University Registration**: Universities can register and get verified on the blockchain
- **Certificate Issuance**: Verified universities can issue tamper-proof certificates
- **PDF Generation**: Automatic PDF certificate generation with custom templates
- **IPFS Storage**: Secure decentralized storage using Pinata
- **Certificate Verification**: Anyone can verify certificates using ID or IPFS hash
- **Student Portal**: Students can view all their certificates
- **Blockchain Security**: Immutable records on Polygon blockchain

## Tech Stack

- **Blockchain**: Polygon Amoy Testnet
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Storage**: IPFS via Pinata
- **PDF Generation**: pdf-lib

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- A wallet with Polygon Amoy testnet MATIC tokens
- Pinata account for IPFS storage

### 2. Clone and Install

```bash
git clone <your-repo>
cd Web3Cert
npm install
```

### 3. Environment Configuration

Update the `.env` file with your credentials:

```env
PRIVATE_KEY=your_wallet_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key (optional)
PORT=3001
```

**Getting Pinata Credentials:**
1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Go to API Keys section
3. Create a new API key with pinning permissions
4. Copy the API Key and Secret Key to your .env file

**Getting Testnet MATIC:**
1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Select Amoy Testnet
3. Enter your wallet address and request tokens

### 4. Deploy Smart Contract

```bash
# Compile the contract
npm run compile

# Deploy to Amoy testnet
npm run deploy
```

The deployment will create a `deployment.json` file with the contract address.

### 5. Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3001
```

## Usage Guide

### For Universities

1. **Register**: Use the "University Management" tab to register your university
2. **Get Verified**: Contact the system admin to verify your university
3. **Issue Certificates**: Use the "Issue Certificate" tab to create blockchain certificates

### For Certificate Verification

1. **By ID**: Enter the certificate ID in the verification tab
2. **By IPFS Hash**: Enter the IPFS hash to verify a certificate
3. **View PDF**: Click the download link to view the certificate PDF

### For Students

1. **View Certificates**: Enter your wallet address to see all your certificates
2. **Share Verification**: Share your certificate ID or IPFS hash for verification

## API Endpoints

### University Management
- `POST /api/university/register` - Register a university
- `POST /api/university/verify` - Verify a university (admin only)
- `GET /api/university/:address/status` - Check university verification status

### Certificate Management
- `POST /api/certificate/issue` - Issue a new certificate
- `GET /api/certificate/verify/:id` - Verify certificate by ID
- `GET /api/certificate/verify-hash/:hash` - Verify certificate by IPFS hash

### Student Operations
- `GET /api/student/:address/certificates` - Get all certificates for a student

## Smart Contract Functions

### University Operations
```solidity
function registerUniversity(string memory name, string memory registrationNumber)
function verifyUniversity(address universityAddress) // Owner only
function isUniversityVerified(address universityAddress) returns (bool)
```

### Certificate Operations
```solidity
function issueCertificate(
    address studentAddress,
    string memory studentName,
    string memory courseName,
    string memory ipfsHash,
    string memory grade,
    uint256 completionDate
)

function verifyCertificate(uint256 certificateId) 
    returns (Certificate memory, bool isValid)

function verifyCertificateByHash(string memory ipfsHash)
    returns (Certificate memory, bool isValid)

function revokeCertificate(uint256 certificateId) // Issuer only
```

## Testing

Run the test suite:

```bash
npm test
```

The tests cover:
- University registration and verification
- Certificate issuance and validation
- Certificate verification and revocation
- Access control and security

## Security Features

1. **Access Control**: Only verified universities can issue certificates
2. **Tamper-Proof**: Certificates stored immutably on blockchain
3. **Duplicate Prevention**: IPFS hash uniqueness prevents duplicates
4. **Revocation**: Universities can revoke certificates if needed
5. **Decentralized Storage**: PDFs stored on IPFS, not centralized servers

## Deployment on Mainnet

To deploy on Polygon mainnet:

1. Update `hardhat.config.js` with mainnet configuration
2. Get mainnet MATIC tokens
3. Update RPC URL to mainnet
4. Run deployment script

## License

MIT License

## Support

For issues and support, please create an issue in the repository.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Note**: This system is designed for educational and demonstration purposes. For production use, implement additional security measures, audit smart contracts, and follow best practices for handling private keys and sensitive data.
