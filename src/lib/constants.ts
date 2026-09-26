export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#why-orion" },
  { label: "About", href: "#made-for" },
  { label: "Contact", href: "#cta" },
] as const;

export const STATS = [
  { label: "Students Managed", value: 25000, suffix: "+" },
  { label: "Placement Drives", value: 1200, suffix: "+" },
  { label: "Applications Processed", value: 480000, suffix: "+" },
  { label: "Recruiters Connected", value: 850, suffix: "+" },
] as const;

export const WHY_ORION = [
  {
    title: "For Students",
    points: [
      "One dashboard for every drive and application",
      "Real-time status updates, zero guesswork",
      "AI resume feedback before you apply",
    ],
  },
  {
    title: "For Placement Officers",
    points: [
      "Run drives end-to-end without spreadsheets",
      "Institution-wide analytics in one view",
      "Automated eligibility and shortlisting",
    ],
  },
  {
    title: "For Recruiters",
    points: [
      "Direct access to verified student pools",
      "Structured, faster hiring pipelines",
      "Transparent reporting on every drive",
    ],
  },
] as const;