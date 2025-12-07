#!/bin/bash

# Laravel + Next.js Integration Test Script
# This script helps verify your Laravel backend is properly configured

echo "🚀 Testing Laravel Backend Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"

# Test 1: Check if Laravel is running
echo "📡 Test 1: Checking if Laravel backend is running..."
if curl -s "${API_URL}/api/public-faculties" > /dev/null; then
    echo -e "${GREEN}✅ Laravel backend is running${NC}"
else
    echo -e "${RED}❌ Laravel backend is NOT running${NC}"
    echo "   Please start it with: php artisan serve"
    exit 1
fi
echo ""

# Test 2: Check CORS configuration
echo "🔒 Test 2: Checking CORS configuration..."
CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "${API_URL}/api/login" -i)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS is properly configured${NC}"
else
    echo -e "${RED}❌ CORS headers not found${NC}"
    echo "   Check your config/cors.php file"
fi
echo ""

# Test 3: Test public endpoints
echo "📂 Test 3: Testing public endpoints..."

echo -n "  - /api/public-faculties: "
if curl -s "${API_URL}/api/public-faculties" | grep -q "\["; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "  - /api/public-departments: "
if curl -s "${API_URL}/api/public-departments" | grep -q "\["; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "  - /api/public-curricula: "
if curl -s "${API_URL}/api/public-curricula" | grep -q "\["; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi
echo ""

# Test 4: Test CSRF endpoint
echo "🔐 Test 4: Testing Sanctum CSRF cookie endpoint..."
if curl -s "${API_URL}/sanctum/csrf-cookie" -c /tmp/cookies.txt > /dev/null; then
    echo -e "${GREEN}✅ CSRF endpoint is working${NC}"
else
    echo -e "${RED}❌ CSRF endpoint failed${NC}"
fi
echo ""

# Test 5: Test authentication (optional - needs credentials)
echo "🔑 Test 5: Testing authentication..."
echo -e "${YELLOW}⚠️  Skipping - requires valid credentials${NC}"
echo "   To test manually, visit: http://localhost:3000/login-laravel"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Integration Status Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Laravel Backend: ${API_URL}"
echo "Next.js Frontend: http://localhost:3000"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit http://localhost:3000/test-api to test public endpoints"
echo "2. Visit http://localhost:3000/login-laravel to test authentication"
echo "3. Check INTEGRATION_TESTING_GUIDE.md for detailed testing"
echo ""
echo "📚 Documentation:"
echo "- Full guide: docs/LARAVEL_NEXTJS_INTEGRATION.md"
echo "- Quick ref: LARAVEL_INTEGRATION_QUICK_REFERENCE.md"
echo "- Test guide: INTEGRATION_TESTING_GUIDE.md"
echo ""
