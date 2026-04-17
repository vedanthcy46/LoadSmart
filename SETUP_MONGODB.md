# MongoDB Setup Instructions for Windows

## Problem
MongoDB Atlas connection is failing due to DNS resolution issues:
`Error: querySrv ECONNREFUSED _mongodb._tcp.cluster0.iyewviq.mongodb.net`

## Solution: Install MongoDB Locally

### Step 1: Download MongoDB Community Edition
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0 or higher)
   - Platform: Windows
   - Package: msi
3. Click Download

### Step 2: Install MongoDB
1. Run the downloaded `.msi` installer
2. Choose "Complete" setup
3. Check "Install MongoDB as a Service"
4. Check "Install MongoDB Compass" (optional but recommended)
5. Click Install

### Step 3: Start MongoDB Service
After installation, MongoDB should start automatically. To verify:

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it
Start-Service MongoDB
```

### Step 4: Verify MongoDB is Running
```powershell
mongod --version
```

### Step 5: Restart the Server
```powershell
# Navigate to project directory
cd C:\Users\hp victus\Desktop\LoadSmart

# Start the server
node server/index.js
```

## Alternative Quick Fix (If MongoDB Atlas Must Work)

If you need to use MongoDB Atlas, try these steps:

1. Check your internet connection
2. Temporarily disable firewall/antivirus
3. Try using mobile hotspot instead of WiFi
4. Update your network drivers

## Current Server Configuration
The server is configured to use local MongoDB by default:
`mongodb://localhost:27017/LoadSmart`

## After Installation
Once MongoDB is installed locally, the server will automatically connect to it without any code changes needed.
