const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userKey = req.headers["x-api-key"];
  const apiKey = userKey && userKey.trim() ? userKey.trim() : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "No API key configured" });
  }

  const { prompt, jsonMode } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const generationConfig = { temperature: 0.5, maxOutputTokens: 4096 };
  if (jsonMode) generationConfig.responseMimeType = "application/json";

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  });

  const auths = [
    { url: `${GEMINI_BASE}?key=${apiKey}`, headers: { "Content-Type": "application/json" } },
    { url: GEMINI_BASE, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` } },
  ];

  for (const auth of auths) {
    let response;
    try {
      response = await fetch(auth.url, { method: "POST", headers: auth.headers, body });
    } catch {
      continue;
    }

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return res.status(200).json({ text });
    }

    const status = response.status;
    const err = await response.json().catch(() => ({}));

    if (status === 429) return res.status(429).json({ error: "QUOTA_EXCEEDED" });
    if (status === 401 || status === 403) continue;
    return res.status(status).json({ error: err.error?.message ?? `HTTP ${status}` });
  }

  return res.status(401).json({ error: "Authentication failed. Check the API key." });
}
