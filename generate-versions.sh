#!/bin/bash

echo "📄 PDF Portfolio Generator - Multiple DPI Versions"
echo "================================================="

# Generate print version (300 DPI)
echo "🖨️  Generating PRINT version (300 DPI)..."
npm start -- --input ./projects --output grayson-earle-portfolio-print.pdf

# Create web-friendly config temporarily
cp projects/config.json projects/config-backup.json
sed 's/"dpi": 300/"dpi": 150/' projects/config.json > projects/config-web.json
mv projects/config-web.json projects/config.json

echo "🌐 Generating WEB version (150 DPI)..."
npm start -- --input ./projects --output grayson-earle-portfolio-web.pdf

# Restore original config
mv projects/config-backup.json projects/config.json

echo ""
echo "✅ Generated both versions:"
echo "   📄 grayson-earle-portfolio-print.pdf (300 DPI - for printing)"
echo "   🌐 grayson-earle-portfolio-web.pdf (150 DPI - for web/email)"
echo ""
echo "File sizes:"
ls -lh grayson-earle-portfolio-*.pdf | awk '{print "   " $9 ": " $5}'
