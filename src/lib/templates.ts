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
  {
    id: "conflict_of_interest",
    title: "Conflict of Interest Disclosure",
    description:
      "Annual declaration for employees and directors to disclose any personal, financial, or professional interests that could conflict with the organisation's interests.",
    category: "Legal",
    categoryColor: "bg-green-50 text-green-700",
    useCase: "Annual staff & board declaration",
    estimatedTime: "5–8 min",
    questions: [
      q("radio", "Do you currently hold any external positions (board member, advisor, consultant, owner) at another organisation?", true, {
        options: ["No", "Yes — disclosed previously", "Yes — new disclosure"],
      }),
      q("textarea", "If yes, list all external roles, organisations, and your level of involvement.", false),
      q("radio", "Do you or any immediate family member hold a financial interest (equity, debt, royalties) in any organisation that does business with us?", true, {
        options: ["No", "Yes — please describe below"],
      }),
      q("textarea", "If yes, describe the organisation, the nature of the interest, and estimated value.", false),
      q("radio", "Are you aware of any situation where your personal interests could influence, or appear to influence, your professional decisions here?", true, {
        options: ["No", "Yes — please describe below"],
      }),
      q("textarea", "If yes, describe the potential conflict in detail.", false),
      q("radio", "Have you received any gifts, hospitality, or personal benefits exceeding policy limits from a vendor, client, or partner in the past 12 months?", true, {
        options: ["No", "Yes — reported to compliance", "Yes — not yet reported"],
      }),
      q("radio", "I confirm this disclosure is accurate and complete to the best of my knowledge.", true, {
        options: ["Yes, I confirm"],
      }),
    ],
  },
  {
    id: "expense_reimbursement",
    title: "Expense Reimbursement Request",
    description:
      "Structured submission for out-of-pocket business expenses with categorisation, approval routing, and receipt attestation.",
    category: "Finance",
    categoryColor: "bg-amber-50 text-amber-700",
    useCase: "Per expense submission",
    estimatedTime: "3–5 min",
    questions: [
      q("radio", "What is the primary expense category?", true, {
        options: ["Travel & transport", "Accommodation", "Meals & entertainment", "Office supplies", "Software / subscriptions", "Training & conferences", "Client-related", "Other"],
      }),
      q("text", "Total amount claimed (with currency, e.g. $250.00 USD)", true),
      q("text", "Date(s) of expense (e.g. 12 May 2025 or 10–14 May 2025)", true),
      q("text", "Business purpose — describe why this expense was necessary", true),
      q("text", "Name of client, project, or cost centre to charge", true),
      q("radio", "Did this expense require prior approval?", true, {
        options: ["No — within my self-approval limit", "Yes — approved by manager", "Yes — approved by finance"],
      }),
      q("radio", "Have you attached or will you submit all original receipts?", true, {
        options: ["All receipts attached", "Some receipts missing — reason provided below", "Receipt not available — see explanation below"],
      }),
      q("textarea", "If any receipts are missing, explain why and provide alternative evidence.", false),
      q("radio", "I confirm this claim is accurate, for a legitimate business purpose, and complies with the expense policy.", true, {
        options: ["Yes, I confirm"],
      }),
    ],
  },
  {
    id: "health_intake",
    title: "Pre-Appointment Health Intake",
    description:
      "Confidential patient intake form covering medical history, current medications, allergies, and informed consent before a clinical consultation.",
    category: "Healthcare & Research",
    categoryColor: "bg-green-50 text-green-700",
    useCase: "New & returning patient onboarding",
    estimatedTime: "8–12 min",
    questions: [
      q("radio", "Is this your first visit to this practice?", true, {
        options: ["Yes — new patient", "No — returning patient"],
      }),
      q("text", "Primary reason for today's appointment", true),
      q("radio", "How long have you been experiencing this concern?", true, {
        options: ["Just started (today)", "Less than 1 week", "1–4 weeks", "1–3 months", "Over 3 months", "Ongoing / chronic"],
      }),
      q("checkbox", "Do you have any of the following pre-existing conditions?", false, {
        options: ["Diabetes", "Hypertension", "Heart disease", "Asthma / respiratory", "Cancer (current or history)", "Mental health condition", "Autoimmune disorder", "None of the above"],
      }),
      q("textarea", "Please list all current medications, dosages, and prescribing doctor.", false),
      q("textarea", "List any known allergies (medications, foods, latex, environmental).", false),
      q("radio", "Do you smoke or use tobacco products?", true, {
        options: ["Never", "Former smoker (quit)", "Occasional", "Daily"],
      }),
      q("radio", "How often do you consume alcohol?", true, {
        options: ["Never", "Rarely (a few times a year)", "Socially (1–2x/week)", "Regularly (3–5x/week)", "Daily"],
      }),
      q("radio", "I consent to the collection and storage of my health information for the purposes of care and treatment.", true, {
        options: ["Yes, I consent"],
      }),
    ],
  },
  {
    id: "pip_form",
    title: "Performance Improvement Plan (PIP)",
    description:
      "A confidential, structured plan documenting performance gaps, measurable goals, support commitments, and a review timeline — signed off by manager and employee.",
    category: "HR & People",
    categoryColor: "bg-blue-50 text-blue-700",
    useCase: "Manager-initiated performance management",
    estimatedTime: "10–15 min",
    questions: [
      q("radio", "What is the primary performance concern prompting this PIP?", true, {
        options: ["Missed targets / output quality", "Attendance & punctuality", "Behavioural / conduct issues", "Skills or capability gap", "Collaboration & communication", "Policy non-compliance"],
      }),
      q("textarea", "Describe the specific performance gaps with concrete examples and dates.", true),
      q("textarea", "List the measurable improvement goals the employee must meet, with clear success criteria.", true),
      q("radio", "What is the duration of this PIP?", true, {
        options: ["30 days", "60 days", "90 days", "Custom — specified below"],
      }),
      q("textarea", "Describe the support and resources the organisation will provide (coaching, training, check-ins).", true),
      q("radio", "How frequently will formal progress reviews occur?", true, {
        options: ["Weekly", "Bi-weekly", "Monthly"],
      }),
      q("textarea", "What are the consequences if performance does not improve by the end of the PIP period?", true),
      q("radio", "Has the employee been given the opportunity to respond to the concerns raised before this PIP was issued?", true, {
        options: ["Yes", "No — scheduled for a separate meeting"],
      }),
      q("radio", "Employee acknowledgement: I have read and understood the contents of this plan. Acknowledgement does not imply agreement.", true, {
        options: ["Acknowledged"],
      }),
    ],
  },
  {
    id: "nda_breach_report",
    title: "NDA Breach Incident Report",
    description:
      "Internal report for documenting a suspected or confirmed breach of a non-disclosure agreement, capturing facts, parties involved, and recommended remediation.",
    category: "Compliance & Legal",
    categoryColor: "bg-red-50 text-red-700",
    useCase: "Legal / compliance breach documentation",
    estimatedTime: "10–15 min",
    questions: [
      q("radio", "Is this a suspected breach or a confirmed breach?", true, {
        options: ["Confirmed — evidence in hand", "Strongly suspected — circumstantial evidence", "Suspected — early stage"],
      }),
      q("radio", "Who is the alleged breaching party?", true, {
        options: ["Current employee", "Former employee", "Contractor / freelancer", "Business partner", "Competitor", "Unknown"],
      }),
      q("text", "Name of the NDA or agreement breached (or reference/contract number)", true),
      q("radio", "What type of information was disclosed?", true, {
        options: ["Trade secrets / IP", "Client or customer data", "Financial information", "Product or roadmap details", "HR / personnel data", "Other confidential information"],
      }),
      q("textarea", "Describe what was disclosed, how you became aware, and any evidence you have.", true),
      q("text", "Approximate date the breach occurred or was discovered", true),
      q("radio", "Has the disclosed information been shared with third parties (beyond the initial breach)?", true, {
        options: ["Unknown", "No evidence of further sharing", "Yes — contained to one party", "Yes — widely shared"],
      }),
      q("radio", "What is your assessment of the potential business impact?", true, {
        options: ["Critical — immediate competitive or legal harm", "High — significant damage likely", "Moderate — manageable with swift action", "Low — limited exposure"],
      }),
      q("textarea", "What immediate steps have already been taken to limit damage?", false),
    ],
  },
  {
    id: "salary_advance",
    title: "Internal Loan / Salary Advance Request",
    description:
      "Employee request for a salary advance or internal loan, including reason, amount, repayment proposal, and manager sign-off.",
    category: "Finance",
    categoryColor: "bg-amber-50 text-amber-700",
    useCase: "Employee financial assistance",
    estimatedTime: "4–6 min",
    questions: [
      q("radio", "What type of financial assistance are you requesting?", true, {
        options: ["Salary advance (deducted from next payroll)", "Short-term internal loan (multi-month repayment)", "Emergency hardship advance"],
      }),
      q("text", "Amount requested (include currency)", true),
      q("radio", "What is the primary reason for this request?", true, {
        options: ["Medical / health emergency", "Family emergency", "Housing / relocation cost", "Unplanned essential expense", "Education / training", "Other"],
      }),
      q("textarea", "Briefly describe the circumstances. This information is confidential and seen only by HR and Finance.", true),
      q("radio", "How do you propose to repay this advance or loan?", true, {
        options: ["Full deduction from next payslip", "Over 2–3 months equally", "Over 4–6 months equally", "Custom arrangement — described below"],
      }),
      q("textarea", "If proposing a custom repayment plan, describe the schedule here.", false),
      q("radio", "Have you received a salary advance or internal loan in the past 12 months?", true, {
        options: ["No", "Yes — fully repaid", "Yes — still repaying"],
      }),
      q("radio", "I confirm the information above is accurate and I agree to the agreed repayment terms.", true, {
        options: ["Yes, I confirm"],
      }),
    ],
  },
  {
    id: "workplace_incident",
    title: "Workplace Injury / Near Miss Report",
    description:
      "Confidential incident report capturing the full circumstances of a workplace injury or near-miss, witnesses, and immediate corrective actions.",
    category: "Compliance & Legal",
    categoryColor: "bg-red-50 text-red-700",
    useCase: "Post-incident safety documentation",
    estimatedTime: "8–12 min",
    questions: [
      q("radio", "What type of event are you reporting?", true, {
        options: ["Injury requiring medical treatment", "Minor injury (first aid only)", "Near miss — no injury", "Dangerous condition observed", "Property damage"],
      }),
      q("text", "Date and time the incident occurred (e.g. 14 May 2025, 10:30am)", true),
      q("text", "Location where the incident occurred", true),
      q("radio", "Was the injured party (if applicable) a…", true, {
        options: ["Employee", "Contractor", "Visitor / client", "Member of the public", "No injury — near miss only"],
      }),
      q("textarea", "Describe exactly what happened, step by step, in the lead-up to and during the incident.", true),
      q("checkbox", "What factors contributed to the incident?", false, {
        options: ["Wet / slippery surface", "Inadequate lighting", "Faulty equipment", "Insufficient training", "Failure to follow procedure", "Fatigue", "Distraction", "Other"],
      }),
      q("radio", "Were there any witnesses present?", true, {
        options: ["Yes — names noted below", "No witnesses"],
      }),
      q("textarea", "List witness names and contact details if applicable.", false),
      q("textarea", "What immediate corrective actions were taken at the scene?", true),
      q("radio", "Has the injured person (if any) received medical attention?", true, {
        options: ["Yes — on-site first aid", "Yes — sent to hospital / clinic", "No medical attention needed", "Refused medical attention", "Not applicable"],
      }),
    ],
  },
  {
    id: "harassment_grievance",
    title: "Harassment & Grievance Report",
    description:
      "A confidential, anonymous-optional channel for employees to report workplace harassment, bullying, discrimination, or interpersonal grievances to HR.",
    category: "HR & People",
    categoryColor: "bg-blue-50 text-blue-700",
    useCase: "Employee-initiated grievance process",
    estimatedTime: "10–15 min",
    questions: [
      q("radio", "Do you wish to submit this report anonymously?", true, {
        options: ["Yes — anonymous submission", "No — I am willing to be contacted"],
      }),
      q("radio", "What is the nature of your complaint?", true, {
        options: ["Sexual harassment", "Bullying or intimidation", "Racial or ethnic discrimination", "Gender or identity discrimination", "Age discrimination", "Disability discrimination", "General workplace harassment", "Other"],
      }),
      q("radio", "Who is the complaint against?", true, {
        options: ["Direct manager", "Senior leadership", "Peer / colleague", "Subordinate", "Client or contractor", "HR personnel"],
      }),
      q("radio", "How long has this behaviour been occurring?", true, {
        options: ["One-time incident", "Less than 1 month", "1–3 months", "3–6 months", "Over 6 months"],
      }),
      q("textarea", "Describe the incident(s) in detail — include dates, locations, what was said or done, and anyone else present.", true),
      q("radio", "Have you previously raised this concern?", true, {
        options: ["No — this is the first time", "Yes — verbally to my manager", "Yes — verbally to HR", "Yes — formally, but not resolved"],
      }),
      q("radio", "Has this behaviour affected your ability to do your job?", true, {
        options: ["Significantly — I am considering leaving", "Moderately — my performance has suffered", "Somewhat — it's affecting my wellbeing", "Minimally so far"],
      }),
      q("textarea", "What outcome are you hoping for from this report?", false),
    ],
  },
  {
    id: "informed_consent",
    title: "Informed Consent & Data Use Agreement",
    description:
      "Captures participant consent for data collection, processing, retention, and sharing in research or product studies, with granular opt-in controls.",
    category: "Healthcare & Research",
    categoryColor: "bg-green-50 text-green-700",
    useCase: "Study or product research enrolment",
    estimatedTime: "5–7 min",
    questions: [
      q("text", "Study or project name you are consenting to participate in", true),
      q("radio", "Have you had sufficient time to read and understand the participant information sheet?", true, {
        options: ["Yes — I have read and understood it", "No — I would like to review it first"],
      }),
      q("radio", "Do you understand that participation is voluntary and you may withdraw at any time without penalty?", true, {
        options: ["Yes, I understand"],
      }),
      q("checkbox", "I consent to the following uses of my data (select all that apply):", true, {
        options: [
          "Collection of data as described in the study protocol",
          "Storage of my data for the duration of the study",
          "Use of anonymised data in published research or reports",
          "Sharing of anonymised data with research partners",
          "Being contacted for follow-up or related studies",
        ],
      }),
      q("radio", "Do you consent to audio or video recording of your session (if applicable)?", true, {
        options: ["Yes", "No", "Not applicable to this study"],
      }),
      q("radio", "How long do you consent to your data being retained after the study ends?", true, {
        options: ["For the duration of the study only", "Up to 1 year after the study", "Up to 5 years after the study", "Indefinitely for research purposes"],
      }),
      q("radio", "I confirm I am 18 years of age or older (or have guardian consent) and voluntarily agree to participate.", true, {
        options: ["Yes, I confirm and consent"],
      }),
    ],
  },
  {
    id: "security_clearance_screening",
    title: "Security Clearance Self-Assessment",
    description:
      "A confidential pre-screening questionnaire for candidates or staff seeking elevated access, covering foreign contacts, financial history, and background disclosures.",
    category: "IT & Security",
    categoryColor: "bg-neutral-100 text-neutral-700",
    useCase: "Sensitive role or elevated access onboarding",
    estimatedTime: "12–18 min",
    questions: [
      q("radio", "Do you hold citizenship or residency in any country other than your primary country of employment?", true, {
        options: ["No", "Yes — one other country", "Yes — multiple countries"],
      }),
      q("radio", "Have you lived outside your primary country of employment for more than 6 months in the past 7 years?", true, {
        options: ["No", "Yes"],
      }),
      q("radio", "Do you have close or regular contact with nationals of foreign governments or intelligence services?", true, {
        options: ["No", "Yes — professional context", "Yes — personal/family relationship"],
      }),
      q("radio", "Have you ever been investigated, charged, or convicted of a criminal offence (excluding minor traffic violations)?", true, {
        options: ["No", "Yes — charges dropped or acquitted", "Yes — conviction with details below"],
      }),
      q("textarea", "If yes to the above, provide dates, jurisdiction, nature of offence, and outcome.", false),
      q("radio", "In the past 7 years, have you experienced any of the following financial events?", true, {
        options: ["None", "Bankruptcy or insolvency", "County Court Judgements (CCJs) or equivalent", "Significant unresolved debt", "Tax evasion investigation"],
      }),
      q("radio", "Have you ever been denied a security clearance, or had one revoked?", true, {
        options: ["No", "Yes — provide details below"],
      }),
      q("textarea", "If yes, provide context including jurisdiction, date, and reason if known.", false),
      q("radio", "Are there any other circumstances you believe are relevant to an assessment of your trustworthiness or reliability?", true, {
        options: ["No", "Yes — described below"],
      }),
      q("textarea", "If yes, describe the circumstances.", false),
      q("radio", "I confirm all information provided is truthful and complete. I understand that false disclosure may result in immediate disqualification or termination.", true, {
        options: ["Yes, I confirm"],
      }),
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
  "Legal",
  "Finance",
  "IT & Security",
];