#!/bin/bash

# FCM Integration Test Script
# This script tests the complete FCM integration flow

set -e

echo "🔔 Firebase Cloud Messaging Integration Test"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
JWT_TOKEN=""
FCM_TOKEN=""

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test 1: Check if backend is running
echo "Test 1: Checking backend health..."
if curl -s "$API_URL/health" > /dev/null; then
    print_success "Backend is running"
else
    print_error "Backend is not running. Start it with: cd apps/backend && npm run dev"
    exit 1
fi

# Test 2: Register/Login user
echo ""
echo "Test 2: User authentication..."
print_info "Enter phone number (e.g., +923343717260):"
read PHONE_NUMBER

# Try to register
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE_NUMBER\", \"fullName\": \"Test User\", \"email\": \"test@example.com\"}")

# If registration fails, try login
if echo "$REGISTER_RESPONSE" | grep -q "USER_EXISTS"; then
    print_info "User exists, logging in..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"phoneNumber\": \"$PHONE_NUMBER\"}")
    JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    JWT_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$JWT_TOKEN" ]; then
    print_error "Failed to get JWT token"
    exit 1
fi

print_success "Authenticated successfully"
print_info "JWT Token: ${JWT_TOKEN:0:20}..."

# Test 3: Get FCM token from user
echo ""
echo "Test 3: FCM Token..."
print_info "Open your browser at http://localhost:3000"
print_info "Allow notifications when prompted"
print_info "Copy the FCM token from the browser console"
print_info "Paste the FCM token here:"
read FCM_TOKEN

if [ -z "$FCM_TOKEN" ]; then
    print_error "FCM token is required"
    exit 1
fi

print_success "FCM token received"

# Test 4: Save FCM token
echo ""
echo "Test 4: Saving FCM token to database..."
SAVE_RESPONSE=$(curl -s -X POST "$API_URL/api/fcm/save-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{\"token\": \"$FCM_TOKEN\", \"deviceType\": \"web\"}")

if echo "$SAVE_RESPONSE" | grep -q "success.*true"; then
    print_success "FCM token saved successfully"
else
    print_error "Failed to save FCM token"
    echo "$SAVE_RESPONSE"
    exit 1
fi

# Test 5: Send test notification
echo ""
echo "Test 5: Sending test notification..."
print_info "Check your browser for the notification!"

TEST_RESPONSE=$(curl -s -X POST "$API_URL/api/fcm/send-test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"title": "Test Alert", "body": "This is a test notification from SilentSiren!"}')

if echo "$TEST_RESPONSE" | grep -q "success.*true"; then
    SUCCESS_COUNT=$(echo "$TEST_RESPONSE" | grep -o '"successCount":[0-9]*' | cut -d':' -f2)
    print_success "Test notification sent (Success: $SUCCESS_COUNT)"
else
    print_error "Failed to send test notification"
    echo "$TEST_RESPONSE"
    exit 1
fi

# Test 6: Trigger emergency with notification
echo ""
echo "Test 6: Triggering emergency alert..."
print_info "This will create an emergency and send notifications to nearby users"

EMERGENCY_RESPONSE=$(curl -s -X POST "$API_URL/api/emergency/trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "HIGH",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "address": "Lahore, Pakistan"
  }')

if echo "$EMERGENCY_RESPONSE" | grep -q "success.*true"; then
    EVENT_ID=$(echo "$EMERGENCY_RESPONSE" | grep -o '"eventId":"[^"]*' | cut -d'"' -f4)
    print_success "Emergency event created (ID: $EVENT_ID)"
else
    print_error "Failed to create emergency event"
    echo "$EMERGENCY_RESPONSE"
    exit 1
fi

# Test 7: List user tokens
echo ""
echo "Test 7: Listing user's device tokens..."
TOKENS_RESPONSE=$(curl -s -X GET "$API_URL/api/fcm/tokens" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$TOKENS_RESPONSE" | grep -q "success.*true"; then
    TOKEN_COUNT=$(echo "$TOKENS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    print_success "Found $TOKEN_COUNT device token(s)"
else
    print_error "Failed to list tokens"
    echo "$TOKENS_RESPONSE"
fi

# Summary
echo ""
echo "============================================"
echo "🎉 All tests completed successfully!"
echo "============================================"
echo ""
print_success "FCM Integration is working correctly!"
echo ""
echo "Next steps:"
echo "  1. Check your browser for notifications"
echo "  2. Test on mobile devices"
echo "  3. Configure notification preferences"
echo "  4. Deploy to production"
echo ""
