"use client";

import Sidebar from "@/components/Sidebar";

export default function HelpPage() {
  const sections = [
    {
      title: "Creating surveys",
      items: [
        {
          question: "How do I create a new survey?",
          answer: "1. Click \"New form\" in the top right of your workspace or dashboard.\n2. Choose a pre-built template from categories like \"General\", \"Web3 & DAOs\", or select \"Start from scratch\".\n3. Add a descriptive title and optional introduction text for respondents.\n4. Add your questions: select a question type (single choice, multiple choice, open text), enter the question prompt, and add options if applicable.\n5. (Optional) Set a closing date to stop accepting responses automatically.\n6. Click \"Publish\" to make your survey live.",
        },
        {
          question: "What question types are supported?",
          answer: "Confyde currently supports three question types:\n- Single choice: Respondents select one option from a list (ideal for Yes/No, multiple choice with one answer).\n- Multiple choice: Respondents can select multiple options from a list.\n- Open text: Respondents can type a free-form response (good for longer answers and qualitative feedback).\nMore question types coming soon!",
        },
        {
          question: "Can I edit a survey after publishing?",
          answer: "Currently, once a survey is published, you cannot edit its questions. However, you can close and reopen surveys, duplicate existing surveys, or create new ones from scratch.",
        },
        {
          question: "Can I set a closing date for my survey?",
          answer: "Yes! When creating a survey, you'll find an optional \"Closing date\" field in the basics step. Set any date and time, and your survey will automatically stop accepting responses once that time passes. Closed surveys display a friendly message to respondents letting them know the survey is no longer accepting submissions.",
        },
        {
          question: "How do web3/DAO templates work?",
          answer: "Web3-specific templates are pre-built surveys for common DAO use cases: governance feedback, treasury allocation, contributor feedback, and more. They include carefully crafted questions tailored to DAO needs, and can be fully customized with your own questions and options.",
        },
      ],
    },
    {
      title: "Sharing & responses",
      items: [
        {
          question: "How do I share my survey?",
          answer: "1. From your workspace or dashboard, find the survey you want to share.\n2. On desktop: click the three dots menu and select \"Copy link\". On mobile: tap the survey to open options and select \"Copy link\".\n3. Share the copied URL with anyone! You can send it via email, post it on Discord/Telegram, or embed it on your website.",
        },
        {
          question: "Are responses encrypted?",
          answer: "Yes! Every response is end-to-end encrypted via Confidential Data Rails (CDR) before leaving the respondent's browser. The encryption happens entirely in-browser using secure cryptographic standards. Only you (the survey creator) can decrypt responses using your account.",
        },
        {
          question: "How do I view responses?",
          answer: "1. From your workspace or dashboard, find the survey with responses you want to view.\n2. Click the three dots menu (desktop) or tap the survey (mobile) and select \"Results\".\n3. Toggle between:\n   - **Summary view**: Aggregated responses, visual charts, and quick stats.\n   - **Individual view**: Each submission with timestamp and detailed answers.",
        },
        {
          question: "Can I export responses?",
          answer: "Absolutely! From the Results page:\n- Click \"Export\" dropdown at the top.\n- Choose \"Export as CSV\" to download a spreadsheet of all responses, or \"Export as JSON\" for a structured data file.\nFor individual responses, in the PDF preview modal click \"Download\" to save a formatted PDF with signature field.",
        },
        {
          question: "Are respondent identities kept private?",
          answer: "Yes! By default, surveys do not collect any identifying information about respondents unless you specifically add a question asking for it. All responses are encrypted end-to-end, and Confyde never stores plaintext responses on our servers.",
        },
      ],
    },
    {
      title: "Account & settings",
      items: [
        {
          question: "How do I change my password?",
          answer: "Go to the login page, click \"Forgot password\", enter your email, and follow the link in the reset email.",
        },
        {
          question: "Where can I see my account details?",
          answer: "Visit the settings page to view and manage your account details.",
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="anim-in d1 mb-8 md:mb-10">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Help Center</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            How can we help?
          </h1>
        </div>

        <div className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="anim-in" style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="rounded-2xl border border-neutral-100 bg-white p-5 md:p-6">
                    <h3 className="text-sm font-medium text-neutral-900 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.question}
                    </h3>
                    <div className="space-y-2">
                      {item.answer.split("\n").map((line, i) => (
                        <p key={i} className="text-sm text-neutral-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </Sidebar>
  );
}
