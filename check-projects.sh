#!/bin/bash

echo "🔍 Checking for missing project.json files..."
echo "============================================"

for dir in projects/*/; do
    if [ -d "$dir" ]; then
        project_name=$(basename "$dir")
        if [ ! -f "${dir}project.json" ]; then
            echo "❌ Missing project.json: $project_name"
            echo "   Directory contents:"
            ls -la "$dir" | head -5
            echo ""
        else
            echo "✅ Has project.json: $project_name"
        fi
    fi
done

echo ""
echo "📊 Summary:"
echo "Total project directories: $(find projects -maxdepth 1 -type d | wc -l | xargs expr -1 +)"
echo "With project.json: $(find projects -name 'project.json' | wc -l)"
echo "Missing project.json: $(expr $(find projects -maxdepth 1 -type d | wc -l | xargs expr -1 +) - $(find projects -name 'project.json' | wc -l))"
