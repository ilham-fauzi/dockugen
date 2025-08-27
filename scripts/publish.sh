#!/bin/bash

echo "🚀 Publishing DockuGen package..."

# Clean up
rm -rf node_modules
rm -rf api-docs
rm -rf test-output
rm -rf swagger-only

# Install dependencies
npm install

# Test the package
echo "🧪 Testing package..."
node bin/dockugen --out ./test-docs

# Check if test was successful
if [ $? -eq 0 ]; then
    echo "✅ Test successful! Ready to publish."
    
    # Ask for confirmation
    read -p "Do you want to publish to npm? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Publishing to npm..."
        npm publish
        
        if [ $? -eq 0 ]; then
            echo "🎉 Package published successfully!"
            echo "📦 Install with: npm install -g dockugen"
        else
            echo "❌ Failed to publish package"
            exit 1
        fi
    else
        echo "❌ Publishing cancelled"
    fi
else
    echo "❌ Test failed! Cannot publish."
    exit 1
fi
