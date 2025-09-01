# Quick Start Guide

## Option 1: Deploy to Polygon Amoy Testnet (Recommended)

### 1. Get Testnet MATIC
- Visit [Polygon Faucet](https://faucet.polygon.technology/)
- Select Amoy Testnet
- Enter your wallet address: `0x5e6BF3DcC1C6636e2f73f17C7E52CF2CBa4f51D6` (from your private key)
- Request testnet MATIC tokens

### 2. Set up Pinata (Optional but recommended)
- Sign up at [pinata.cloud](https://pinata.cloud)
- Go to API Keys section
- Create new API key with pinning permissions
- Update `.env` file with your Pinata credentials

### 3. Deploy to Amoy Testnet
```bash
npm run compile
npm run deploy
```

### 4. Start the server
```bash
npm start
```

### 5. Access the application
Open http://localhost:3001

---

## Option 2: Local Development

### 1. Start local Hardhat node
```bash
npm run node
```

### 2. Deploy to local network (in new terminal)
```bash
npm run deploy:local
```

### 3. Start the server
```bash
npm start
```

### 4. Access the application
Open http://localhost:3001

---

## Using the System

### Step 1: Register University
1. Go to "University Management" tab
2. Fill in university details
3. Click "Register University"

### Step 2: Verify University (Admin only)
1. Use the contract owner's wallet
2. Enter the university address in verification form
3. Click "Verify University"

### Step 3: Issue Certificates
1. Go to "Issue Certificate" tab
2. Fill in student and course details
3. Optionally upload a PDF template
4. Click "Issue Certificate"

### Step 4: Verify Certificates
1. Go to "Verify Certificate" tab
2. Enter certificate ID or IPFS hash
3. View certificate details and download PDF

### Step 5: View Student Certificates
1. Go to "Student Certificates" tab
2. Enter student wallet address
3. View all certificates for that student

---

## Important Notes

- **Mock IPFS**: If Pinata is not configured, the system uses mock IPFS hashes for testing
- **Testnet**: Use Amoy testnet for realistic testing without spending real money
- **Security**: Never share your private key or use mainnet private keys for testing
- **Gas Fees**: Transactions require MATIC tokens for gas fees

---

## Troubleshooting

### Common Issues:

1. **Insufficient funds**: Get more testnet MATIC from the faucet
2. **Transaction failed**: Check if university is verified before issuing certificates
3. **Compilation errors**: Make sure all dependencies are installed with `npm install`
4. **IPFS errors**: Either configure Pinata or the system will use mock hashes

### Contract Addresses:
- Your deployed contract address will be saved in `deployment.json`
- Always verify the contract address matches in both frontend and backend

---

## Next Steps for Production

1. **Security Audit**: Get smart contract audited
2. **Real IPFS**: Configure Pinata with proper credentials
3. **Frontend**: Build a React/Vue frontend for better UX
4. **Database**: Add database for caching and analytics
5. **API Keys**: Implement proper authentication
6. **Monitoring**: Add error tracking and monitoring
