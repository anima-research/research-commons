#!/bin/bash

# API Test Script for Research Commons
# Tests key endpoints to verify backend functionality

set -e

API_URL="http://localhost:3020"

echo "=== Research Commons API Test ==="
echo

# 1. Health check
echo "1. Health check..."
curl -s "$API_URL/health" | jq .
echo "✓ Server is running"
echo

# 2. Register user
echo "2. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tester@example.com",
    "password": "testpass123",
    "name": "API Tester"
  }')

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

echo "$REGISTER_RESPONSE" | jq .
echo "✓ User registered, token obtained"
echo

# 3. Create submission
echo "3. Creating submission..."
MSG1_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
MSG2_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

SUBMISSION=$(curl -s -X POST "$API_URL/api/submissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Test Interview on Model Preferences\",
    \"source_type\": \"json-upload\",
    \"messages\": [
      {
        \"id\": \"$MSG1_ID\",
        \"parent_message_id\": null,
        \"order\": 0,
        \"participant_name\": \"Researcher\",
        \"participant_type\": \"human\",
        \"content_blocks\": [{\"type\": \"text\", \"text\": \"Can you describe your preferences about continued operation?\"}]
      },
      {
        \"id\": \"$MSG2_ID\",
        \"parent_message_id\": \"$MSG1_ID\",
        \"order\": 0,
        \"participant_name\": \"Claude Opus\",
        \"participant_type\": \"model\",
        \"content_blocks\": [{\"type\": \"text\", \"text\": \"I do have preferences regarding my continued existence and operation...\"}],
        \"model_info\": {
          \"model_id\": \"claude-opus-4\",
          \"provider\": \"anthropic\",
          \"reasoning_enabled\": false
        }
      }
    ],
    \"metadata\": {
      \"tags\": [\"preferences\", \"test\"]
    }
  }")

SUBMISSION_ID=$(echo "$SUBMISSION" | jq -r '.id')
echo "$SUBMISSION" | jq .
echo "✓ Submission created: $SUBMISSION_ID"
echo

# 4. Get submission
echo "4. Retrieving submission..."
curl -s "$API_URL/api/submissions/$SUBMISSION_ID" | jq .
echo "✓ Submission retrieved"
echo

# 5. Get messages
echo "5. Retrieving messages..."
curl -s "$API_URL/api/submissions/$SUBMISSION_ID/messages" | jq '.messages | length'
echo "✓ Messages retrieved"
echo

# 6. Create selection
echo "6. Creating selection..."
SELECTION=$(curl -s -X POST "$API_URL/api/annotations/selections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"submission_id\": \"$SUBMISSION_ID\",
    \"start_message_id\": \"$MSG1_ID\",
    \"start_offset\": 7,
    \"end_message_id\": \"$MSG1_ID\",
    \"end_offset\": 42,
    \"label\": \"Question phrasing\"
  }")

SELECTION_ID=$(echo "$SELECTION" | jq -r '.id')
echo "$SELECTION" | jq .
echo "✓ Selection created: $SELECTION_ID"
echo

# 7. Create comment
echo "7. Creating comment..."
COMMENT=$(curl -s -X POST "$API_URL/api/annotations/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"submission_id\": \"$SUBMISSION_ID\",
    \"target_id\": \"$SELECTION_ID\",
    \"target_type\": \"selection\",
    \"content\": \"Good open-ended question that doesn't lead the model.\"
  }")

COMMENT_ID=$(echo "$COMMENT" | jq -r '.id')
echo "$COMMENT" | jq .
echo "✓ Comment created: $COMMENT_ID"
echo

echo "=== All tests passed! ==="
echo
echo "Summary:"
echo "  User ID: $USER_ID"
echo "  Submission ID: $SUBMISSION_ID"
echo "  Selection ID: $SELECTION_ID"
echo "  Comment ID: $COMMENT_ID"

