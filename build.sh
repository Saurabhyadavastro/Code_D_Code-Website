#!/bin/bash
# Build script for Render deployment

echo "🚀 Starting Code_d_Code Backend Build Process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "Directory contents:"
    ls -la
    exit 1
fi

echo "✅ Project structure verified"
echo "📁 Current directory: $(pwd)"
echo "📦 Installing backend dependencies..."

# Navigate to backend and install dependencies
cd backend || {
    echo "❌ Failed to navigate to backend directory"
    exit 1
}

echo "📍 Now in: $(pwd)"
echo "📋 Backend package.json found: $(ls -la package.json)"

# Install dependencies
npm ci || {
    echo "❌ npm ci failed, trying npm install"
    npm install || {
        echo "❌ npm install also failed"
        exit 1
    }
}

echo "✅ Backend dependencies installed successfully"
echo "🎉 Build process completed!"
