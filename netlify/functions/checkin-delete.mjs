export default async (req, context) => {
  if (req.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const { date } = context.params;
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "checkins", consistency: "strong" });
    const checkinKey = "checkin:" + date;
    const existing = await store.get(checkinKey, { type: "json" });
    if (existing && existing.image) {
      const imageKey = existing.image.replace("/api/image/", "");
      await store.delete(imageKey);
    }
    await store.delete(checkinKey);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
export const config = { path: "/api/checkin/:date", method: ["DELETE"] };
