/**
 * POST /api/contact — delivers the portfolio contact form.
 *
 * Delivery is chosen by whichever environment variable is set, in order:
 *
 *   1. RESEND_API_KEY        Sends through Resend (https://resend.com).
 *                            Optional companions:
 *                              CONTACT_TO_EMAIL   where mail is delivered
 *                                                 (default anamikaya0908@gmail.com)
 *                              CONTACT_FROM_EMAIL verified sender
 *                                                 (default onboarding@resend.dev)
 *
 *   2. CONTACT_WEBHOOK_URL   POSTs the JSON payload to any webhook —
 *                            Formspree, Zapier, Make, a Google Apps Script, etc.
 *
 * With neither set the endpoint replies 501, which the front-end treats as a
 * signal to open the visitor's own mail client with the message pre-filled.
 * The form therefore always works, configured or not.
 */

const TO_EMAIL   = process.env.CONTACT_TO_EMAIL   || 'anamikaya0908@gmail.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

const MAX = { name: 100, email: 150, message: 3000 };

/** Best-effort burst protection. Serverless instances are short-lived, so this
 *  only limits a single warm instance — enough to blunt naive spam. */
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const bucket = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  bucket.push(now);
  hits.set(ip, bucket);

  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (!times.length || now - times[times.length - 1] > RATE_LIMIT.windowMs) hits.delete(key);
    }
  }
  return bucket.length > RATE_LIMIT.max;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Please try again in a minute.' });
  }

  // Vercel parses JSON bodies, but be tolerant of a raw string.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name = '', email = '', message = '', company = '' } = body || {};

  // Honeypot — a filled hidden field means a bot. Accept silently so it
  // does not learn anything from the response.
  if (company) return res.status(200).json({ ok: true });

  const clean = {
    name: String(name).trim().slice(0, MAX.name),
    email: String(email).trim().slice(0, MAX.email),
    message: String(message).trim().slice(0, MAX.message),
  };

  if (!clean.name) return res.status(400).json({ error: 'Please include your name.' });
  if (!isEmail(clean.email)) return res.status(400).json({ error: 'Please include a valid email address.' });
  if (clean.message.length < 10) return res.status(400).json({ error: 'Please write a slightly longer message.' });

  const subject = `Portfolio enquiry from ${clean.name}`;

  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Portfolio <${FROM_EMAIL}>`,
          to: [TO_EMAIL],
          reply_to: clean.email,
          subject,
          html: `
            <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#17160F">
              <h2 style="margin:0 0 4px">New message from your portfolio</h2>
              <p style="margin:0 0 18px;color:#6B675E;font-size:14px">Sent from anamika-yadav.vercel.app</p>
              <p><strong>Name:</strong> ${escapeHtml(clean.name)}<br>
                 <strong>Email:</strong> <a href="mailto:${escapeHtml(clean.email)}">${escapeHtml(clean.email)}</a></p>
              <p style="white-space:pre-wrap;background:#F5F2EA;padding:16px;border-radius:8px">${escapeHtml(clean.message)}</p>
            </div>`,
          text: `New message from your portfolio\n\nName: ${clean.name}\nEmail: ${clean.email}\n\n${clean.message}`,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error('Resend error', response.status, detail);
        return res.status(502).json({ error: 'Mail service rejected the message. Please email directly.' });
      }
      return res.status(200).json({ ok: true });
    }

    if (process.env.CONTACT_WEBHOOK_URL) {
      const response = await fetch(process.env.CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...clean, subject, source: 'portfolio' }),
      });
      if (!response.ok) {
        console.error('Webhook error', response.status, await response.text());
        return res.status(502).json({ error: 'Delivery failed. Please email directly.' });
      }
      return res.status(200).json({ ok: true });
    }

    // Nothing configured — tell the client to fall back to mailto.
    return res.status(501).json({ error: 'Email delivery is not configured on this deployment.' });
  } catch (err) {
    console.error('Contact handler failed', err);
    return res.status(500).json({ error: 'Unexpected error. Please email directly.' });
  }
}
