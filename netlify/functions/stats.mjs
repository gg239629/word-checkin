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
    const keys = blobs.map(b => b.key);

    if (!keys.length) {
      return new Response(JSON.stringify({
        total: 0, streak: 0, currentMonth: 0, monthTotal: 0, images: []
      }), { headers: { "Content-Type": "application/json" } });
    }

    const results = await Promise.all(keys.map(k => store.get(k, { type: "json" })));
    const all = results.filter(Boolean);
    const dates = all.map(c => c.date).filter(Boolean).sort().reverse();
    const total = dates.length;

    // Streak
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const fmtD = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    let cd = new Date(today);
    while(dates.includes(fmtD(cd))) { streak++; cd.setDate(cd.getDate()-1); }

    // Current month
    const now = new Date();
    const mp = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const md = dates.filter(d=>d.startsWith(mp));
    const mt = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();

    // Gallery
    const images = all.filter(c=>c.image).sort((a,b)=>b.date.localeCompare(a.date))
      .map(c=>({ date:c.date, image:c.image, note:c.note, mood:c.mood }));

    return new Response(JSON.stringify({
      total, streak, currentMonth: md.length, monthTotal: mt, images
    }), { headers: { "Content-Type": "application/json" } });

  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/api/stats", method: ["GET"] };