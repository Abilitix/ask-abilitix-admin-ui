#!/bin/bash
echo "Testing Runtime API CORS configuration..."
echo ""
echo "1. Testing OPTIONS preflight request:"
curl -X OPTIONS https://ask-abilitix-runtime.onrender.com/ask \
  -H "Origin: https://app.abilitix.com.au" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,x-tenant-slug,X-Widget-Key" \
  -v 2>&1 | grep -i "access-control"

echo ""
echo "2. Testing POST request CORS headers:"
curl -X POST https://ask-abilitix-runtime.onrender.com/ask \
  -H "Origin: https://app.abilitix.com.au" \
  -H "Content-Type: application/json" \
  -H "x-tenant-slug: abilitix-pilot" \
  -H "X-Widget-Key: wid_test" \
  -d '{"question":"test","session_id":"test-123"}' \
  -v 2>&1 | grep -i "access-control"


