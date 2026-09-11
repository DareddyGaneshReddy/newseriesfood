# Fix the Median Google sign-in handoff

## Cause
The bridge currently tries an Android `intent://` URL first and explicitly names the app package. When Android cannot match that intent exactly, Chrome routes it to Google Play, producing “Item not found.” It then tries two additional, incompatible scheme formats, which can leave the authenticated session in the browser instead of reopening Median.

## Changes
- Remove the Android intent URL and all alternate scheme attempts.
- Use only Median’s configured callback format: `nsfoodxljdzzw.https://newseriesfood.lovable.app/auth/callback?...`.
- Preserve only the approved authentication response values and forward them unchanged to the APK.
- Keep a single manual “Return to app” action if Android blocks automatic opening.
- Leave website Google login and email/password login unchanged.

## Verification
- Confirm no Play Store/package intent remains in the authentication path.
- Confirm the bridge generates exactly one Median callback URL.
- Test successful, cancelled, and invalid return states locally.
- Confirm the app builds cleanly, then publish so the APK receives the corrected bridge page.

## Median requirement
The installed APK must register `nsfoodxljdzzw` as its custom URL scheme. If Median has not embedded that scheme into the APK, no website code can force Android to reopen it; the APK must be rebuilt after that setting is saved.
