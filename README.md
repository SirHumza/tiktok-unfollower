# TikTok Unfollower

Unfollow everyone on TikTok who doesn't follow you back. A single JavaScript snippet you paste into your browser console — no installs, no passwords, no third-party access to your account.

Inspired by [David Arroyo's Instagram Unfollower](https://github.com/arobertnlands/unfollowNInsta).

## Two modes

| Mode | File | What it does |
|------|------|-------------|
| **Smart** (default) | `tiktok-unfollower.js` | Unfollows only non-mutuals — keeps people who follow you back |
| **Quick** | `tiktok-unfollower-quick.js` | Unfollows *everyone* in your following list, no mutual check |

## How it works

You run this script **in your own browser**, on your own session. It:

1. Opens your **Following** list and scrolls to load everyone.
2. Smart mode only: Opens your **Followers** list and scrolls to load everyone.
3. Compares the two sets.
4. Unfollows everyone in "Following" who is **not** in "Followers** (smart mode), or everyone (quick mode).

## Usage

1. Open [tiktok.com](https://www.tiktok.com) in Chrome, Edge, or Firefox and **log in**.
2. Go to **your own profile**.
3. Open DevTools:
   - **Windows/Linux:** `F12` or `Ctrl+Shift+I`
   - **Mac:** `Cmd+Option+I`
4. Click the **Console** tab.
5. Paste the contents of your chosen file and press Enter.
6. Keep the tab **open and visible** until it finishes.

## What to expect

- Smart mode has a safety cap of **200 unfollows per run** (edit `MAX_UNFOLLOW` in the script if you want more).
- Random delays between actions mimic human behavior — this avoids TikTok's rate limiting.
- It prints progress to the console so you can watch it work.
- If TikTok blocks you mid-run (CAPTCHA or "try again later"), wait an hour and run it again. It will skip anyone already unfollowed.

## Is this safe?

- **No passwords.** You're already logged in. The script never sees your credentials.
- **No API keys.** It just drives the same UI you'd click by hand.
- **Open source.** Read the code before you run it.
- **Rate-limited.** Built-in random pauses reduce the chance of getting flagged.

That said: *any* mass-unfollow action carries some risk of temporary rate-limiting or a CAPTCHA. Use at your own discretion.

## License

MIT
