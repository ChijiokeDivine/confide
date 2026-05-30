// src/lib/templates.ts
import type { Question } from "@/types";

export interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  useCase: string;
  estimatedTime: string;
  questions: Question[];
}

function q(
  type: Question["type"],
  label: string,
  required = true,
  opts?: Partial<Question>
): Question {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    required,
    options: [],
    ...opts,
  };
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "employee_pulse",
    title: "Employee Pulse Survey",
    description:
      "A short, regular check-in to measure employee wellbeing, engagement, and satisfaction across your organisation.",
    category: "HR & People",
    categoryColor: "bg-blue-50 text-blue-700",
    useCase: "Weekly or monthly team check-ins",
    estimatedTime: "3–5 min",
    questions: [
      q("scale", "How satisfied are you with your overall work experience this week?", true, { min: 1, max: 10 }),
      q("scale", "How supported do you feel by your direct manager?", true, { min: 1, max: 10 }),
      q("radio", "Which best describes your current workload?", true, {
        options: ["Too light", "Just right", "Slightly heavy", "Overwhelmed"],
      }),
      q("scale", "How connected do you feel to the company's mission and goals?", true, { min: 1, max: 10 }),
      q("checkbox", "Which areas do you feel need the most attention right now?", false, {
        options: ["Communication", "Team collaboration", "Compensation", "Career growth", "Work-life balance", "Tools & resources"],
      }),
      q("textarea", "Is there anything specific on your mind this week you'd like leadership to know?", false),
    ],
  },
  {
    id: "exit_interview",
    title: "Exit Interview",
    description:
      "Capture honest feedback from departing employees about their experience, reasons for leaving, and improvement suggestions.",
    category: "HR & People",
    categoryColor: "bg-blue-50 text-blue-700",
    useCase: "Departing employee offboarding",
    estimatedTime: "8–12 min",
    questions: [
      q("radio", "What is the primary reason you are leaving?", true, {
        options: ["Better compensation elsewhere", "Career advancement opportunity", "Poor management", "Company culture", "Personal reasons", "Role mismatch", "Other"],
      }),
      q("scale", "Overall, how positive was your experience working here?", true, { min: 1, max: 10 }),
      q("scale", "How well were you recognised and rewarded for your contributions?", true, { min: 1, max: 10 }),
      q("radio", "How would you describe the company culture you experienced?", true, {
        options: ["Excellent — I'd recommend it", "Good with room to improve", "Neutral", "Challenging", "Toxic — needs major change"],
      }),
      q("textarea", "What did the company do well that it should continue doing?", true),
      q("textarea", "What is the single biggest change that would have made you stay?", true),
      q("radio", "Would you consider returning to work here in the future?", false, {
        options: ["Yes, definitely", "Possibly", "Unlikely", "No"],
      }),
      q("radio", "Would you recommend this company to a friend or colleague?", false, {
        options: ["Yes", "Maybe", "No"],
      }),
    ],
  },
  {
    id: "whistleblower",
    title: "Anonymous Whistleblower Report",
    description:
      "A confidential channel for reporting workplace misconduct, ethical violations, or compliance concerns without fear of retaliation.",
    category: "Compliance & Legal",
    categoryColor: "bg-red-50 text-red-700",
    useCase: "Internal ethics & compliance reporting",
    estimatedTime: "10–15 min",
    questions: [
      q("radio", "What type of concern are you reporting?", true, {
        options: [
          "Financial misconduct or fraud",
          "Harassment or discrimination",
          "Health & safety violation",
          "Data privacy breach",
          "Conflict of interest",
          "Regulatory non-compliance",
          "Other unethical conduct",
        ],
      }),
      q("radio", "How long has this issue been occurring?", true, {
        options: ["One-time incident", "Less than 1 month", "1–3 months", "3–6 months", "Over 6 months", "Ongoing / recurring"],
      }),
      q("radio", "Which area of the organisation is involved?", true, {
        options: ["Executive / Leadership", "Finance & Accounting", "HR & People", "Legal & Compliance", "Operations", "Sales & Business Development", "Technology / IT", "Other"],
      }),
      q("textarea", "Please describe the incident or concern in as much detail as you are comfortable sharing.", true),
      q("radio", "Have you reported this to anyone internally before?", true, {
        options: ["No — this is the first report", "Yes — to my direct manager", "Yes — to HR", "Yes — but no action was taken"],
      }),
      q("textarea", "Do you have any supporting evidence (describe documents, dates, names — do not upload files here)?", false),
      q("radio", "How urgent do you consider this matter?", true, {
        options: ["Immediate — risk of harm", "High — requires prompt attention", "Medium — important but not urgent", "Low — for awareness only"],
      }),
    ],
  },
  {
    id: "vendor_due_diligence",
    title: "Vendor Due Diligence Questionnaire",
    description:
      "Assess vendors and third-party partners across security, compliance, financial stability, and operational readiness before engagement.",
    category: "Procurement",
    categoryColor: "bg-amber-50 text-amber-700",
    useCase: "Supplier & partner vetting",
    estimatedTime: "15–20 min",
    questions: [
      q("text", "Legal entity name of your organisation", true),
      q("radio", "What is the annual revenue range of your organisation?", true, {
        options: ["Under $1M", "$1M – $10M", "$10M – $50M", "$50M – $250M", "$250M+", "Prefer not to disclose"],
      }),
      q("radio", "Do you hold any relevant regulatory certifications?", true, {
        options: ["ISO 27001", "SOC 2 Type II", "GDPR compliant", "PCI-DSS", "Multiple of the above", "None currently"],
      }),
      q("radio", "How do you handle data belonging to our organisation?", true, {
        options: ["End-to-end encrypted at all times", "Encrypted at rest and in transit", "Encrypted at rest only", "Standard security controls", "We do not store your data"],
      }),
      q("radio", "What is your standard uptime SLA?", true, {
        options: ["99.99%+", "99.9%+", "99.5%+", "99%+", "No formal SLA"],
      }),
      q("scale", "Rate your confidence in your ability to meet our volume requirements.", true, { min: 1, max: 10 }),
      q("radio", "Have you experienced a data breach or major security incident in the past 3 years?", true, {
        options: ["No", "Yes — fully resolved and disclosed", "Yes — resolved, not publicly disclosed", "Prefer not to answer"],
      }),
      q("textarea", "Describe your business continuity and disaster recovery plan.", true),
      q("textarea", "List any subcontractors or third parties that would have access to our data.", false),
    ],
  },
  {
    id: "clinical_feedback",
    title: "Clinical Trial Participant Feedback",
    description:
      "Collect structured, confidential feedback from trial participants about their experience, side effects, and protocol adherence.",
    category: "Healthcare & Research",
    categoryColor: "bg-green-50 text-green-700",
    useCase: "Post-session participant check-in",
    estimatedTime: "5–10 min",
    questions: [
      q("radio", "How long ago did you complete your most recent session or dose?", true, {
        options: ["Within 24 hours", "1–3 days ago", "4–7 days ago", "Over a week ago"],
      }),
      q("scale", "On a scale of 1–10, how would you rate your overall wellbeing since the last session?", true, { min: 1, max: 10 }),
      q("checkbox", "Have you experienced any of the following since the last session?", true, {
        options: ["Fatigue", "Nausea", "Headache", "Sleep disturbance", "Appetite change", "Mood change", "No notable effects"],
      }),
      q("scale", "How would you rate the severity of any side effects (1 = minimal, 10 = severe)?", true, { min: 1, max: 10 }),
      q("radio", "Have you taken any concomitant medications not listed in your protocol?", true, {
        options: ["No", "Yes — disclosed to study team", "Yes — not yet disclosed"],
      }),
      q("radio", "How closely have you been able to follow the study protocol?", true, {
        options: ["100% — fully compliant", "Mostly compliant (minor deviations)", "Partially compliant", "Significant deviations occurred"],
      }),
      q("textarea", "Please describe any concerns, questions, or observations you have for the study team.", false),
    ],
  },
  {
    id: "board_evaluation",
    title: "Board Member Effectiveness Evaluation",
    description:
      "An anonymous peer assessment of board member performance, governance quality, and strategic contribution.",
    category: "Governance",
    categoryColor: "bg-purple-50 text-purple-700",
    useCase: "Annual board self-assessment",
    estimatedTime: "10–15 min",
    questions: [
      q("scale", "How effectively does the board oversee the organisation's strategy?", true, { min: 1, max: 10 }),
      q("scale", "How well does the board hold management accountable for performance?", true, { min: 1, max: 10 }),
      q("radio", "How would you assess the quality of board meeting preparation and materials?", true, {
        options: ["Excellent — always thorough", "Good — generally adequate", "Fair — needs improvement", "Poor — consistently lacking"],
      }),
      q("scale", "How inclusive and diverse is the board in terms of perspectives and expertise?", true, { min: 1, max: 10 }),
      q("radio", "How effectively does the board manage conflicts of interest?", true, {
        options: ["Very effectively", "Adequately", "Inconsistently", "Poorly"],
      }),
      q("scale", "Rate the board's effectiveness in risk oversight.", true, { min: 1, max: 10 }),
      q("textarea", "What is one area where the board's effectiveness could be most significantly improved?", true),
      q("textarea", "What does the board do particularly well that should be preserved?", false),
    ],
  },
  {
    id: "nda_research",
    title: "Confidential Market Research Survey",
    description:
      "Gather sensitive competitive intelligence or strategic insights from a curated group of respondents under confidentiality.",
    category: "Research & Intelligence",
    categoryColor: "bg-neutral-100 text-neutral-700",
    useCase: "Closed-group industry research",
    estimatedTime: "12–18 min",
    questions: [
      q("radio", "What is your seniority level?", true, {
        options: ["C-Suite / Executive", "VP / Director", "Senior Manager", "Manager", "Individual Contributor"],
      }),
      q("radio", "What best describes your organisation's primary industry?", true, {
        options: ["Financial Services", "Technology", "Healthcare", "Manufacturing", "Retail & Consumer", "Professional Services", "Government / Public Sector", "Other"],
      }),
      q("radio", "How do you currently evaluate new vendors in this category?", true, {
        options: ["Formal RFP process", "Analyst reports (Gartner, Forrester)", "Peer referrals", "Direct outreach from vendors", "Internal POC / trial", "No formal process"],
      }),
      q("scale", "How satisfied are you with the current solutions in this market?", true, { min: 1, max: 10 }),
      q("checkbox", "Which of the following are your top priorities when selecting a solution?", true, {
        options: ["Security & compliance", "Price / total cost of ownership", "Ease of integration", "Vendor reputation", "Customer support quality", "Feature depth", "Implementation speed"],
      }),
      q("radio", "What is your budget range for this category in the next 12 months?", true, {
        options: ["Under $50K", "$50K – $250K", "$250K – $1M", "$1M – $5M", "$5M+", "Not yet determined"],
      }),
      q("textarea", "What is the single biggest unmet need in this market today?", true),
      q("textarea", "What would need to be true for you to switch from your current solution?", false),
    ],
  },
  {
    id: "dao_governance_feedback",
    title: "DAO Governance Feedback Survey",
    description:
      "Collect feedback from token holders and community members on DAO governance processes, proposal quality, and voting experience.",
    category: "Web3 & DAOs",
    categoryColor: "bg-indigo-50 text-indigo-700",
    useCase: "Quarterly DAO community check-in",
    estimatedTime: "8–12 min",
    questions: [
      q("scale", "How satisfied are you with the current governance process?", true, { min: 1, max: 10 }),
      q("radio", "How often do you vote on DAO proposals?", true, {
        options: ["Every proposal", "Most proposals", "Occasionally", "Rarely", "Never"],
      }),
      q("checkbox", "What factors prevent you from voting more often?", false, {
        options: ["Gas fees are too high", "Proposal information is unclear", "Don't have enough time", "Feel my vote doesn't matter", "Technical barriers", "Other"],
      }),
      q("scale", "How would you rate the quality of proposal documentation?", true, { min: 1, max: 10 }),
      q("radio", "Do you believe the DAO's decision-making is transparent?", true, {
        options: ["Very transparent", "Mostly transparent", "Neutral", "Somewhat opaque", "Very opaque"],
      }),
      q("scale", "How well do you think the DAO balances speed and decentralization?", true, { min: 1, max: 10 }),
      q("textarea", "What one change would most improve your participation in DAO governance?", false),
    ],
  },
  {
    id: "protocol_parameter_change",
    title: "Protocol Parameter Change Survey",
    description:
      "Gather community sentiment on proposed changes to protocol parameters (fees, incentives, collateral ratios, etc.) before an on-chain vote.",
    category: "Web3 & DAOs",
    categoryColor: "bg-indigo-50 text-indigo-700",
    useCase: "Pre-vote sentiment analysis",
    estimatedTime: "5–8 min",
    questions: [
      q("radio", "What is your current stance on this parameter change?", true, {
        options: ["Strongly support", "Support", "Neutral", "Oppose", "Strongly oppose"],
      }),
      q("scale", "How well do you understand the implications of this change?", true, { min: 1, max: 10 }),
      q("checkbox", "Which of these concerns are most important to you?", false, {
        options: ["Impact on protocol security", "Effect on user experience", "Financial impact on stakeholders", "Effect on protocol sustainability", "Alignment with protocol mission", "Other"],
      }),
      q("radio", "Do you think this change has been sufficiently discussed in the community?", true, {
        options: ["Yes, plenty of discussion", "Yes, but could be more", "Neutral", "No, needs more discussion", "No, very little discussion"],
      }),
      q("textarea", "Please share any additional thoughts or concerns about this proposal.", false),
    ],
  },
  {
    id: "community_treasury_allocation",
    title: "Community Treasury Allocation Survey",
    description:
      "Gather preferences on how to allocate DAO treasury funds across different initiatives (development, marketing, grants, etc.).",
    category: "Web3 & DAOs",
    categoryColor: "bg-indigo-50 text-indigo-700",
    useCase: "Treasury budgeting cycle",
    estimatedTime: "7–10 min",
    questions: [
      q("checkbox", "Which areas should be top priorities for treasury spending?", true, {
        options: ["Protocol development & security", "Marketing & user acquisition", "Community grants program", "Liquidity provision", "Research & development", "Legal & compliance", "Operations & admin", "Other"],
      }),
      q("scale", "How satisfied are you with the current treasury management transparency?", true, { min: 1, max: 10 }),
      q("radio", "What is your preferred approach to grant funding?", true, {
        options: ["Large grants to few projects", "Small grants to many projects", "Equally split between large and small", "Milestone-based funding only", "Other"],
      }),
      q("radio", "How often should treasury allocations be reviewed?", true, {
        options: ["Monthly", "Quarterly", "Bi-annually", "Annually", "As needed"],
      }),
      q("textarea", "What specific initiatives would you like to see funded in the next cycle?", false),
    ],
  },
  {
    id: "contributor_feedback",
    title: "DAO Contributor Feedback Survey",
    description:
      "Collect feedback from active DAO contributors on their experience, compensation, collaboration tools, and overall satisfaction.",
    category: "Web3 & DAOs",
    categoryColor: "bg-indigo-50 text-indigo-700",
    useCase: "Bi-annual contributor experience check",
    estimatedTime: "10–15 min",
    questions: [
      q("scale", "How satisfied are you with your overall experience as a contributor?", true, { min: 1, max: 10 }),
      q("radio", "How would you rate the clarity of your role and responsibilities?", true, {
        options: ["Very clear", "Mostly clear", "Neutral", "Somewhat unclear", "Very unclear"],
      }),
      q("radio", "How fair do you feel your compensation is compared to your contributions?", true, {
        options: ["Very fair", "Fair", "Neutral", "Unfair", "Very unfair"],
      }),
      q("checkbox", "Which tools do you find most helpful for collaboration?", false, {
        options: ["Discord", "Telegram", "Notion", "GitHub", "Snapshot", "Discourse", "Other"],
      }),
      q("scale", "How would you rate the onboarding process for new contributors?", true, { min: 1, max: 10 }),
      q("textarea", "What changes would most improve your experience as a contributor?", true),
      q("radio", "Would you recommend contributing to this DAO to others?", true, {
        options: ["Yes, enthusiastically", "Yes, with reservations", "Neutral", "Probably not", "No"],
      }),
    ],
  },
  {
    id: "defi_protocol_ux",
    title: "DeFi Protocol User Experience Survey",
    description:
      "Gather feedback from DeFi protocol users on usability, transaction experience, documentation, and feature requests.",
    category: "Web3 & DAOs",
    categoryColor: "bg-indigo-50 text-indigo-700",
    useCase: "Post-launch or quarterly UX research",
    estimatedTime: "8–12 min",
    questions: [
      q("scale", "How would you rate the overall user experience of our protocol?", true, { min: 1, max: 10 }),
      q("radio", "How easy was it to complete your first transaction?", true, {
        options: ["Very easy", "Easy", "Neutral", "Difficult", "Very difficult"],
      }),
      q("checkbox", "Which pain points have you experienced?", false, {
        options: ["High gas fees", "Slow transaction times", "Confusing UI", "Unclear documentation", "Security concerns", "Price impact/slippage issues", "Other"],
      }),
      q("scale", "How would you rate the quality of our documentation?", true, { min: 1, max: 10 }),
      q("radio", "Which wallet do you primarily use with our protocol?", true, {
        options: ["MetaMask", "WalletConnect", "Ledger", "Coinbase Wallet", "Rainbow", "Other"],
      }),
      q("textarea", "What feature would you most like to see added next?", false),
      q("scale", "How likely are you to recommend our protocol to others?", true, { min: 1, max: 10 }),
    ],
  },
  {
    id: "nft_collection_feedback",
    title: "NFT Collection Holder Feedback Survey",
    description:
      "Collect feedback from NFT holders on collection benefits, community experience, roadmap, and future plans.",
    category: "Web3 & DAOs",
    categoryColor: "bg-indigo-50 text-indigo-700",
    useCase: "Holder community engagement",
    estimatedTime: "6–10 min",
    questions: [
      q("scale", "How satisfied are you with being a holder of this collection?", true, { min: 1, max: 10 }),
      q("radio", "Which holder benefits do you value most?", true, {
        options: ["Exclusive content", "Early access to drops", "Governance rights", "Revenue sharing", "Merch discounts", "Community events", "Other"],
      }),
      q("scale", "How would you rate the community engagement?", true, { min: 1, max: 10 }),
      q("radio", "Do you feel the project team communicates effectively?", true, {
        options: ["Very effectively", "Effectively", "Neutral", "Ineffectively", "Very ineffectively"],
      }),
      q("scale", "How confident are you in the project's roadmap?", true, { min: 1, max: 10 }),
      q("textarea", "What would make you more excited about holding this NFT long-term?", false),
    ],
  },
];

export function getTemplateById(id: string): SurveyTemplate | undefined {
  return SURVEY_TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_CATEGORIES = [
  "All",
  "HR & People",
  "Compliance & Legal",
  "Procurement",
  "Healthcare & Research",
  "Governance",
  "Research & Intelligence",
  "Web3 & DAOs",
];