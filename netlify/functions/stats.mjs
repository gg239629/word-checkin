export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "方法不允许" }), {
      status: 405, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "checkins" });
    const { blobs } = await store.list({ prefix: "checkin:" });
    const allKeys = blobs.map(b => b.key);

    if (allKeys.length === 0) {
      return new Response(JSON.stringify({
        total: 0, streak: 0, currentMonth: 0, monthTotal: 0, totalWords: 0, images: []
      }), { headers: { "Content-Type": "application/json" } });
    }

    const results = await Promise.all(allKeys.map(k => store.get(k, { type: "json" })));
    const all = results.filter(Boolean);
    const dates = all.map(c => c.date).filter(Boolean).sort().reverse();
    const total = dates.length;

    // Total words
    const totalWords = all.reduce((sum, c) => sum + (parseInt(c.words) || 0), 0);

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fmt = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    let checkDate = new Date(today);
    while (dates.includes(fmt(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Current month stats
    const now = new Date();
    const monthPrefix = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const monthDates = dates.filter(d => d.startsWith(monthPrefix));
    const monthTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Gallery images
    const images = all.filter(c => c.image).sort((a, b) => b.date.localeCompare(a.date))
      .map(c => ({ date: c.date, image: c.image, note: c.note, words: c.words }));

    return new Response(JSON.stringify({
      total, streak, currentMonth: monthDates.length, monthTotal, totalWords, images
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/api/stats", method: ["GET"] };