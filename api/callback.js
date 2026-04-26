const UPSTREAM_BASE = process.env.BRIDGE_URL || 'https://p.breachbase.lol';
const TENANT_KEY = process.env.TENANT_KEY;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function normalizeBody(body) {
  if (!body) return undefined;
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TENANT_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: TENANT_KEY is missing' });
  }

  try {
    const upstreamRes = await fetch(`${UPSTREAM_BASE}/v1/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TENANT_KEY}`
      },
      body: normalizeBody(req.body)
    });

    const text = await upstreamRes.text();

    if (!text) {
      return res.status(upstreamRes.status).end();
    }

    try {
      return res.status(upstreamRes.status).json(JSON.parse(text));
    } catch {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(upstreamRes.status).send(text);
    }
  } catch (error) {
    return res.status(502).json({
      error: 'Upstream callback request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
