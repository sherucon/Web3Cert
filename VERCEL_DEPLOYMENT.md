# Vercel Deployment Guide

## 🚀 Deploy to Vercel

Follow these steps to deploy your Web3 Certificate System to Vercel:

### 1. Prepare for Deployment

Make sure you have:
- A deployed smart contract on Polygon Amoy
- Pinata account with API keys
- All environment variables ready

### 2. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 3. Set Environment Variables in Vercel

**Option A: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Create/Import your project
3. Go to Settings → Environment Variables
4. Add these variables:

```
PRIVATE_KEY=your_wallet_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

**Option B: Using Vercel CLI**
```bash
vercel env add PRIVATE_KEY
vercel env add AMOY_RPC_URL
vercel env add PINATA_API_KEY
vercel env add PINATA_SECRET_KEY
vercel env add CONTRACT_ADDRESS
```

### 4. Deploy

**Option A: Git Integration (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Vercel will auto-deploy on every push

**Option B: Manual Deploy**
```bash
vercel --prod
```

### 5. Update API Base URL

The frontend will automatically detect if it's running on Vercel and use the correct API endpoints.

## 📁 **Project Structure for Vercel**

```
Web3Cert/
├── api/                     # Serverless functions
│   ├── _utils.js           # Shared utilities
│   ├── register-university.js
│   ├── issue-certificate.js
│   ├── verify-certificate.js
│   ├── verify-certificate-hash.js
│   └── student-certificates.js
├── public/                  # Static files
│   └── index.html
├── vercel.json             # Vercel configuration
└── package.json
```

## 🔧 **Key Changes Made for Vercel**

### 1. **Serverless Functions**
- Converted Express routes to individual serverless functions
- Each API endpoint is now a separate file in `/api/` directory

### 2. **Static File Serving**
- HTML/CSS/JS files moved to `/public/` directory
- Vercel serves these automatically

### 3. **Environment Variables**
- Contract address now comes from environment variable
- No more reading from `deployment.json` file

### 4. **CORS Handling**
- Added proper CORS headers to all API functions
- Handles OPTIONS requests for preflight

### 5. **File Upload Handling**
- Modified multer to work in serverless environment
- Proper middleware handling for Vercel

## 🌐 **API Endpoints**

Your deployed app will have these endpoints:

- `POST /api/register-university` - Register university
- `POST /api/issue-certificate` - Issue certificate
- `GET /api/verify-certificate?id=123` - Verify by ID
- `GET /api/verify-certificate-hash?hash=QmAbc...` - Verify by hash
- `GET /api/student-certificates?address=0x123...` - Get student certificates

## ⚠️ **Important Notes**

1. **Environment Variables**: Make sure all environment variables are set in Vercel dashboard
2. **Contract Address**: Update the CONTRACT_ADDRESS environment variable with your deployed contract
3. **Pinata Setup**: Configure Pinata credentials for IPFS uploads
4. **Serverless Limits**: Vercel has execution time limits (10s for Hobby, 60s for Pro)
5. **Cold Starts**: First request might be slower due to serverless cold starts

## 🧪 **Testing**

After deployment:
1. Test university registration
2. Test certificate issuance
3. Test certificate verification
4. Check if IPFS uploads work

## 🔍 **Troubleshooting**

### Common Issues:

1. **"Function not found"**: Check if API files are in `/api/` directory
2. **Environment variables**: Verify all env vars are set in Vercel
3. **CORS errors**: Check if CORS headers are properly set
4. **File upload issues**: Ensure multer is configured for serverless
5. **Contract errors**: Verify contract address and network

### Debug Steps:

1. Check Vercel function logs
2. Test API endpoints individually
3. Verify blockchain connection
4. Check environment variables

## 📈 **Performance Optimization**

1. **Cold Start Reduction**: Keep functions warm with regular requests
2. **Caching**: Implement caching for frequently accessed data
3. **Bundle Size**: Minimize dependencies in serverless functions
4. **Connection Pooling**: Reuse blockchain connections when possible

Your Web3 Certificate System is now ready for production on Vercel! 🎉
