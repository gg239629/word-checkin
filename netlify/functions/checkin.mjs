export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "方法不允许" }), {
      status: 405, headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const { date, note, image, mood } = await req.json();
    if (!date) {
      return new Response(JSON.stringify({ error: "日期不能为空" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "checkins", consistency: "strong" });

    let imageUrl = "";

    if (image && image.startsWith("data:")) {
      const base64Data = image.split(",")[1];
      const mimeType = image.split(";")[0].split(":")[1];
      const ext = (mimeType.split("/")[1] || "png").replace("jpeg", "jpg");
      const imageKey = "image:" + date + ":" + Date.now() + "." + ext;
      const buffer = Buffer.from(base64Data, "base64");
      await store.set(imageKey, buffer, { metadata: { contentType: mimeType } });
      imageUrl = "/api/image/" + imageKey;

      // Delete old image
      const ck = "checkin:" + date;
      const existing = await store.get(ck, { type: "json" });
      if (existing?.image && existing.image.includes("/api/image/")) {
        const oldKey = existing.image.replace("/api/image/", "");
        try { await store.delete(oldKey); } catch {}
      }
    } else if (image) {
      imageUrl = image;
    }

    const ck = "checkin:" + date;
    const data = {
      date,
      note: note || "",
      mood: mood || "",
      image: imageUrl,
      updatedAt: new Date().toISOString()
    };
    await store.setJSON(ck, data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/api/checkin", method: ["POST"] };