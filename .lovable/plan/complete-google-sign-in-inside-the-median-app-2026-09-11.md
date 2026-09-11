# Complete Google sign-in inside the Median app

## Goal
After Google approves the account, return the authentication result to the original Median WebView so the app can create and persist the user session.

## Changes
- Keep direct Supabase Google authentication and the existing email/password flow.
- Send Median Google sign-ins back to the public `/auth/bridge` page; normal website sign-ins continue returning to `/auth/callback`.
- Add a lightweight bridge page that forwards Supabase’s returned query/hash authentication values through `nsfoodxljdzzw` to the app’s `/auth/callback` page.
- Preserve cancellation and provider errors and offer a visible “Return to app” action if Android blocks automatic opening.
- Let the existing callback exchange or restore the Supabase session, then navigate to the saved destination.

## Verification
- Confirm no Lovable OAuth package or broker calls are reintroduced.
- Confirm the website and Median paths use the expected redirect URLs.
- Check type safety, build status, and the rendered bridge/callback pages.

## Required Median behavior
The existing `nsfoodxljdzzw` URL scheme must remain enabled. No Median setting will be modified from Lovable.
