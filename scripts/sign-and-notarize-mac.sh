#!/bin/bash
# Sign + notarize FocusLine.app for distribution.
#
# Removes the "Apple could not verify this app" warning permanently.
# Run this once you have the Apple Developer Program ($99/yr from
# https://developer.apple.com/programs/).
#
# Required env vars (export these before running):
#   APPLE_ID                — your Apple ID email
#   APPLE_TEAM_ID           — your 10-char team ID from Apple Developer
#   APPLE_APP_PASSWORD      — app-specific password from appleid.apple.com
#                             (NOT your Apple ID password — generate at
#                              appleid.apple.com → Sign-In and Security →
#                              App-Specific Passwords)
#   DEVELOPER_ID_IDENTITY   — your Developer ID Application cert name, e.g.
#                             "Developer ID Application: Nathan Otto (ABCD123456)"
#                             find with: security find-identity -v -p codesigning
#
# Usage:
#   chmod +x scripts/sign-and-notarize-mac.sh
#   ./scripts/sign-and-notarize-mac.sh

set -euo pipefail

# Pre-flight checks
: "${APPLE_ID:?APPLE_ID is not set}"
: "${APPLE_TEAM_ID:?APPLE_TEAM_ID is not set}"
: "${APPLE_APP_PASSWORD:?APPLE_APP_PASSWORD is not set}"
: "${DEVELOPER_ID_IDENTITY:?DEVELOPER_ID_IDENTITY is not set}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$PROJECT_ROOT/web/public/FocusLine.app"
DMG="$PROJECT_ROOT/web/public/FocusLine-1.0.0-mac.dmg"

echo "▸ Re-signing app with Developer ID identity"
codesign --force --options runtime --timestamp \
  --sign "$DEVELOPER_ID_IDENTITY" \
  --deep \
  "$APP"

echo "▸ Building fresh DMG"
DMG_TMP=$(mktemp -d)
cp -R "$APP" "$DMG_TMP/"
ln -s /Applications "$DMG_TMP/Applications"
rm -f "$DMG"
hdiutil create \
  -volname "FocusLine 1.0" \
  -srcfolder "$DMG_TMP" \
  -ov \
  -format UDZO \
  -fs HFS+ \
  "$DMG"
rm -rf "$DMG_TMP"

echo "▸ Signing the DMG (notarytool needs a signed dmg)"
codesign --force --sign "$DEVELOPER_ID_IDENTITY" "$DMG"

echo "▸ Submitting to Apple notary service (this takes 2–15 minutes)"
xcrun notarytool submit "$DMG" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --wait

echo "▸ Stapling the ticket so it works offline"
xcrun stapler staple "$DMG"

echo "▸ Verifying"
spctl --assess --type install --verbose=2 "$DMG"

echo ""
echo "✅ Done. $DMG is signed, notarized, and stapled."
echo "   Users will download it and double-click — no warnings."
