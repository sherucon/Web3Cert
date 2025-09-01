# Troubleshooting Network Errors on Vercel

## 🔧 **Fixes Applied**

### 1. **Module System Fix**
- ✅ Converted from CommonJS to ES modules
- ✅ Added `package.json` with `"type": "module"` in `/api/` directory
- ✅ Changed all `require()` to `import` statements
- ✅ Changed `module.exports` to `export`

### 2. **API Endpoints Simplified**
- ✅ Created simpler certificate issuance without multer
- ✅ Changed from FormData to JSON requests
- ✅ Added health check endpoint

### 3. **CORS Headers**
- ✅ Added proper CORS headers to all endpoints
- ✅ Handle OPTIONS preflight requests

## 🧪 **Testing Steps**

### 1. Test Health Endpoint
First, test if the basic API is working:
```
GET /api/health
```
This should return:
```json
{
  "status": "OK",
  "message": "Web3 Certificate API is running on Vercel",
  "environment": {
    "hasPrivateKey": true,
    "hasAmoyRpcUrl": true,
    "hasContractAddress": true,
    "hasPinataApiKey": true,
    "hasPinataSecretKey": true
  }
}
```

### 2. Test Certificate Verification
```
GET /api/verify-certificate?id=1
```

### 3. Test University Registration
```
POST /api/register-university
{
  "name": "Test University",
  "registrationNumber": "TU001"
}
```

### 4. Test Certificate Issuance
```
POST /api/issue-certificate-simple
{
  "studentAddress": "0x...",
  "studentName": "Test Student",
  "courseName": "Test Course",
  "grade": "A",
  "completionDate": 1693526400
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Network error while attempting to fetch resources"**
**Causes:**
- Module system mismatch (CommonJS vs ES modules)
- Missing environment variables
- CORS issues
- API endpoint not found

**Solutions:**
✅ Fixed module system
✅ Added CORS headers
✅ Simplified API endpoints

### **Issue 2: "Function not found"**
**Causes:**
- File not in `/api/` directory
- Wrong file extension
- Export syntax issues

**Solutions:**
✅ All files in `/api/` directory
✅ Using `.js` extensions
✅ Using `export default`

### **Issue 3: Import/Require errors**
**Causes:**
- Mixing CommonJS and ES modules
- Missing package.json

**Solutions:**
✅ Pure ES modules in `/api/`
✅ Added `/api/package.json`

## 📝 **Environment Variables Required**

Make sure these are set in Vercel:
```
PRIVATE_KEY=your_wallet_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
CONTRACT_ADDRESS=0x0fFA6B784CA4d1D97d37Bdc9717Dfa0296319659
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

## 🔍 **Debug Steps**

1. **Check Vercel Function Logs**
   - Go to Vercel dashboard
   - Click on your deployment
   - Check "Functions" tab for errors

2. **Test API Endpoints Individually**
   - Start with `/api/health`
   - Then try `/api/verify-certificate?id=1`
   - Finally test other endpoints

3. **Check Browser Console**
   - Look for CORS errors
   - Check network tab for failed requests
   - Verify API base URL is correct

4. **Verify Environment Variables**
   - Use `/api/health` to check if env vars are loaded
   - Make sure all required variables are set

## 🎯 **Expected Behavior**

After these fixes:
- ✅ Health endpoint should work
- ✅ Certificate verification should work
- ✅ University registration should work
- ✅ Certificate issuance should work (without file upload)
- ✅ No more "network error" messages

The main changes ensure compatibility with Vercel's serverless environment and fix the module system issues that were causing the network errors.
