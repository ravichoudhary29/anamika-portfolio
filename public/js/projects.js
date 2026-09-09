/* =========================================================================
   Project data
   --------------------------------------------------------------------------
   Each project renders a card in the work grid and a case-study dialog.

   To add a project, copy a block below and fill it in:
     id       unique slug — also the deep link (#case/<id>)
     cover    { jpg, webp, alt } — put files in /assets/img/
     behance  optional; adds a "View on Behance" button to the dialog
     sections ordered map of tab title -> HTML. Sections render as tabs.
                A single section hides the tab bar automatically.
   ========================================================================= */

window.PROJECTS = [
  {
    id: 'qcare',
    title: 'QCare',
    year: '2025',
    tags: ['Healthcare', 'Mobile App'],
    status: 'Case Study',
    summary: 'Rethinking the hospital waiting experience in India — reducing patient stress and uncertainty during outpatient visits.',
    role: 'End-to-end UX/UI · Independent project',
    cover: {
      jpg: '/assets/img/work-qcare.jpg',
      webp: '/assets/img/work-qcare.webp',
      alt: 'QCare — hospital queue app case study cover'
    },
    behance: 'https://www.behance.net/gallery/249533347/QCare-Rethinking-Hospital-Waiting-Experience-in-India',
    sections: {
      'Overview':
        '<p>QCare rethinks the hospital waiting experience in India, focusing on the emotional weight of waiting — not just the logistics of it.</p>' +
        '<div class="pd-meta-grid">' +
          '<div><span>Role</span><strong>End-to-end UX/UI</strong></div>' +
          '<div><span>Focus</span><strong>Healthcare, India</strong></div>' +
          '<div><span>Tools</span><strong>Figma</strong></div>' +
        '</div>',
      'Problem &amp; Research':
        '<p>I conducted research to understand patients&rsquo; emotions, frustrations, and challenges while waiting at outpatient clinics — uncertainty about timing turned out to be as stressful as the wait itself.</p>',
      'Process &amp; Iterations':
        '<p><strong>What I considered:</strong> showing patients an exact estimated wait time, versus a simpler position-in-queue indicator.</p>' +
        '<p><strong>What I chose, and why:</strong> position-in-queue — an exact time promises a precision hospitals can&rsquo;t actually guarantee, and breaking that promise once erodes trust for the rest of the visit. A position is always true, even when it moves.</p>',
      'Reflection &amp; Impact':
        '<p>The result is a more comfortable healthcare experience — screens designed specifically to reduce the stress and uncertainty patients feel while waiting.</p>'
    }
  },

  {
    id: 'reserve',
    title: 'ReServe',
    year: '2025',
    tags: ['Social Impact', 'Mobile App'],
    status: 'Case Study',
    summary: 'A food donation app UI/UX case study — connecting surplus food with the people who need it.',
    role: 'UI/UX Design · Independent project',
    cover: {
      jpg: '/assets/img/work-reserve.jpg',
      webp: '/assets/img/work-reserve.webp',
      alt: 'ReServe — food donation app case study cover'
    },
    behance: 'https://www.behance.net/gallery/240428421/ReServe-Food-Donation-App-UIUX',
    sections: {
      'Overview':
        '<p>ReServe is a mobile app designed to make donating and claiming surplus food simple for everyone involved — donors, volunteers, and recipients.</p>' +
        '<div class="pd-meta-grid">' +
          '<div><span>Role</span><strong>UI/UX Design</strong></div>' +
          '<div><span>Focus</span><strong>Social Impact</strong></div>' +
          '<div><span>Tools</span><strong>Figma</strong></div>' +
        '</div>'
    }
  },

  {
    id: 'astralis',
    title: 'Astralis',
    year: '2025',
    tags: ['Kiosk / Installation', 'Interaction Design'],
    status: 'Case Study',
    summary: 'An immersive museum experience kiosk, designed to make exhibits more interactive and engaging.',
    role: 'UX / Interaction Design · Independent project',
    cover: {
      jpg: '/assets/img/work-astralis.jpg',
      webp: '/assets/img/work-astralis.webp',
      alt: 'Astralis — immersive museum kiosk case study cover'
    },
    behance: 'https://www.behance.net/gallery/249314195/Astralis-Immersive-Museum-Experience-Kiosk',
    sections: {
      'Overview':
        '<p>Astralis is an interaction design concept for an immersive museum kiosk, designed to make exhibits feel more engaging and explorable for visitors.</p>' +
        '<div class="pd-meta-grid">' +
          '<div><span>Role</span><strong>UX / Interaction Design</strong></div>' +
          '<div><span>Focus</span><strong>Kiosk, Installation</strong></div>' +
          '<div><span>Tools</span><strong>Figma</strong></div>' +
        '</div>'
    }
  },

  {
    id: 'claritylens',
    title: 'ClarityLens',
    year: '2025',
    tags: ['AI / LegalTech', 'Web Platform'],
    status: 'Case Study',
    summary: 'An AI-powered platform that turns dense legal content into clear, structured, user-friendly insights for non-legal users.',
    role: 'UX Design &amp; Research · Independent project',
    cover: {
      jpg: '/assets/img/work-claritylens.jpg',
      webp: '/assets/img/work-claritylens.webp',
      alt: 'ClarityLens — AI legal clarity platform case study cover'
    },
    sections: {
      'Overview':
        '<p>ClarityLens is an AI-powered platform designed to simplify complex legal content into user-friendly insights, aimed at people without a legal background.</p>' +
        '<div class="pd-meta-grid">' +
          '<div><span>Role</span><strong>UX Design &amp; Research</strong></div>' +
          '<div><span>Focus</span><strong>AI, Accessibility</strong></div>' +
          '<div><span>Tools</span><strong>Figma</strong></div>' +
        '</div>',
      'Problem &amp; Research':
        '<p>Legal documents are dense and full of jargon, which puts non-legal users at a structural disadvantage — not because they lack intelligence, but because the format assumes legal literacy they don&rsquo;t have.</p>',
      'Process &amp; Iterations':
        '<p><strong>What I considered:</strong> a fully auto-summarized version of every document, versus a structured &ldquo;highlight + explain&rdquo; layer that keeps the original text intact.</p>' +
        '<p><strong>What I chose, and why:</strong> the structured layer — full auto-summarization risks quietly dropping a clause that matters legally, which is a worse failure mode than asking the user to read a little more. Clarity had to come from organization, not compression.</p>',
      'Reflection &amp; Impact':
        '<p>By prioritizing structure over compression, ClarityLens is built to make legal information genuinely usable for people outside the profession, without asking them to trust a black box.</p>'
    }
  }
];
