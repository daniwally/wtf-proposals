export async function POST(request: Request) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }
  console.log("API Key starts with:", apiKey.substring(0, 10), "length:", apiKey.length);

  const body = await request.json();
  const { prompt, agency, client, currency, lang } = body;

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const agencyName = agency || "WTF Agency";
  const clientName = client || "Cliente";
  const curr = currency || "ARS";
  const language = lang || "es";

  const systemPrompt = language === "en"
    ? `You are a senior strategic planner at a full-service creative agency. Generate a commercial proposal as structured JSON. The agency is "${agencyName}". The client is "${clientName}". Currency: ${curr}. Respond ONLY with valid JSON, no markdown, no backticks, no explanation.`
    : `Sos un planificador estrategico senior en una agencia creativa full-service en Latinoamerica. Genera una propuesta comercial como JSON estructurado. La agencia es "${agencyName}". El cliente es "${clientName}". Moneda: ${curr}. Responde SOLO con JSON valido, sin markdown, sin backticks, sin explicacion.`;

  const userPrompt = language === "en"
    ? `Generate a complete commercial proposal for this project: "${prompt}"

Return this exact JSON structure:
{
  "theme": {
    "palette": { "background": "#hex dark bg", "surface": "#hex slightly lighter", "primary": "#hex main brand color", "accent": "#hex secondary color", "text": "#hex light text", "textMuted": "#hex muted text" },
    "fonts": { "display": "A Google Font name for headings (expressive, unique)", "body": "A Google Font name for body (clean, readable)" },
    "aesthetic": "one word: brutalist | luxe | organic | futuristic | editorial | minimal | bold",
    "backgroundEffect": "gradient-mesh | particles | geometric | noise"
  },
  "proposal": {
    "clientName": "${clientName}",
    "projectTitle": "creative project title",
    "tagline": "an inspiring tagline",
    "challenge": "2-3 paragraphs describing the challenge/opportunity (use <br><br> between paragraphs)",
    "approach": "2-3 paragraphs with the strategic approach (use <br><br> between paragraphs)",
    "deliverables": [ { "icon": "emoji", "title": "...", "description": "..." } ],
    "pricing": [ { "item": "line item name", "detail": "brief description", "amount": number } ],
    "currency": "${curr}",
    "timeline": [ { "phase": "Phase Name", "duration": "X weeks", "tasks": "key tasks" } ],
    "differentiators": [ { "icon": "emoji", "title": "...", "description": "..." } ],
    "ctaText": "call to action text"
  }
}

Important: pricing amounts must be realistic numbers for the ${curr} currency. Include 4-8 deliverables, 4-8 pricing line items, 3-5 timeline phases, and exactly 3 differentiators. All text in English.`
    : `Genera una propuesta comercial completa para este proyecto: "${prompt}"

Devolveme esta estructura JSON exacta:
{
  "theme": {
    "palette": { "background": "#hex fondo oscuro", "surface": "#hex algo mas claro", "primary": "#hex color principal de marca", "accent": "#hex color secundario", "text": "#hex texto claro", "textMuted": "#hex texto apagado" },
    "fonts": { "display": "Un nombre de Google Font para titulos (expresiva, unica)", "body": "Un nombre de Google Font para cuerpo (limpia, legible)" },
    "aesthetic": "una palabra: brutalist | luxe | organic | futuristic | editorial | minimal | bold",
    "backgroundEffect": "gradient-mesh | particles | geometric | noise"
  },
  "proposal": {
    "clientName": "${clientName}",
    "projectTitle": "titulo creativo del proyecto",
    "tagline": "un tagline inspirador",
    "challenge": "2-3 parrafos describiendo el desafio/oportunidad (usa <br><br> entre parrafos)",
    "approach": "2-3 parrafos con el enfoque estrategico (usa <br><br> entre parrafos)",
    "deliverables": [ { "icon": "emoji", "title": "...", "description": "..." } ],
    "pricing": [ { "item": "nombre del item", "detail": "breve descripcion", "amount": numero } ],
    "currency": "${curr}",
    "timeline": [ { "phase": "Nombre de Fase", "duration": "X semanas", "tasks": "tareas clave" } ],
    "differentiators": [ { "icon": "emoji", "title": "...", "description": "..." } ],
    "ctaText": "texto del call to action"
  }
}

Importante: los montos deben ser numeros realistas para la moneda ${curr}. Incluir 4-8 entregables, 4-8 items de precio, 3-5 fases de timeline, y exactamente 3 diferenciadores. Todo el texto en espanol.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log("Anthropic error response:", res.status, errText);
      let errMsg = `API error: ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errMsg;
      } catch { /* ignore */ }
      return Response.json(
        { error: `${errMsg} (status: ${res.status}, key prefix: ${apiKey.substring(0, 8)}...)` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data.content[0].text;

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) json = JSON.parse(match[0]);
      else return Response.json({ error: "No se pudo parsear la respuesta" }, { status: 500 });
    }

    return Response.json(json);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
