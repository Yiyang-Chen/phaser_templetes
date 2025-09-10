#!/bin/bash

# Test script to verify TARGET_REPO_TOKEN configuration
# This script simulates what the GitHub Action does

echo "Testing TARGET_REPO_TOKEN configuration..."

# Check if TARGET_REPO_TOKEN is set
if [ -z "$TARGET_REPO_TOKEN" ]; then
    echo "❌ TARGET_REPO_TOKEN is not set"
    echo "Please set it with: export TARGET_REPO_TOKEN=your_token_here"
    exit 1
fi

echo "✅ TARGET_REPO_TOKEN is set"

# Test access to target repositories
echo "Testing access to target repositories..."

# Test 2Dplatformer-template
echo "Testing 2Dplatformer-template..."
if curl -s -H "Authorization: token $TARGET_REPO_TOKEN" \
   "https://api.github.com/repos/Yiyang-Chen/2Dplatformer-template" | grep -q "full_name"; then
    echo "✅ 2Dplatformer-template repository is accessible"
else
    echo "❌ 2Dplatformer-template repository is not accessible or doesn't exist"
fi

# Test BaseTemplete-template
echo "Testing BaseTemplete-template..."
if curl -s -H "Authorization: token $TARGET_REPO_TOKEN" \
   "https://api.github.com/repos/Yiyang-Chen/BaseTemplete-template" | grep -q "full_name"; then
    echo "✅ BaseTemplete-template repository is accessible"
else
    echo "❌ BaseTemplete-template repository is not accessible or doesn't exist"
fi

echo "Test completed!"
