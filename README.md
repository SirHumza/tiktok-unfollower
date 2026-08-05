# TikTok Unfollower

Unfollow everyone on TikTok who doesn't follow you back. A single JavaScript snippet you paste into your browser console — no installs, no passwords, no third-party access to your account.

Inspired by [David Arroyo's Instagram Unfollower](https://github.com/arobertnlands/unfollowNInsta).

## How it works

You run this script **in your own browser**, on your own session. It:

1. Opens your **Following** list and scrolls to load everyone.
2. Opens your **Followers** list and scrolls to load everyone.
3. Compares the two sets.
4. Unfollows everyone in "Following" who is **not** in "Followers".

Mutuals (people who follow you back) are never touched.

## Usage

1. Open [tiktok.com](https://www.tiktok.com) in Chrome, Edge, or Firefox and **log in**.
2. Go to **your own profile**.
3. Open DevTools:
   - **Windows/Linux:** `F12` or `Ctrl+Shift+I`
   - **Mac:** `Cmd+Option+I`
4. Click the **Console** tab.
5. Paste the contents of [`tiktok-unfollower.js`](tiktok-unfollower.js) and press Enter.
6. Keep the tab **open and visible** until it finishes.

## What to expect

- The script adds random delays between unfollows to mimic human behavior — this avoids TikTok's rate limiting.
- It prints progress to the console: how many it found, how many it will unfollow, and each one as it goes.
- If TikTok blocks you mid-run (CAPTCHA or "try again later"), wait an hour and run it again. It will skip anyone already unfollowed since they're no longer in your Following list.

## Is this safe?

- **No passwords.** You're already logged in. The script never sees your credentials.
- **No API keys.** It just drives the same UI you'd click by hand.
- **Open source.** Read the code before you run it.
- **Rate-limited.** Built-in random pauses reduce the chance of getting flagged.

That said: *any* mass-unfollow action carries some risk of temporary rate-limiting or a CAPTCHA. Use at your own discretion.

## License

MIT
