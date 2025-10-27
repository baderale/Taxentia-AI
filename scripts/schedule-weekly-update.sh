#!/bin/bash

# Weekly Authority Update Script for Taxentia-AI
# Run this with crontab on Linux/Mac every Sunday at 2 AM
#
# Setup crontab:
#   crontab -e
#   Add line: 0 2 * * 0 /path/to/Taxentia-AI/scripts/schedule-weekly-update.sh
#

echo "========================================"
echo "Taxentia-AI Weekly Authority Update"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Change to project directory
cd "$(dirname "$0")/.." || exit 1

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Update recent IRS bulletins (last 5)
echo ""
echo "Updating IRS Bulletins..."
echo ""
npm run ingest:authorities -- irb 5

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: IRS Bulletin update failed!"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "Weekly update completed: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Optional: Update USC and CFR monthly (uncomment on first Sunday of month)
# if [ $(date +%d) -le 07 ]; then
#     echo ""
#     echo "Updating US Code Title 26..."
#     npm run ingest:authorities usc
#
#     if [ $? -ne 0 ]; then
#         echo "ERROR: USC update failed!"
#         exit 1
#     fi
#
#     echo ""
#     echo "Updating CFR Title 26..."
#     npm run ingest:authorities cfr
#
#     if [ $? -ne 0 ]; then
#         echo "ERROR: CFR update failed!"
#         exit 1
#     fi
# fi

exit 0
