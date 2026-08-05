/*
 * TikTok Unfollower — Smart Mode (default)
 *
 * Unfollows everyone who doesn't follow you back. Mutuals are kept.
 *
 * HOW TO USE:
 *   1. Open tiktok.com in Chrome/Edge/Firefox and log in.
 *   2. Go to your own profile.
 *   3. Open DevTools (F12 / Cmd+Option+I) → Console tab.
 *   4. Paste this entire script and press Enter.
 *   5. Keep the tab open and visible until it finishes.
 *
 * SAFETY:
 *   - MAX_UNFOLLOW caps how many accounts it will unfollow per run (default 200).
 *   - Random delays between actions mimic human behavior.
 *   - If TikTok rate-limits you, wait an hour and run again.
 */

(async () => {
  const MAX_UNFOLLOW = 200; // safety cap — adjust if you want

  const log = (m) => console.log(`[TT-Smart] ${m}`);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pause = () => sleep(rand(1500, 3000));

  // ── DOM helpers ──────────────────────────────────────────────

  function findStatButton(label) {
    // TikTok profile stats: <a> or <strong> with title attr
    const byTitle = document.querySelector(`[title="${label}"]`);
    if (byTitle) return byTitle;

    // data-e2e attributes
    const e2eMap = { Following: "following-count", Followers: "followers-count" };
    if (e2eMap[label]) {
      const el = document.querySelector(`[data-e2e="${e2eMap[label]}"]`);
      if (el) return el;
    }

    // Brute force: find clickable element with exact text
    const all = document.querySelectorAll("span, strong, a, h2, div");
    for (const el of all) {
      if (el.textContent.trim() === label && el.offsetParent !== null) {
        // Make sure it's inside the stats area, not a random heading
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return el;
      }
    }
    return null;
  }

  function getScrollContainer() {
    // Find the scrollable div inside the modal that holds user rows
    for (const div of document.querySelectorAll("div")) {
      const s = getComputedStyle(div);
      if (
        (s.overflowY === "auto" || s.overflowY === "scroll") &&
        div.scrollHeight > div.clientHeight + 50 &&
        div.querySelector('a[href*="/@"]')
      ) {
        return div;
      }
    }
    // Fallback: the dialog itself
    return document.querySelector('[role="dialog"]');
  }

  async function scrollAllLoaded(label) {
    log(`Loading ${label} list...`);
    const container = getScrollContainer();
    let lastH = 0, same = 0;

    for (let i = 0; i < 300; i++) {
      if (container) container.scrollTop = container.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);

      await sleep(rand(800, 1400));
      const h = container ? container.scrollHeight : document.body.scrollHeight;

      if (h === lastH) {
        if (++same >= 8) break;
      } else {
        same = 0;
        lastH = h;
      }
    }
  }

  function extractUsernames() {
    const set = new Set();
    for (const a of document.querySelectorAll('a[href*="/@"]')) {
      const m = a.href.match(/\/@([^/?#]+)/);
      if (m) set.add(m[1]);
    }
    return set;
  }

  function closeModal() {
    // Try the X button
    const closeBtn =
      document.querySelector('[data-e2e="modal-close-inner-button"]') ||
      document.querySelector('button[aria-label="Close"]') ||
      document.querySelector('button[aria-label="close"]');
    if (closeBtn) { closeBtn.click(); return; }
    // Fallback: Escape key
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  // ── Unfollow logic inside the modal ──────────────────────────

  async function confirmUnfollow() {
    // TikTok sometimes shows a confirmation dialog
    await sleep(600);
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;
    const btn = [...dialog.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === "Unfollow"
    );
    if (btn) { btn.click(); await sleep(400); }
  }

  async function unfollowNonMutuals(toUnfollow) {
    log(`Going to unfollow ${Math.min(toUnfollow.length, MAX_UNFOLLOW)} non-mutuals.`);

    // Re-open the following list
    const followingBtn = findStatButton("Following");
    if (!followingBtn) throw new Error("Cannot find Following button.");
    followingBtn.click();
    await sleep(2000);
    await scrollAllLoaded("following");

    let done = 0;
    const remaining = new Set(toUnfollow);

    for (let attempt = 0; attempt < 1000 && done < MAX_UNFOLLOW; attempt++) {
      // Find all visible user rows
      const userLinks = [...document.querySelectorAll('a[href*="/@"]')];
      let actioned = false;

      for (const link of userLinks) {
        const m = link.href.match(/\/@([^/?#]+)/);
        if (!m || !remaining.has(m[1])) continue;

        // Walk up to find the row container, then the Unfollow button
        let row = link;
        for (let i = 0; i < 5; i++) {
          if (!row.parentElement) break;
          row = row.parentElement;
          const btn = [...row.querySelectorAll("button")].find(
            (b) => b.textContent.trim() === "Unfollow" && b.offsetParent !== null
          );
          if (btn) {
            log(`[${done + 1}] Unfollowing @${m[1]}`);
            btn.click();
            await pause();
            await confirmUnfollow();
            done++;
            remaining.delete(m[1]);
            actioned = true;
            break;
          }
        }
        if (actioned) break; // DOM changed, re-scan
      }

      if (!actioned) {
        // Scroll down to find more rows
        const container = getScrollContainer();
        if (container) container.scrollTop = container.scrollHeight;
        await sleep(rand(1000, 1600));

        // If we've scrolled a lot and found nothing new, we're done
        if (attempt > toUnfollow.length + 30) {
          log("No more unfollow buttons visible. Stopping.");
          break;
        }
      }
    }

    return done;
  }

  // ── MAIN ─────────────────────────────────────────────────────

  log("=== TikTok Unfollower (Smart Mode) ===");

  // 1. Collect Following
  const followingBtn = findStatButton("Following");
  if (!followingBtn) throw new Error("Navigate to your profile first.");
  followingBtn.click();
  await sleep(2000);
  await scrollAllLoaded("following");
  const following = extractUsernames();
  log(`Following: ${following.size} accounts`);
  closeModal();
  await sleep(1000);

  // 2. Collect Followers
  const followersBtn = findStatButton("Followers");
  if (!followersBtn) throw new Error("Cannot find Followers button.");
  followersBtn.click();
  await sleep(2000);
  await scrollAllLoaded("followers");
  const followers = extractUsernames();
  log(`Followers: ${followers.size} accounts`);
  closeModal();
  await sleep(1000);

  // 3. Compute non-mutuals
  const nonMutuals = [...following].filter((u) => !followers.has(u));
  log(`Non-mutuals: ${nonMutuals.length} accounts`);

  if (nonMutuals.length === 0) {
    log("Everyone you follow follows you back. Nothing to do.");
    return;
  }

  if (nonMutuals.length > MAX_UNFOLLOW) {
    log(`⚠️  Found ${nonMutuals.length} non-mutuals but MAX_UNFOLLOW is ${MAX_UNFOLLOW}.`);
    log(`Will unfollow ${MAX_UNFOLLOW} now. Run again later for the rest.`);
  }

  // 4. Unfollow
  const unfollowed = await unfollowNonMutuals(nonMutuals);

  // 5. Done
  closeModal();
  log(`✅ Done. Unfollowed ${unfollowed} accounts. Mutuals untouched.`);
  log("=== Finished ===");
})();
