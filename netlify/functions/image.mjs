export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const { key } = context.params;
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "checkins" });
    const [blob, meta] = await Promise.all([
      store.get(key, { type: "blob" }),
      store.getMetadata(key)
    ]);
    if (!blob) {
      return new Response("Not found", { status: 404 });
    }
    const contentType = meta?.metadata?.contentType || "application/octet-stream";
    return new Response(blob, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
export const config = { path: "/api/image/:key", method: ["GET"] };
