export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "checkins" });
    const { blobs } = await store.list({ prefix: "checkin:" });
    const allKeys = blobs.map(b => b.key);
    if (allKeys.length === 0) {
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    }
    const results = await Promise.all(allKeys.map(k => store.get(k, { type: "json" })));
    let checkins = results.filter(Boolean);
    if (year && month) {
      const prefix = year + "-" + String(month).padStart(2, "0");
      checkins = checkins.filter(c => c.date && c.date.startsWith(prefix));
    }
    return new Response(JSON.stringify(checkins), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
export const config = { path: "/api/checkins", method: ["GET"] };
