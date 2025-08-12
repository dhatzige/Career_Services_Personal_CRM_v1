#!/bin/bash

echo "🧪 Starting Comprehensive E2E Tests for Career Services CRM"
echo "=========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directories for test results
mkdir -p playwright/screenshots
mkdir -p playwright/test-results
mkdir -p playwright/reports

# Check if servers are running
echo "📡 Checking if servers are running..."
if ! curl -s http://localhost:4001/health > /dev/null; then
    echo -e "${RED}❌ Backend is not running! Please start it first.${NC}"
    echo "Run: cd backend && npm start"
    exit 1
fi

if ! curl -s http://localhost:5173 > /dev/null; then
    echo -e "${RED}❌ Frontend is not running! Please start it first.${NC}"
    echo "Run: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Both servers are running${NC}"
echo ""

# Run tests with different reporters
echo "🏃 Running E2E tests..."
echo ""

# Run comprehensive tests
npx playwright test playwright/tests/e2e-comprehensive.spec.ts \
    --reporter=list \
    --reporter=html:playwright/reports/html \
    --reporter=json:playwright/reports/results.json \
    --workers=1 \
    --timeout=60000

TEST_EXIT_CODE=$?

# Generate test summary
echo ""
echo "📊 Test Summary"
echo "==============="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

# Show test report location
echo ""
echo "📄 Test Reports:"
echo "  - HTML Report: playwright/reports/html/index.html"
echo "  - JSON Report: playwright/reports/results.json"
echo "  - Screenshots: playwright/screenshots/"
echo ""
echo "To view HTML report, run: npx playwright show-report playwright/reports/html"

# Create a summary markdown file
cat > playwright/reports/test-summary.md << EOF
# E2E Test Results - $(date)

## Test Execution Summary

- **Total Tests Run**: See detailed report
- **Exit Code**: $TEST_EXIT_CODE
- **Duration**: See detailed report

## Reports Generated

1. **HTML Report**: \`playwright/reports/html/index.html\`
2. **JSON Report**: \`playwright/reports/results.json\`
3. **Screenshots**: \`playwright/screenshots/\`

## Next Steps

$(if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed! The application is ready for deployment."
else
    echo "❌ Some tests failed. Please review the test results and fix any issues before deployment."
fi)

## View Detailed Report

Run: \`npx playwright show-report playwright/reports/html\`
EOF

echo "📝 Test summary saved to: playwright/reports/test-summary.md"

exit $TEST_EXIT_CODE