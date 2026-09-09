# Anamika Yadav — Portfolio

Portfolio site for **Anamika Yadav**, Product & UX Designer.
Static site, no build step, deployed on Vercel.

---

## Project structure

```
.
├── public/                  ← everything served to the browser
│   ├── index.html           the page
│   ├── 404.html             styled not-found page
│   ├── css/style.css        design tokens + all components
│   ├── js/
│   │   ├── projects.js      ← project content lives here
│   │   └── main.js          interaction layer
│   ├── assets/
│   │   ├── img/             .jpg + matching .webp for every image
│   │   └── docs/            resume + published paper (PDF)
│   ├── og-image.jpg         social preview card (1200×630)
│   ├── favicon.svg, apple-touch-icon.png, site.webmanifest
│   └── robots.txt, sitemap.xml
├── api/contact.js           serverless handler for the contact form
├── vercel.json              routing, caching, security headers
└── package.json
```

---

## Running it locally

No dependencies, no build. Any static server works:

```bash
python3 -m http.server 4321 --directory public
# then open http://localhost:4321
```

The contact form's `/api/contact` endpoint does not exist under a plain static
server — the form detects this and falls back to opening the visitor's mail
client. To exercise the real endpoint, run `npx vercel dev` instead.

---

## Editing content

### Projects

All case studies live in **`public/js/projects.js`** — one object per project.
Copy an existing block and fill it in:

```js
{
  id: 'my-project',                  // also the deep link: /#case/my-project
  title: 'My Project',
  year: '2026',
  tags: ['Healthcare', 'Mobile App'],
  status: 'Case Study',
  summary: 'One sentence for the card.',
  role: 'Your role · Context',
  cover: {
    jpg:  '/assets/img/work-my-project.jpg',
    webp: '/assets/img/work-my-project.webp',
    alt:  'Describe the image'
  },
  behance: 'https://…',              // optional — adds a Behance button
  sections: {                        // each key becomes a tab
    'Overview': '<p>…</p>',
    'Problem &amp; Research': '<p>…</p>'
  }
}
```

Notes:
- A project with **one** section renders without a tab bar — useful while a
  case study is still being written.
- Section values are raw HTML. `<div class="pd-meta-grid">` renders the
  Role / Focus / Tools row; copy it from an existing project.
- Every project is deep-linkable: `…/#case/qcare` opens straight into it.
  Handy for sending someone one specific case study.

### Adding images

Drop the `.jpg` in `public/assets/img/`, then generate the WebP twin:

```bash
cwebp -q 82 public/assets/img/your-image.jpg -o public/assets/img/your-image.webp
```

(`brew install webp` if `cwebp` is missing. If you skip the WebP, just point
both `jpg` and `webp` at the `.jpg` — it still works, only slightly larger.)

### Replacing the resume

Overwrite `public/assets/docs/anamika-yadav-resume.pdf`. It is served at the
clean URL **`/resume.pdf`** (a rewrite in `vercel.json`), so any link already
shared keeps working. Update `public/assets/img/resume-preview.jpg` too if the
first page changed.

---

## Contact form

`api/contact.js` picks a delivery method from environment variables:

| Variable | Effect |
| --- | --- |
| `RESEND_API_KEY` | Sends via [Resend](https://resend.com) |
| `CONTACT_TO_EMAIL` | Destination (default `anamikaya0908@gmail.com`) |
| `CONTACT_FROM_EMAIL` | Verified sender (default `onboarding@resend.dev`) |
| `CONTACT_WEBHOOK_URL` | Instead: POST the JSON to Formspree / Zapier / etc. |

Set these in **Vercel → Project → Settings → Environment Variables**, then
redeploy.

**With none of them set, the form still works** — the endpoint returns `501`
and the page opens the visitor's own mail client with the message pre-filled.
Nothing is ever silently lost.

Protections: required-field validation, a honeypot field, and per-instance
rate limiting (5 messages/minute).

---

## What the page does

- **Case-study dialog** — tabbed, deep-linkable (`#case/<id>`), keyboard
  navigable (`←`/`→` between projects, `←`/`→` between tabs when focused,
  `Esc` to close), focus-trapped, scroll-locked.
- **Theme** — dark/light, follows the system preference, remembers the choice,
  applied before first paint so there is no flash. Shortcut: `t`.
- **Scroll** — progress bar, nav scroll-spy, back-to-top, reveal animations.
- **Stat counters** animate on entry (skipped under `prefers-reduced-motion`).
- **Lightbox** for the certificate and resume preview.
- **Toasts** for copy-email and form feedback.

### Accessibility

Semantic landmarks, one `h1`, skip link, visible focus rings, ARIA tab
pattern in the dialog, focus trapping and restoration, alt text on every
image, and full `prefers-reduced-motion` support.

> The scroll-reveal animation starts at `opacity:0`. A safety sweep runs on
> scroll, on load, and on tab focus, and a `<noscript>` rule reveals
> everything — so content can never be stranded invisible.

---

## Deploying

Pushing to `main` triggers a Vercel deployment automatically.

```bash
git add -A
git commit -m "Update case study copy"
git push
```

Manual deploy: `npx vercel --prod`.

`css/` and `js/` are served with `max-age=0, must-revalidate`, so an edit is
live for everyone on their next load (revalidation returns a cheap `304` when
nothing changed). Files under `assets/` are immutable and cached for a year —
give a changed image a new filename, or it will stay cached.

### After moving to a custom domain

Replace `anamika-yadav.vercel.app` in:
`public/index.html` (canonical + `og:`/`twitter:` tags + JSON-LD),
`public/robots.txt`, and `public/sitemap.xml`.
