#!/bin/bash

# Social Login Test Script
# This script helps you test the Google and Apple Sign-In implementation

echo "========================================="
echo "Social Login Implementation Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:3000/api/v1 > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Please start the backend with: npm run start:dev"
    exit 1
fi

echo ""
echo "2. Checking environment configuration..."

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    exit 1
fi

# Check Google Client ID
if grep -q "your_google_web_client_id_here" .env; then
    echo -e "${YELLOW}⚠ GOOGLE_CLIENT_ID not configured${NC}"
    echo "  Update GOOGLE_CLIENT_ID in .env file"
    GOOGLE_CONFIGURED=false
else
    echo -e "${GREEN}✓ GOOGLE_CLIENT_ID configured${NC}"
    GOOGLE_CONFIGURED=true
fi

# Check Apple Client ID
if grep -q "your_apple_service_id_here" .env; then
    echo -e "${YELLOW}⚠ APPLE_CLIENT_ID not configured${NC}"
    echo "  Update APPLE_CLIENT_ID in .env file"
    APPLE_CONFIGURED=false
else
    echo -e "${GREEN}✓ APPLE_CLIENT_ID configured${NC}"
    APPLE_CONFIGURED=true
fi

echo ""
echo "3. Checking implementation files..."

# Check if services exist
if [ -f "src/modules/auth/services/google-auth.service.ts" ]; then
    echo -e "${GREEN}✓ GoogleAuthService exists${NC}"
else
    echo -e "${RED}✗ GoogleAuthService not found${NC}"
fi

if [ -f "src/modules/auth/services/apple-auth.service.ts" ]; then
    echo -e "${GREEN}✓ AppleAuthService exists${NC}"
else
    echo -e "${RED}✗ AppleAuthService not found${NC}"
fi

echo ""
echo "4. Checking dependencies..."

# Check if google-auth-library is installed
if npm list google-auth-library > /dev/null 2>&1; then
    echo -e "${GREEN}✓ google-auth-library installed${NC}"
else
    echo -e "${RED}✗ google-auth-library not installed${NC}"
    echo "  Run: npm install google-auth-library"
fi

# Check if apple-signin-auth is installed
if npm list apple-signin-auth > /dev/null 2>&1; then
    echo -e "${GREEN}✓ apple-signin-auth installed${NC}"
else
    echo -e "${RED}✗ apple-signin-auth not installed${NC}"
    echo "  Run: npm install apple-signin-auth"
fi

echo ""
echo "========================================="
echo "Test Results Summary"
echo "========================================="

if [ "$GOOGLE_CONFIGURED" = true ] && [ "$APPLE_CONFIGURED" = true ]; then
    echo -e "${GREEN}✓ Configuration complete${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test from your Flutter app"
    echo "2. Monitor backend logs for verification attempts"
    echo "3. Check for 'Successfully verified' messages"
else
    echo -e "${YELLOW}⚠ Configuration incomplete${NC}"
    echo ""
    echo "Required actions:"
    if [ "$GOOGLE_CONFIGURED" = false ]; then
        echo "- Configure GOOGLE_CLIENT_ID in .env"
        echo "  Get from: https://console.cloud.google.com/apis/credentials"
    fi
    if [ "$APPLE_CONFIGURED" = false ]; then
        echo "- Configure APPLE_CLIENT_ID in .env"
        echo "  Get from: https://developer.apple.com/account/resources/identifiers"
    fi
fi

echo ""
echo "========================================="
echo "Manual Testing Guide"
echo "========================================="
echo ""
echo "To test with a REAL token from your Flutter app:"
echo ""
echo "1. Run your Flutter app and perform social login"
echo "2. Copy the idToken from the console/debug output"
echo "3. Test with curl:"
echo ""
echo "curl -X POST http://localhost:3000/api/v1/auth/social-login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"provider\": \"google\","
echo "    \"idToken\": \"YOUR_REAL_TOKEN_HERE\""
echo "  }'"
echo ""
echo "Expected success response:"
echo "{"
echo "  \"access_token\": \"eyJhbGc...\","
echo "  \"refresh_token\": \"eyJhbGc...\","
echo "  \"user\": { \"id\": \"...\", \"email\": \"...\", ... }"
echo "}"
echo ""
echo "Expected failure with fake token:"
echo "{"
echo "  \"statusCode\": 401,"
echo "  \"message\": \"Invalid Google ID token\""
echo "}"
echo ""
echo "========================================="
echo "Documentation Files"
echo "========================================="
echo ""
echo "Read these for more information:"
echo "- SOCIAL_LOGIN_IMPLEMENTATION.md    (Technical details)"
echo "- SOCIAL_LOGIN_SECURITY_FIX.md      (Security improvements)"
echo "- FLUTTER_INTEGRATION_GUIDE.md      (Flutter setup)"
echo ""
