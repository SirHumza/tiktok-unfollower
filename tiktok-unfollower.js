/*
 * TikTok Unfollower — Unfollow everyone who doesn't follow you back.
 *
 * HOW TO USE:
 *   1. Open tiktok.com in Chrome/Edge/Firefox and log in.
 *   2. Go to your own profile.
 *   3. Open DevTools (F12 / Cmd+Option+I) → Console tab.
 *   4. Paste this entire script and press Enter.
 *   5. Keep the tab open and visible until it finishes.
 *
 * WHAT IT DOES:
 *   - Loads your full "Following" list.
 *   - Loads your full "Followers" list.
 *   - Unfollows everyone in "Following" who is NOT in "Followers".
 *   - Mutuals are never touched.
 *
 * NOTE: TikTok rate-limits unfollows. The script adds random delays to
 * mimic human behavior. If TikTok blocks you, wait an hour and resume
 * by running it again (it skips anyone already unfollowed).
 */

(async () => {
  const log = (msg) => console.log(`[TT-Unfollower] ${msg}`);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const PAUSE = () => sleep(rand(1200, 2500)); // anti-rate-limit delay

  // --- find the scrollable modal container ---
  function getModalContainer() {
    const candidates = document.querySelectorAll("div");
    for (const div of candidates) {
      const style = getComputedStyle(div);
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        div.scrollHeight > div.clientHeight &&
        div.querySelector('a[href*="/@"]')
      ) {
        return div;
      }
    }
    // fallback: look for the dialog role container
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) return dialog;
    return null;
  }

  // --- scroll a container until no new items load ---
  async function scrollUntilStable(label) {
    log(`Loading all ${label}...`);
    const container = getModalContainer();
    let lastHeight = 0;
    let unchanged = 0;

    for (let i = 0; i < 150; i++) {
      if (container) {
        container.scrollTop = container.scrollHeight;
      } else {
        window.scrollTo(0, document.body.scrollHeight);
      }
      await sleep(rand(800, 1400));

      const h = container ? container.scrollHeight : document.body.scrollHeight;
      if (h === lastHeight) {
        unchanged++;
      } else {
        unchanged = 0;
        lastHeight = h;
      }
      if (unchanged >= 6) break;
    }
  }

  // --- extract usernames from links currently in the modal ---
  function getUsernames() {
    const links = document.querySelectorAll('a[href*="/@"]');
    const set = new Set();
    for (const a of links) {
      const m = a.href.match(/\/@([^/?#]+)/);
      if (m) set.add(m[1]);
    }
    return set;
  }

  // --- click the "Unfollow" button for the first user row in the modal ---
  // TikTok's modal lists users with a small "Unfollow" button on each row.
  async function clickUnfollowInList() {
    // Each user row in the following list has an "Unfollow" button
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      if (text === "Unfollow") {
        btn.click();
        await PAUSE();
        // A confirmation dialog may appear — confirm it
        await confirmDialog();
        return true;
      }
    }
    return false;
  }

  // --- handle TikTok's "Unfollow?" confirmation dialog ---
  async function confirmDialog() {
    await sleep(500);
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      // TikTok shows "Unfollow" in the confirm dialog too, or "Cancel"
      if (
        text === "Unfollow" &&
        btn.closest('[role="dialog"]')
      ) {
        btn.click();
        await sleep(500);
        return;
      }
    }
  }

  // --- open the Following list modal ---
  async function openFollowing() {
    log("Opening Following list...");
    // On your own profile the stats are links
    const selctors = [
      'a[href$="/following"]',
      'strong[title="Following"]',
      '[data-e2e="following-count"]',
      '[class*="SpanFollowingCount"]',
    ];
    for (const sel of selctors) {
      const el = document.querySelector(sel);
      if (el) {
        el.click();
        await sleep(2000);
        return;
      }
    }
    // brute force: find any clickable element with exactly "Following"
    const all = document.querySelectorAll("span, strong, a, h2, div");
    for (const el of all) {
      if (el.textContent.trim() === "Following" && el.offsetParent !== null) {
        el.click();
        await sleep(2000);
        return;
      }
    }
    throw new Error("Could not find the Following button on your profile.");
  }

  // --- open the Followers list modal ---
  async function openFollowers() {
    log("Opening Followers list...");
    const selctors = [
      'a[href$="/followers"]',
      'strong[title="Followers"]',
      '[data-e2e="followers-count"]',
      '[class*="SpanFollowersCount"]',
    ];
    for (const sel of selctors) {
      const el = document.querySelector(sel);
      if (el) {
        el.click();
        await sleep(2000);
        return;
      }
    }
    const all = document.querySelectorAll("span, strong, a, h2, div");
    for (const el of all) {
      if (el.textContent.trim() === "Followers" && el.offsetParent !== null) {
        el.click();
        await sleep(2000);
        return;
      }
    }
    throw new Error("Could not find the Followers button on your profile.");
  }

  // --- close any open modal ---
  function closeModal() {
    const closeBtn =
      document.querySelector('[data-e2e="modal-close-inner-button"]') ||
      document.querySelector('button[aria-label="Close"]') ||
      document.querySelector('div[role="dialog"] button svg')?.closest("button");
    if (closeBtn) {
      closeBtn.click();
      return true;
    }
    // press Escape as fallback
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    return false;
  }

  // ======== MAIN ========
  log("=== TikTok Unfollower starting ===");

  // Step 1: collect Following
  await openFollowing();
  await scrollUntilStable("following");
  const following = getUsernames();
  log(`You follow ${following.size} accounts.`);
  closeModal();
  await sleep(1000);

  // Step 2: collect Followers
  await openFollowers();
  await scrollUntilStable("followers");
  const followers = getUsernames();
  log(`${followers.size} accounts follow you.`);
  closeModal();
  await sleep(1000);

  // Step 3: who to unfollow
  const toUnfollow = [...following].filter((u) => !followers.has(u));
  log(`Unfollowing ${toUnfollow.length} non-mutuals.`);

  if (toUnfollow.length === 0) {
    log("All your following are mutuals. Nothing to do.");
    return;
  }

  // Step 4: open Following list again and unfollow row by row
  await openFollowing();
  await scrollUntilStable("following");

  let done = 0;
  // We'll iterate through visible rows, clicking Unfollow on non-mutuals.
  // After each unfollow the list re-renders, so we re-query each iteration.
  for (let attempt = 0; attempt < 500 && done < toUnfollow.length; attempt++) {
    // Find all user rows in the modal
    const userRows = document.querySelectorAll('a[href*="/@"]');
    let actioned = false;

    for (const link of userRows) {
      const m = link.href.match(/\/@([^/?#]+)/);
      if (!m) continue;
      const username = m[1];
      if (!toUnfollow.includes(username)) continue;

      // Find the Unfollow button near this user's row
      const row = link.closest("div[class]") || link.parentElement?.parentElement;
      if (!row) continue;

      const unfollowBtn = [...row.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Unfollow"
      );

      if (unfollowBtn) {
        log(`[${done + 1}/${toUnfollow.length}] Unfollowing @${username}`);
        unfollowBtn.click();
        await PAUSE();
        await confirmDialog();
        done++;
        actioned = true;
        break; // list re-rendered, restart scan
      }
    }

    if (!actioned) {
      // scroll down to load more rows
      const container = getModalContainer();
      if (container) container.scrollTop = container.scrollHeight;
      await sleep(rand(1000, 1500));

      // if no progress after many scrolls, bail
      if (attempt > toUnfollow.length + 20) {
        log("Stopping — can't find more unfollow buttons.");
        break;
      }
    }
  }

  log(`Done. Unfollowed ${done} accounts. Mutuals were left alone.`);
  log("=== TikTok Unfollower finished ===");
})();
