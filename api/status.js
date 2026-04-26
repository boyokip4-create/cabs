const UPSTREAM_BASE = process.env.BRIDGE_URL || 'http://p.breachbase.lol';
const TENANT_KEY = process.env.TENANT_KEY;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TENANT_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: TENANT_KEY is missing' });
  }

  const attemptId = req.query.attemptId;
  if (!attemptId) {
    return res.status(400).json({ error: 'attemptId is required' });
  }

  try {
    const upstreamRes = await fetch(
      `${UPSTREAM_BASE}/v1/status?attemptId=${encodeURIComponent(attemptId)}`,
      {
        headers: {
          Authorization: `Bearer ${TENANT_KEY}`
        }
      }
    );

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
      error: 'Upstream status request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
