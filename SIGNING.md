# Removing OS "developer cannot be verified" warnings

Honest answer up front: **there is no code-level workaround for any of the three OS warnings.** Each OS enforces its check at the system level, before your app ever runs. The only way to make the warnings disappear is to pay the platform vendor for a code-signing identity and submit your build to their server-side check.

This doc walks you through the cost, time, and exact commands for each OS.

| OS | What removes the warning | Cost | First-time setup | Per-release time |
|---|---|---|---|---|
| **macOS** | Apple Developer Program signing + notarization | **$99 / yr** (Apple) | 30 min | 5 min (mostly waiting) |
| **Windows** | Authenticode code-signing certificate | **$100–400 / yr** (DigiCert, Sectigo, SSL.com) | 1–3 days to issue cert | 2 min |
| **Linux** | Nothing — Linux has no equivalent warning | Free | — | — |

If you want to launch without paying right now, jump to [§ Soft launch without signing](#soft-launch-without-signing) at the bottom.

---

## macOS — full notarization (recommended)

### One-time setup (~30 min)

1. **Sign up at <https://developer.apple.com/programs/>** with your Apple ID. $99/yr.
2. Wait for activation email (usually 24 hrs — sometimes minutes).
3. Once active: open **Xcode → Settings → Accounts** → add your Apple ID → click **Manage Certificates** → click **+** → choose **Developer ID Application**. This installs your signing cert into the Keychain.
4. Generate an **app-specific password** (one-time):
   - Go to <https://appleid.apple.com>
   - Sign in → **Sign-In and Security → App-Specific Passwords**
   - Generate one named "FocusLine notarization"
   - Save it somewhere safe (Apple won't show it again)
5. Find your **Team ID**:
   - <https://developer.apple.com/account> → look for "Team ID" (a 10-char string like `ABCD123456`)
6. Find your **signing identity** name:
   ```bash
   security find-identity -v -p codesigning
   ```
   You'll see something like `"Developer ID Application: Your Name (ABCD123456)"`.

### Notarize a release (every time you build a new .dmg)

```bash
# Export credentials in your shell (or put them in ~/.zprofile)
export APPLE_ID="you@example.com"
export APPLE_TEAM_ID="ABCD123456"
export APPLE_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export DEVELOPER_ID_IDENTITY="Developer ID Application: Your Name (ABCD123456)"

# Run the notarization script — handles sign, dmg, submit, staple
./scripts/sign-and-notarize-mac.sh
```

The script (see [`scripts/sign-and-notarize-mac.sh`](scripts/sign-and-notarize-mac.sh)) does:
1. Re-signs `FocusLine.app` with the Developer ID cert + hardened runtime
2. Re-packages it as a DMG
3. Code-signs the DMG itself
4. Uploads to Apple's notary service, waits for the ticket (~2–15 min)
5. Staples the ticket so the app works offline after first install
6. Verifies with `spctl`

After this, users download the .dmg, double-click → **no warning at all**. macOS recognizes it as a notarized app from a registered developer.

---

## Windows — Authenticode signing

This applies to the `.msi` / `.exe` produced by GitHub Actions (`focusline-1.0.0-windows.exe`).

### Get a certificate

You need an **OV** (Organization Validated) or **EV** (Extended Validation) certificate. EV is preferred because it bypasses SmartScreen reputation buildup, but it's pricier.

- **Sectigo OV**: ~$199/yr, 1–2 day validation
- **Sectigo EV**: ~$329/yr, ~3 day validation, requires a YubiKey/HSM
- **SSL.com EV** *(recommended for indie devs)*: ~$229/yr cloud-signed, no hardware
- **DigiCert EV**: ~$474/yr, hardware-only

Buy from any reseller. They'll verify your identity (passport / business docs) and issue the cert.

### Sign on Windows (Windows-only command)

```cmd
signtool sign /fd SHA256 /t http://timestamp.digicert.com ^
  /n "Your Common Name" ^
  /d "FocusLine" /du "https://focusline.app" ^
  FocusLine-1.0.0-windows.exe
```

Or sign via GitHub Actions secret + the [Signing as a Service](https://signpath.io/) free tier (open-source projects only — FocusLine qualifies because of MIT license).

After signing, SmartScreen reputation builds with downloads. EV cert = zero warning even on day one. OV cert = warning for the first ~3000 downloads, then clean.

---

## Linux

No signing required. The `.deb` and `.AppImage` files install cleanly with no system warnings. Done.

---

## Soft launch without signing

If you want to ship tomorrow without paying anyone, here's how to make the warnings less scary:

### macOS — guide users through right-click → Open

Add this to your download page as a small expandable note under the macOS download button:

> **First launch may show "FocusLine cannot be opened" warning.**
> This is macOS Gatekeeper. To open the app:
> 1. **Right-click** (or Control-click) the FocusLine app in your Applications folder
> 2. Choose **Open** from the menu
> 3. Click **Open** in the dialog
>
> After this once, FocusLine opens normally every time. *(macOS shows this for any app not signed by a $99/yr Apple Developer Program member. We're working on getting signed for v1.0.1.)*

### Windows — guide users through SmartScreen

> **SmartScreen may warn "Windows protected your PC".**
> 1. Click **More info**
> 2. Click **Run anyway**
>
> *(Microsoft requires a $200/yr code-signing certificate to skip this on the first download. We'll have one for v1.0.1.)*

### Linux

Nothing to explain. Users install and run.

---

## Recommended sequence

**Day 0 (today)**: ship unsigned. Add the warning explainers above. Soft-launch to your network.

**Day 1 (tomorrow)**: sign up for Apple Developer Program. Cert provisions within hours.

**Day 2–3**: run `./scripts/sign-and-notarize-mac.sh`, push v1.0.1 with the signed .dmg. Warning gone for Mac.

**Week 1**: order Windows EV cert. Wait 3 days for validation.

**Week 2**: ship v1.0.2 with signed Windows .exe. Warning gone for Windows.

That's a normal pace. Even big-name apps have shipped unsigned betas. Nothing to be embarrassed about.
