/*
 * TikTok Unfollower — Quick Mode
 *
 * Use this if you just want to unfollow EVERYONE in your following list
 * without checking mutuals. Same paste-into-console workflow.
 *
 * 1. Go to your TikTok profile.
 * 2. F12 → Console.
 * 3. Paste and run.
 */

(async () => {
  const log = (m) => console.log(`[TT-Quick] ${m}`);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function getScrollContainer() {
    for (const div of document.querySelectorAll("div")) {
      const s = getComputedStyle(div);
      if ((s.overflowY === "auto" || s.overflowY === "scroll") && div.scrollHeight > div.clientHeight)
        return div;
    }
    return document.querySelector('[role="dialog"]');
  }

  async function scrollAll() {
    const c = getScrollContainer();
    let last = 0, same = 0;
    for (let i = 0; i < 200; i++) {
      if (c) c.scrollTop = c.scrollHeight; else window.scrollTo(0, document.body.scrollHeight);
      await sleep(rand(800, 1300));
      const h = c ? c.scrollHeight : document.body.scrollHeight;
      if (h === last) { if (++same >= 6) break; } else { same = 0; last = h; }
    }
  }

  // Open following list
  const all = document.querySelectorAll("span, strong, a, h2, div");
  for (const el of all) {
    if (el.textContent.trim() === "Following" && el.offsetParent) { el.click(); break; }
  }
  await sleep(2000);
  await scrollAll();

  let done = 0;
  for (let attempt = 0; attempt < 500; attempt++) {
    const btns = [...document.querySelectorAll("button")].filter(
      (b) => b.textContent.trim() === "Unfollow" && b.offsetParent !== null
    );
    if (btns.length === 0) {
      const c = getScrollContainer();
      if (c) c.scrollTop = c.scrollHeight;
      await sleep(rand(1000, 1500));
      if (attempt > 50) { log("No more buttons found. Stopping."); break; }
      continue;
    }
    for (const btn of btns) {
      btn.click();
      done++;
      await sleep(rand(1000, 2000));
      // confirm dialog
      const confirm = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Unfollow" && b.closest('[role="dialog"]')
      );
      if (confirm) confirm.click();
      await sleep(rand(600, 1000));
      log(`Unfollowed ${done} accounts...`);
      break; // re-query after DOM update
    }
  }
  log(`Done. Unfollowed ${done} accounts total.`);
})();
