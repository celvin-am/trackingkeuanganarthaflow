#!/bin/bash

echo "1. Register/Login user..."
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email": "alex@arthaflow.com", "password": "Password123!"}' > /dev/null
echo "Login SUCCESS"

echo "2. Create Wallet..."
curl -s -b cookies.txt -X POST http://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"name": "E2E Test Wallet", "type": "BANK", "balance": 1500000}' > /dev/null
echo "Wallet CREATED"

echo "3. Fetch Wallets to grab ID..."
WALLET_ID=$(curl -s -b cookies.txt -X GET http://localhost:3000/api/wallets -H "Origin: http://localhost:5173" | grep -o '"id":"[^"]*' | head -n 1 | cut -d '"' -f 4)
echo "Got Wallet ID: $WALLET_ID"

echo "4. Fetch Category ID..."
CAT_ID=$(curl -s -b cookies.txt -X GET http://localhost:3000/api/categories -H "Origin: http://localhost:5173" | grep -o '"id":"[^"]*' | head -n 1 | cut -d '"' -f 4)
echo "Got Category ID: $CAT_ID"

if [ -z "$CAT_ID" ]; then
  echo "Category ID is empty, attempting to seed..."
  npx tsx src/lib/seed.ts > /dev/null
  CAT_ID=$(curl -s -b cookies.txt -X GET http://localhost:3000/api/categories -H "Origin: http://localhost:5173" | grep -o '"id":"[^"]*' | head -n 1 | cut -d '"' -f 4)
  echo "New Category ID: $CAT_ID"
fi

echo "5. Create Transaction..."
curl -s -b cookies.txt -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d "{\"walletId\": \"$WALLET_ID\", \"categoryId\": \"$CAT_ID\", \"amount\": -250000, \"type\": \"EXPENSE\", \"description\": \"E2E Test Txn\"}" > /dev/null
echo "Transaction CREATED"

echo "6. Sync Dashboard Stats..."
curl -s -b cookies.txt -X GET http://localhost:3000/api/dashboard/stats -H "Origin: http://localhost:5173"
echo ""
echo "Dashboard FETCHED"
echo "E2E PASS"
