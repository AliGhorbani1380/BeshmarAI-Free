import type { Article, Category } from './types'

const technicalAuthor = {
  name: 'BeshmarAI Editorial Team',
  slug: 'beshmarai-content-team',
  role: 'Pharmacy Technology and Education Team',
  bio:
    'Practical guidance on pill counting, pharmacy technology, and safer medicine workflows.',
}

export const categoriesEn: Category[] = [
  {
    name: 'Pill Counting',
    slug: 'pill-counting',
    description:
      'Methods, tools, and practical controls for reducing pill and capsule counting errors.',
  },
  {
    name: 'Pharmacy Technician Training',
    slug: 'pharmacy-technician',
    description:
      'Practical guides and checklists for pharmacy technicians.',
  },
  {
    name: 'Pharmacy Technology',
    slug: 'pharmacy-technology',
    description:
      'On-device AI, computer vision, and digital tools for pharmacy workflows.',
  },
  {
    name: 'Responsible Medicine Use',
    slug: 'responsible-medicine-use',
    description:
      'Unused medicines, pharmaceutical waste, sustainable packaging, and rational medicine use.',
  },
]

export const localArticlesEn: Article[] = [
  {
    id: 'en-001',
    slug: 'accurate-pill-counting-pharmacy-guide',
    title: 'A Practical Guide to Accurate Pill Counting in the Pharmacy',
    excerpt:
      'A repeatable workflow for surface preparation, lighting, pill separation, camera positioning, and final verification.',
    description:
      'A step-by-step pharmacy pill-counting guide with practical methods for reducing counting errors.',
    category: categoriesEn[0],
    tags: ['pill counting', 'pharmacy workflow', 'error reduction'],
    primaryKeyword: 'accurate pill counting in pharmacy',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-20T08:00:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 8,
    coverImage: '/images/cover-accurate-pill-counting-pharmacy-guide-v23.png',
    coverAlt:
      'A pharmacy counting surface and a phone running on-device pill-counting AI',
    sections: [
      {
        heading: 'Why a repeatable process matters',
        paragraphs: [
          'Many counting errors come from changing the setup between attempts. A stable process makes results easier to inspect, compare, and repeat.',
          'AI should support professional judgment rather than replace it. The result is useful only after the frame, pill separation, and detection markers have been reviewed.',
        ],
      },
      {
        heading: 'Prepare the counting surface',
        bullets: [
          'Use a clean, matte, uniform surface with clear contrast against the pills.',
          'Separate pills as much as possible and remove fragments or unrelated objects.',
          'Keep every pill fully inside the visible counting region.',
          'Use the same working distance whenever possible.',
        ],
      },
      {
        heading: 'Control light and camera angle',
        paragraphs: [
          'Even light reduces strong shadows and glare. Keep the camera as close to perpendicular to the surface as possible so pills at the edges do not appear stretched or unusually small.',
        ],
      },
      {
        heading: 'Verify before accepting the result',
        bullets: [
          'Each visible pill should have one reasonable detection marker.',
          'The count should remain stable for more than a moment.',
          'There should be no obvious marker on an empty part of the surface.',
          'Repeat the count when pills overlap, leave the frame, or appear out of focus.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does camera counting replace technician verification?',
        answer:
          'No. BeshmarAI provides a suggested count that must be reviewed and confirmed by the user.',
      },
      {
        question: 'What background works best?',
        answer:
          'A matte, uniform background with strong contrast against the pills usually makes review easier.',
      },
    ],
  },
  {
    id: 'en-002',
    slug: 'pill-counting-camera-errors',
    title: 'Seven Common Camera Pill-Counting Errors and How to Reduce Them',
    excerpt:
      'Overlap, glare, low contrast, motion blur, framing, foreign objects, and camera angle are the most common causes.',
    description:
      'Common causes of camera pill-counting errors and practical ways to improve accuracy.',
    category: categoriesEn[0],
    tags: ['pill counting errors', 'camera counting', 'computer vision'],
    primaryKeyword: 'pill counting camera errors',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-20T09:00:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 7,
    coverImage: '/images/cover-pill-counting-camera-errors-v23.png',
    coverAlt:
      'Camera view of pills prepared for counting and error review',
    sections: [
      {
        heading: '1. Overlapping pills',
        paragraphs: [
          'When pills cover one another, their boundaries become ambiguous. Spread them apart and capture another frame.',
        ],
      },
      {
        heading: '2. Glare and harsh reflections',
        paragraphs: [
          'Glossy pills or surfaces can create bright spots. Move the light source, diffuse the light, or change the camera angle slightly.',
        ],
      },
      {
        heading: '3. Low-contrast backgrounds',
        paragraphs: [
          'A surface close to the pill color makes boundaries harder to detect. Use a background with stronger visual contrast.',
        ],
      },
      {
        heading: '4. Motion blur or poor focus',
        paragraphs: [
          'Hold the phone still and allow a short moment for autofocus before starting the accurate count.',
        ],
      },
      {
        heading: '5. Pills outside the counting frame',
        paragraphs: [
          'A partially visible pill may be missed. Inspect every edge of the adjustable frame before confirming.',
        ],
      },
      {
        heading: '6. Foreign objects and fragments',
        paragraphs: [
          'Packaging fragments, stains, and broken pills can look like target objects. Clean the surface and separate anything unusual.',
        ],
      },
      {
        heading: '7. A steep camera angle',
        paragraphs: [
          'A tilted camera changes the apparent size of near and far pills. Keep the camera parallel to the surface whenever practical.',
        ],
      },
    ],
  },
  {
    id: 'en-003',
    slug: 'pharmacy-technician-shift-checklist',
    title: 'A Start-of-Shift Checklist for Pharmacy Technicians',
    excerpt:
      'A concise checklist for handover, workspace readiness, sensitive stock, counting tools, and follow-up items.',
    description:
      'A practical pharmacy-technician start-of-shift checklist for reducing missed routine tasks.',
    category: categoriesEn[1],
    tags: ['pharmacy technician', 'checklist', 'shift handover'],
    primaryKeyword: 'pharmacy technician shift checklist',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-20T10:00:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 6,
    coverImage: '/images/cover-pharmacy-technician-shift-checklist-v23.png',
    coverAlt:
      'A pharmacy technician reviewing a start-of-shift checklist',
    sections: [
      {
        heading: 'Complete the handover',
        bullets: [
          'Review unresolved requests, stock discrepancies, and pending orders.',
          'Confirm which items require follow-up and who owns each action.',
          'Record exceptions rather than relying on memory.',
        ],
      },
      {
        heading: 'Prepare the workspace',
        bullets: [
          'Clean the counting surface and frequently used tools.',
          'Check lighting, the camera position, printer, barcode scanner, and software.',
          'Prepare a consistent area for camera-assisted counting.',
        ],
      },
      {
        heading: 'Check sensitive and dated stock',
        bullets: [
          'Follow local procedures for near-expiry items.',
          'Check products with special storage requirements.',
          'Escalate and document any discrepancy under the pharmacist-in-charge workflow.',
        ],
      },
    ],
  },
  {
    id: 'en-004',
    slug: 'unused-medicine-at-home-guide',
    title: 'Unused Medicine at Home: What to Do and What to Avoid',
    excerpt:
      'Identify unused medicines, avoid self-directed reuse, and find an official return or disposal route.',
    description:
      'A practical guide to unused medicines at home, self-medication risks, and safer return or disposal decisions.',
    category: categoriesEn[3],
    tags: ['unused medicine', 'medicine disposal', 'household medicine'],
    primaryKeyword: 'unused medicine at home',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-31T01:00:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 9,
    coverImage: '/images/category-pill-counting-v23.png',
    coverAlt:
      'Unused medicines and pill packs prepared for a safe review',
    sections: [
      {
        heading: 'Why unused medicines accumulate',
        paragraphs: [
          'A changed prescription, a treatment stopped by a clinician, side effects, fixed package sizes, duplicate purchases, or forgotten household stock can all leave medicine unused.',
        ],
      },
      {
        heading: 'Do not change treatment on your own',
        paragraphs: [
          'Extra tablets do not mean a course should be shortened. Dose and duration should change only under professional guidance.',
          'Do not give prescription medicine to another person, even when symptoms appear similar.',
        ],
      },
      {
        heading: 'A five-minute medicine-cabinet review',
        bullets: [
          'Check the medicine name, strength, dosage form, patient label, expiry date, and storage instructions.',
          'Separate damaged, discolored, unlabelled, or improperly stored products.',
          'Keep medicines away from children and animals while waiting for an official disposal route.',
          'Ask a pharmacist before discarding medicine that may still be part of an active treatment.',
        ],
      },
      {
        heading: 'Use an official return or disposal route',
        paragraphs: [
          'Take-back programs are generally preferred where available, but rules vary by country, medicine type, and local infrastructure. Follow the official instructions for your location.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can unused prescription medicine be given to someone else?',
        answer:
          'No. Prescription medicine should not be transferred without a new professional assessment.',
      },
      {
        question: 'Can every expired medicine go into household waste?',
        answer:
          'No. Disposal rules differ by medicine and location. Check an official local return or disposal program.',
      },
    ],
    sources: [
      {
        title: 'WHO: Safe management of pharmaceutical waste from health care facilities',
        url: 'https://www.who.int/publications/i/item/9789240106710',
      },
      {
        title: 'Health Canada: Safe disposal of prescription drugs',
        url: 'https://www.canada.ca/en/health-canada/services/safe-disposal-prescription-drugs.html',
      },
      {
        title: 'FDA: Where and How to Dispose of Unused Medicines',
        url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines',
      },
    ],
  },
  {
    id: 'en-005',
    slug: 'medicine-packaging-environment-guide',
    title: 'Medicine Packaging and the Environment: It Is Not Only About Plastic',
    excerpt:
      'Pharmaceutical packaging must protect quality and authenticity while reducing material and environmental impact.',
    description:
      'A practical look at medicine packaging, blister waste, product protection, and more sustainable design.',
    category: categoriesEn[3],
    tags: ['medicine packaging', 'sustainability', 'pharmaceutical waste'],
    primaryKeyword: 'medicine packaging and environment',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-31T01:02:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 10,
    coverImage: '/images/on-device-ai-v23.png',
    coverAlt:
      'Conceptual view of pill packaging and sustainable pharmaceutical design',
    sections: [
      {
        heading: 'Packaging is part of medicine safety',
        paragraphs: [
          'Packaging protects medicine from moisture, light, oxygen, contamination, damage, and tampering while carrying essential identification and warnings.',
          'Sustainability should not weaken product protection. It should improve design, material efficiency, and end-of-life handling without compromising safety.',
        ],
      },
      {
        heading: 'Where the environmental impact comes from',
        bullets: [
          'Raw materials such as polymers, aluminum, paper, and glass',
          'Energy, water, printing, transport, and storage',
          'Multi-layer structures that are difficult to separate',
          'Residual medicine that requires specialized waste handling',
        ],
      },
      {
        heading: 'Blister, bottle, or unit dose?',
        paragraphs: [
          'There is no universal winner. The best format depends on medicine stability, treatment duration, traceability, error risk, and the available recycling or take-back infrastructure.',
        ],
      },
      {
        heading: 'Practical directions for improvement',
        bullets: [
          'Reduce weight and thickness without weakening the protective barrier.',
          'Use easier-to-separate or mono-material structures where feasible.',
          'Offer package sizes that better match prescribed treatment.',
          'Use digital information as a supplement, not a replacement for essential warnings.',
        ],
      },
    ],
    sources: [
      {
        title: 'WHO: Greener pharmaceutical manufacturing and distribution',
        url: 'https://www.who.int/news/item/23-12-2024-who-calls-for-transformative-action-towards-a-greener-future-in-pharmaceutical-manufacturing-and-distribution',
      },
      {
        title: 'WHO: Health-care waste fact sheet',
        url: 'https://www.who.int/news-room/fact-sheets/detail/health-care-waste',
      },
    ],
  },
  {
    id: 'en-006',
    slug: 'right-size-prescription-medicine',
    title: 'What Does Right-Sized Medicine Mean, and Why Is It Not Undertreatment?',
    excerpt:
      'Rational medicine use means the right medicine, dose, duration, and quantity for the right patient.',
    description:
      'An explanation of right-sized medicine, rational use, and the roles of prescribing, dispensing, packaging, and patient education.',
    category: categoriesEn[3],
    tags: ['rational medicine use', 'prescription quantity', 'right-sized medicine'],
    primaryKeyword: 'right-sized prescription medicine',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-31T01:04:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 8,
    coverImage: '/images/cover-accurate-pill-counting-pharmacy-guide-v23.png',
    coverAlt:
      'Accurate pill counting for a prescription-aligned quantity',
    sections: [
      {
        heading: 'Rational use is not “less is always better”',
        paragraphs: [
          'The goal is appropriate treatment: the medicine that fits the clinical need, at the correct dose and duration, with a reasonable cost to the patient and health system.',
          'Some treatments require a longer course or a larger quantity. Reducing them without professional guidance can harm outcomes.',
        ],
      },
      {
        heading: 'Where avoidable surplus can arise',
        bullets: [
          'A prescription continues without review.',
          'The available package size does not match the treatment duration.',
          'The same active ingredient is purchased under another brand.',
          'A treatment change leaves part of a package unused.',
        ],
      },
      {
        heading: 'The role of counting and packaging',
        paragraphs: [
          'Where regulations and product stability allow, accurate dispensing and more varied package sizes can reduce the gap between the quantity supplied and the quantity needed.',
          'Counting technology supports this workflow, but traceability, labeling, storage, and professional verification remain essential.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does right-sized medicine mean shortening treatment?',
        answer:
          'No. Treatment duration changes only under professional guidance. The goal is to align supply with a valid prescription.',
      },
    ],
    sources: [
      {
        title: 'WHO: Promoting rational use of medicines',
        url: 'https://www.who.int/activities/promoting-rational-use-of-medicines',
      },
    ],
  },
  {
    id: 'en-007',
    slug: 'safe-unused-medicine-return',
    title: 'Where Should Unused Medicine Be Returned? A Safe Decision Guide',
    excerpt:
      'Take-back programs differ by location. Start with the official instructions for the medicine and your jurisdiction.',
    description:
      'A decision guide for returning unused medicine and finding official disposal instructions.',
    category: categoriesEn[3],
    tags: ['medicine take-back', 'expired medicine', 'pharmaceutical waste'],
    primaryKeyword: 'unused medicine return',
    searchIntent: 'informational',
    author: technicalAuthor,
    publishedAt: '2026-07-31T01:06:00+03:30',
    updatedAt: '2026-08-03T12:00:00+03:30',
    readingMinutes: 8,
    coverImage: '/images/cover-pill-counting-camera-errors-v23.png',
    coverAlt:
      'Unused medicines prepared for an official return or disposal route',
    sections: [
      {
        heading: 'Why there is no single global disposal rule',
        paragraphs: [
          'Medicine type, poisoning risk, misuse potential, environmental impact, and collection infrastructure differ between jurisdictions. Official local instructions take priority over generic internet advice.',
        ],
      },
      {
        heading: 'A practical decision order',
        bullets: [
          'Read the medicine label or leaflet for product-specific instructions.',
          'Check the official health, medicines-regulator, or municipal guidance for your location.',
          'Ask a pharmacy whether it participates in an approved take-back program.',
          'Seek specialist guidance for controlled, injectable, chemotherapy, hormonal, or cold-chain products.',
        ],
      },
      {
        heading: 'Protect privacy and prevent access',
        paragraphs: [
          'Remove or obscure personal information on empty prescription labels. Keep unwanted medicine secured from children, animals, and unauthorized use until it enters an approved return or disposal route.',
        ],
      },
    ],
    sources: [
      {
        title: 'Health Canada: Safe disposal of prescription drugs',
        url: 'https://www.canada.ca/en/health-canada/services/safe-disposal-prescription-drugs.html',
      },
      {
        title: 'FDA: Where and How to Dispose of Unused Medicines',
        url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines',
      },
    ],
  },
]

export function getLocalArticlesEn(): Article[] {
  return [...localArticlesEn].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() -
      new Date(left.publishedAt).getTime(),
  )
}

export function getLocalArticleEn(
  slug: string,
): Article | undefined {
  return localArticlesEn.find(
    (article) =>
      article.slug === slug,
  )
}
