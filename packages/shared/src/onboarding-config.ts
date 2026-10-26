export type FieldType =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "multi"
  | "checkbox"
  | "toggle"
  | "upload"
  | "repeater"
  | "summary";
export type FieldSpec = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: string[];
  accept?: string;
  max?: number;
  min?: number;
  when?: { field: string; equals: string | boolean };
  rows?: number;
};
export type StepSpec = {
  role: "investor" | "founder";
  index: number;
  title: string;
  intro: string;
  help: {
    meaning: string;
    reason: string;
    enter: string;
    example: string;
    mistakes: string;
    question: string;
  };
  fields: FieldSpec[];
};
const investorTitles = [
  "Account details",
  "Identity and address",
  "Investor category",
  "Professional background",
  "Previous investment experience",
  "Investment capacity",
  "Financial documents",
  "Investment preferences",
  "Risk and eligibility",
  "Affiliations and conflicts",
  "Declarations and consent",
  "Review and submit",
];
const founderTitles = [
  "Founder account",
  "Startup identity",
  "Industry and stage",
  "Problem and solution",
  "Market and customers",
  "Business and revenue model",
  "Traction and sales",
  "Founder and team",
  "Funding requirements",
  "Company and legal documents",
  "Pitch deck and financial evidence",
  "Review and submit",
];
const build = (
  role: "investor" | "founder",
  raw: Array<Omit<StepSpec, "role" | "index">>,
): StepSpec[] => raw.map((s, i) => ({ ...s, role, index: i + 1 }));
export const ONBOARDING_STEPS: Record<"investor" | "founder", StepSpec[]> = {
  investor: build("investor", [
    {
      title: investorTitles[0]!,
      intro: "Set the foundation for a secure investor profile.",
      fields: [
        {
          id: "legalName",
          label: "Full legal name",
          type: "text",
          required: true,
          help: "Use the name on your applicable identity document.",
        },
        {
          id: "mobile",
          label: "Mobile number (if applicable)",
          type: "tel",
          placeholder: "Include country code",
        },
        {
          id: "country",
          label: "Country of residence",
          type: "text",
          required: true,
        },
      ],
      help: {
        meaning:
          "Create the account details used to identify you in the application.",
        reason:
          "A consistent legal name and a reachable account help protect the review process.",
        enter:
          "Use your legal name, residence country, and the verified email tied to your account. Add a mobile number only where applicable.",
        example: "Ari Patel; resident in India; phone with +91 country prefix.",
        mistakes:
          "Using an alias that differs from identity records, or entering a phone number without its country prefix.",
        question: "Which information is required before I can continue?",
      },
    },
    {
      title: investorTitles[1]!,
      intro:
        "Tell us which identity and address information applies in your jurisdiction.",
      fields: [
        {
          id: "identityCountry",
          label: "Issuing country",
          type: "text",
          required: true,
        },
        {
          id: "identityType",
          label: "Identity document type",
          type: "select",
          required: true,
          options: [
            "Passport",
            "National identity card",
            "Driver licence",
            "Other government ID",
          ],
        },
        {
          id: "address",
          label: "Residential address",
          type: "textarea",
          required: true,
        },
        {
          id: "identityDocuments",
          label: "Identity and address documents",
          type: "upload",
          required: true,
          accept: ".pdf,.png,.jpg,.jpeg",
          help: "Private upload · PDF, JPG, or PNG · maximum 10 MB per file.",
        },
      ],
      help: {
        meaning:
          "Provide the identity and address details requested for the selected country.",
        reason:
          "Verification requirements vary by jurisdiction and are reviewed by an authorized person.",
        enter:
          "Select the issuing country and document type, then attach a legible document through the private upload flow.",
        example:
          "Passport issued in the country of residence plus a recent address document if required.",
        mistakes:
          "Uploading an expired or unreadable document, or sharing a password-protected file without arranging an approved alternative.",
        question: "What makes an identity document acceptable?",
      },
    },
    {
      title: investorTitles[2]!,
      intro: "Choose the category that best describes how you invest.",
      fields: [
        {
          id: "category",
          label: "Investor category",
          type: "select",
          required: true,
          options: [
            "Individual investor",
            "Angel investor",
            "Venture capital fund",
            "Family office",
            "Other",
          ],
        },
        {
          id: "organization",
          label: "Organization or fund name",
          type: "text",
          when: { field: "category", equals: "Venture capital fund" },
        },
        {
          id: "organizationFamily",
          label: "Family office or entity name",
          type: "text",
          when: { field: "category", equals: "Family office" },
        },
        {
          id: "categoryOther",
          label: "Describe your investor category",
          type: "text",
          when: { field: "category", equals: "Other" },
        },
        {
          id: "investingFor",
          label: "Whose capital do you represent?",
          type: "select",
          required: true,
          options: ["My own capital", "A managed fund or entity", "Both"],
        },
      ],
      help: {
        meaning:
          "Identify the investor context so the application asks only relevant follow-up questions.",
        reason:
          "Individual and organization-backed applicants may need different authorization evidence.",
        enter:
          "Choose the closest category and specify whether the capital is personal, managed, or both.",
        example: "Angel investor; investing through my own entity.",
        mistakes:
          "Selecting a fund or family-office category without identifying the entity or authority you represent.",
        question: "What changes if I am applying on behalf of a fund?",
      },
    },
    {
      title: investorTitles[3]!,
      intro:
        "Describe the professional experience relevant to your investor profile.",
      fields: [
        { id: "occupation", label: "Occupation", type: "text", required: true },
        { id: "employer", label: "Employer or organization", type: "text" },
        { id: "designation", label: "Current designation", type: "text" },
        {
          id: "experienceYears",
          label: "Years of relevant experience",
          type: "number",
          min: 0,
          max: 80,
        },
        {
          id: "professionalLinks",
          label: "Professional links",
          type: "repeater",
          help: "Add one public profile URL per row.",
        },
        {
          id: "experienceSummary",
          label: "Relevant expertise",
          type: "textarea",
          help: "Briefly describe skills or sectors you know well.",
        },
      ],
      help: {
        meaning:
          "Capture your work context and expertise without treating it as proof of eligibility.",
        reason:
          "Professional experience can help founders understand the perspective behind an introduction.",
        enter:
          "Include your role, employer if relevant, years of experience, and public professional profiles.",
        example:
          "Product operator, 9 years; experience in enterprise software and supply-chain systems.",
        mistakes:
          "Entering private account passwords or overstating credentials that cannot be substantiated.",
        question: "Which kinds of experience are useful to include?",
      },
    },
    {
      title: investorTitles[4]!,
      intro:
        "Share previous startup investment experience—or choose the first-time path.",
      fields: [
        {
          id: "firstTime",
          label: "I have not yet invested in a startup",
          type: "checkbox",
        },
        {
          id: "investmentCount",
          label: "Number of previous startup investments",
          type: "number",
          min: 0,
          when: { field: "firstTime", equals: false },
        },
        {
          id: "investmentHistory",
          label: "Previous investments (company, year, sector, range)",
          type: "repeater",
          when: { field: "firstTime", equals: false },
          help: "You may describe investments without sharing sensitive deal documents.",
        },
        {
          id: "experienceReflection",
          label: "What have you learned about startup investing?",
          type: "textarea",
          help: "Optional for all applicants; useful for first-time investors too.",
        },
        {
          id: "investmentEvidence",
          label: "Optional evidence",
          type: "upload",
          accept: ".pdf,.png,.jpg,.jpeg",
        },
      ],
      help: {
        meaning:
          "Describe relevant investment history, or tell us that you are a first-time investor.",
        reason:
          "Past experience helps contextualize preferences; it is not a requirement to apply.",
        enter:
          "Choose the first-time path if you have no prior startup investments. Otherwise list approximate dates, sectors, and ranges.",
        example:
          "First-time investor; interested in learning about early-stage risk before making any commitment.",
        mistakes:
          "Leaving this step blank because you are new, or sharing another person's confidential investment records without permission.",
        question: "What should I do if I have never invested before?",
      },
    },
    {
      title: investorTitles[5]!,
      intro:
        "Describe intended capacity as a self-declared preference, not independently verified wealth.",
      fields: [
        {
          id: "intendedAmount",
          label: "Intended investment amount",
          type: "number",
          min: 0,
          required: true,
        },
        {
          id: "currency",
          label: "Currency",
          type: "select",
          required: true,
          options: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "Other"],
        },
        {
          id: "typicalRange",
          label: "Typical amount per opportunity",
          type: "select",
          options: [
            "Under 10,000",
            "10,000–25,000",
            "25,000–100,000",
            "100,000–500,000",
            "Over 500,000",
            "Prefer not to say",
          ],
        },
        {
          id: "frequency",
          label: "Intended frequency",
          type: "select",
          options: [
            "Exploring only",
            "One opportunity per year",
            "A few per year",
            "Several per year",
          ],
        },
        {
          id: "capitalSource",
          label: "Capital context",
          type: "select",
          required: true,
          options: [
            "Personal capital",
            "Managed capital",
            "A mix",
            "Not yet decided",
          ],
        },
      ],
      help: {
        meaning:
          "Describe the amount and pace you intend to consider, in a currency of your choice.",
        reason:
          "This is used to refine preferences. It is not a bank balance, commitment, or verification result.",
        enter:
          "Provide a realistic range and identify whether it relates to personal or managed capital.",
        example:
          "Self-declared intention: up to USD 25,000 per opportunity; not independently verified.",
        mistakes:
          "Treating this as a guaranteed commitment, or sharing bank passwords, PINs, or online banking credentials.",
        question: "Is the amount I enter independently verified?",
      },
    },
    {
      title: investorTitles[6]!,
      intro:
        "Upload only documents that apply to the verification requirements shown for your jurisdiction.",
      fields: [
        {
          id: "financialDocs",
          label: "Applicable financial evidence",
          type: "upload",
          accept: ".pdf,.png,.jpg,.jpeg,.csv,.xlsx",
          help: "Private upload · PDF, JPG, PNG, CSV, or XLSX · maximum 10 MB.",
        },
        {
          id: "documentPurpose",
          label: "What are you sharing?",
          type: "multi",
          options: [
            "Income evidence",
            "Assets or net-worth evidence",
            "Financial statement",
            "Previous investment evidence",
            "Organization document",
            "Not applicable / to be confirmed",
          ],
        },
        {
          id: "documentNotes",
          label: "Context or redaction note",
          type: "textarea",
          help: "Do not include bank sign-in details or PINs.",
        },
      ],
      help: {
        meaning:
          "Attach applicable financial or entity evidence using the approved private document channel.",
        reason:
          "Documents may support a review; required items differ by jurisdiction and investor category.",
        enter:
          "Select the purpose for each document and include only information you are authorized to share.",
        example:
          "An applicable statement with account credentials and unrelated transactions redacted where permitted.",
        mistakes:
          "Uploading bank login credentials, PINs, or unrelated personal information; expecting a document to auto-approve the application.",
        question: "How is financial evidence protected and reviewed?",
      },
    },
    {
      title: investorTitles[7]!,
      intro:
        "Set the sectors, stages, geographies, and business models you prefer to explore.",
      fields: [
        {
          id: "industries",
          label: "Industries",
          type: "multi",
          required: true,
          options: [
            "Climate & Energy",
            "Education",
            "Financial services",
            "Food & Agriculture",
            "Health",
            "Manufacturing",
            "Software",
            "Other",
          ],
        },
        {
          id: "stages",
          label: "Startup stages",
          type: "multi",
          required: true,
          options: [
            "Idea",
            "Prototype",
            "MVP",
            "Revenue-generating",
            "Seed",
            "Growth",
          ],
        },
        {
          id: "regions",
          label: "Regions",
          type: "multi",
          options: [
            "North America",
            "Europe",
            "South Asia",
            "Southeast Asia",
            "Africa",
            "Middle East",
            "Other",
          ],
        },
        {
          id: "businessModels",
          label: "Business models",
          type: "multi",
          options: [
            "B2B SaaS",
            "Marketplace",
            "Consumer",
            "Hardware",
            "Services",
            "Other",
          ],
        },
        {
          id: "expertise",
          label: "Experience you could bring",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "Choose discovery preferences that help organize relevant public profiles.",
        reason:
          "Preferences can improve discovery but do not restrict which public profiles you may view.",
        enter:
          "Select multiple industries, stages, regions, and business models as relevant.",
        example:
          "Climate & Energy; prototype and MVP; North America; B2B software.",
        mistakes:
          "Choosing every option by default or assuming a preference means an endorsement.",
        question: "Can I change these preferences later?",
      },
    },
    {
      title: investorTitles[8]!,
      intro:
        "Review the nature of startup risk and any eligibility statements that apply.",
      fields: [
        {
          id: "riskRead",
          label:
            "I understand startup investments can lose some or all capital and may be illiquid",
          type: "checkbox",
          required: true,
        },
        {
          id: "riskAcknowledgement",
          label:
            "I understand forecasts and valuations are uncertain and assumption-driven",
          type: "checkbox",
          required: true,
        },
        {
          id: "eligibilityJurisdiction",
          label: "Country or jurisdiction for eligibility review",
          type: "text",
          required: true,
        },
        {
          id: "eligibilityNotes",
          label: "Questions or relevant eligibility context",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "Acknowledge key risks and identify where eligibility requirements may apply.",
        reason:
          "Early-stage investments are risky, can be illiquid, and may not be suitable for every investor.",
        enter:
          "Read each statement carefully and select it yourself only if you understand and agree.",
        example:
          "Acknowledge possible total loss and illiquidity; list the country whose rules may apply.",
        mistakes:
          "Checking declarations without reading them, or treating this platform as personalized investment advice.",
        question: "What risks should I consider before continuing?",
      },
    },
    {
      title: investorTitles[9]!,
      intro:
        "Disclose relevant professional or organizational relationships and potential conflicts.",
      fields: [
        {
          id: "affiliations",
          label: "Relevant affiliations",
          type: "repeater",
          help: "Add an organization and your relationship to it.",
        },
        {
          id: "conflictStatus",
          label: "Do you have a potential conflict to disclose?",
          type: "select",
          required: true,
          options: [
            "No known conflict",
            "Yes",
            "Unsure / would like to discuss",
          ],
        },
        {
          id: "conflictDetails",
          label: "Conflict details",
          type: "textarea",
          when: { field: "conflictStatus", equals: "Yes" },
        },
        {
          id: "conflictQuestion",
          label: "Question for the review team",
          type: "textarea",
          when: {
            field: "conflictStatus",
            equals: "Unsure / would like to discuss",
          },
        },
      ],
      help: {
        meaning:
          "Identify relationships that might be relevant to a future startup introduction or review.",
        reason:
          "Disclosures help participants understand context and avoid undisclosed conflicts.",
        enter:
          "List relevant organizations and briefly explain your relationship, if any.",
        example:
          "Advisor to a company in the same sector; no current financial interest.",
        mistakes:
          "Assuming a possible conflict is too small to mention, or sharing unnecessary third-party personal data.",
        question: "What should I disclose if I am not sure it is a conflict?",
      },
    },
    {
      title: investorTitles[10]!,
      intro:
        "Read the privacy, verification, accuracy, and communications statements and choose deliberately.",
      fields: [
        {
          id: "termsAccepted",
          label: "I agree to the platform terms",
          type: "checkbox",
          required: true,
        },
        {
          id: "privacyAcknowledged",
          label: "I have reviewed the privacy information",
          type: "checkbox",
          required: true,
        },
        {
          id: "verificationConsent",
          label:
            "I consent to the applicable verification review described here",
          type: "checkbox",
          required: true,
        },
        {
          id: "accuracyDeclaration",
          label:
            "The information I provided is accurate to the best of my knowledge",
          type: "checkbox",
          required: true,
        },
        {
          id: "communicationsOptIn",
          label: "I would like to receive optional product communications",
          type: "checkbox",
        },
      ],
      help: {
        meaning:
          "Record your consent choices and accuracy declaration explicitly.",
        reason:
          "Consent and privacy acknowledgement must be an intentional decision; none is preselected.",
        enter:
          "Open the referenced terms and privacy details, then choose each applicable statement yourself.",
        example:
          "Accept required terms and verification consent only after reading the explanations.",
        mistakes:
          "Checking boxes without reading them, or confusing an optional newsletter opt-in with a required application declaration.",
        question: "Which consent choices are required and which are optional?",
      },
    },
    {
      title: investorTitles[11]!,
      intro:
        "Review every answer and document status before submitting the application for review.",
      fields: [
        {
          id: "applicationSummary",
          label: "Application summary",
          type: "summary",
        },
        {
          id: "missingInfo",
          label: "Notes on missing or not-applicable fields",
          type: "textarea",
        },
        {
          id: "finalAccuracy",
          label: "I reviewed this application and confirm its accuracy",
          type: "checkbox",
          required: true,
        },
      ],
      help: {
        meaning:
          "Check the complete application, conditional answers, document status, and unresolved fields.",
        reason:
          "Submission moves your application into a review process and should not duplicate an earlier submission.",
        enter:
          "Use the edit links to correct information and confirm that each declaration is still accurate.",
        example:
          "Documents marked uploaded only if storage confirmed; identity review still pending.",
        mistakes:
          "Assuming a file selection means upload succeeded, or resubmitting after a pending response.",
        question: "What happens after I submit this application?",
      },
    },
  ]),
  founder: build("founder", [
    {
      title: founderTitles[0]!,
      intro:
        "Create the founder account that will own your startup application.",
      fields: [
        { id: "founderName", label: "Full name", type: "text", required: true },
        {
          id: "founderMobile",
          label: "Mobile number (if applicable)",
          type: "tel",
        },
        {
          id: "founderCountry",
          label: "Country of residence",
          type: "text",
          required: true,
        },
      ],
      help: {
        meaning: "Provide your founder identity and account contact details.",
        reason:
          "The account needs a responsible owner for the startup application and review follow-ups.",
        enter:
          "Use your name and country, add a phone only where it applies, and complete email verification.",
        example:
          "Jordan Lee; based in Canada; email verified before application submission.",
        mistakes:
          "Using a shared password, entering someone else's contact information, or assuming verification is complete without the email check.",
        question: "How do I verify the email on my account?",
      },
    },
    {
      title: founderTitles[1]!,
      intro:
        "Identify the startup—even if it is still an idea or has not incorporated.",
      fields: [
        {
          id: "startupName",
          label: "Startup name",
          type: "text",
          required: true,
        },
        {
          id: "tagline",
          label: "One-line description",
          type: "text",
          required: true,
          max: 160,
        },
        { id: "website", label: "Website (optional)", type: "url" },
        {
          id: "headquarters",
          label: "Headquarters or primary region",
          type: "text",
          required: true,
        },
        {
          id: "foundingDate",
          label: "Founding date (or intended start date)",
          type: "date",
        },
        {
          id: "legalStatus",
          label: "Legal status",
          type: "select",
          required: true,
          options: [
            "Not incorporated / idea stage",
            "Incorporated",
            "Incorporation in progress",
            "Other",
          ],
        },
        {
          id: "legalJurisdiction",
          label: "Country or jurisdiction of incorporation",
          type: "text",
          when: { field: "legalStatus", equals: "Incorporated" },
        },
      ],
      help: {
        meaning:
          "Capture the startup's public identity and its current legal status.",
        reason:
          "Idea-stage and unincorporated startups are eligible to describe their progress honestly.",
        enter:
          "Enter the working name, concise tagline, home region, approximate start date, and select the correct legal state.",
        example:
          "Working name; pre-incorporation; based in Nairobi; planned founding period this year.",
        mistakes:
          "Claiming a legal entity exists before formation, or treating an optional website as mandatory.",
        question: "Can I apply before incorporating the startup?",
      },
    },
    {
      title: founderTitles[2]!,
      intro: "Describe where the business sits today and who it serves.",
      fields: [
        {
          id: "industry",
          label: "Primary industry",
          type: "select",
          required: true,
          options: [
            "Climate & Energy",
            "Education",
            "Financial services",
            "Food & Agriculture",
            "Health",
            "Manufacturing",
            "Software",
            "Other",
          ],
        },
        {
          id: "businessModel",
          label: "Business model",
          type: "select",
          required: true,
          options: [
            "B2B SaaS",
            "Marketplace",
            "Consumer product",
            "Hardware",
            "Services",
            "Other",
          ],
        },
        {
          id: "developmentStage",
          label: "Development stage",
          type: "select",
          required: true,
          options: [
            "Idea",
            "Prototype",
            "MVP",
            "Revenue-generating",
            "Seed",
            "Growth",
          ],
        },
        {
          id: "region",
          label: "Primary customer region",
          type: "multi",
          options: [
            "North America",
            "Europe",
            "South Asia",
            "Southeast Asia",
            "Africa",
            "Middle East",
            "Other",
          ],
        },
        {
          id: "teamSize",
          label: "Current team size",
          type: "number",
          min: 1,
          required: true,
        },
      ],
      help: {
        meaning:
          "Choose the business's sector, operating model, maturity, geography, and team size.",
        reason:
          "These descriptors help investors filter profiles without implying endorsement or verification.",
        enter:
          "Select the stage that reflects current evidence—not an aspirational next milestone.",
        example:
          "Food and agriculture; marketplace; prototype; two active team members.",
        mistakes:
          "Calling an idea an MVP before users can use it, or omitting co-founders from team size.",
        question: "How do I choose between prototype and MVP?",
      },
    },
    {
      title: founderTitles[3]!,
      intro:
        "Explain the customer problem, your approach, and why it is distinct.",
      fields: [
        {
          id: "problem",
          label: "Problem you are addressing",
          type: "textarea",
          required: true,
          help: "Describe who experiences it and in what context.",
        },
        {
          id: "targetUser",
          label: "Target users or customers",
          type: "textarea",
          required: true,
        },
        {
          id: "solution",
          label: "Your solution",
          type: "textarea",
          required: true,
        },
        {
          id: "differentiation",
          label: "What is meaningfully different?",
          type: "textarea",
          required: true,
        },
        {
          id: "alternatives",
          label: "Existing alternatives",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "Explain the problem from a user's point of view and how your solution responds.",
        reason:
          "A specific problem and a clear comparison make the product easier to understand.",
        enter:
          "Name the audience, situation, current workaround, and evidence for your difference.",
        example:
          "Independent operators reconcile orders across tools; our prototype centralizes a specific handoff.",
        mistakes:
          "Using only broad market language, overstating differentiation, or presenting an assumption as customer evidence.",
        question: "Can you help make this problem statement more concise?",
      },
    },
    {
      title: founderTitles[4]!,
      intro:
        "Outline the customers, market assumptions, sources, and acquisition path.",
      fields: [
        {
          id: "audience",
          label: "Target audience",
          type: "textarea",
          required: true,
        },
        {
          id: "segments",
          label: "Customer segments",
          type: "repeater",
          help: "Add segment names or buyer/user distinctions.",
        },
        {
          id: "geography",
          label: "Market geography",
          type: "text",
          required: true,
        },
        {
          id: "marketSize",
          label: "Market-size assumption and calculation",
          type: "textarea",
          help: "Show your method and key inputs rather than only a top-down number.",
        },
        {
          id: "marketSources",
          label: "Sources for market assumptions",
          type: "repeater",
        },
        {
          id: "competitors",
          label: "Alternatives and competitors",
          type: "textarea",
        },
        {
          id: "acquisition",
          label: "Customer acquisition approach",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "State who might use or buy the product, where, and how you formed market assumptions.",
        reason:
          "Source-linked assumptions are easier to discuss than unsupported headline market sizes.",
        enter:
          "Separate user and buyer where useful; cite sources and explain bottom-up estimates.",
        example:
          "A count of target organizations multiplied by a documented annual price assumption.",
        mistakes:
          "Presenting an unsourced market figure as fact, or ignoring existing substitutes and acquisition costs.",
        question:
          "How should I explain a market-size estimate with limited data?",
      },
    },
    {
      title: founderTitles[5]!,
      intro:
        "Show how value could turn into revenue and what has been tested so far.",
      fields: [
        {
          id: "revenueStreams",
          label: "Revenue streams",
          type: "repeater",
          required: true,
        },
        { id: "pricing", label: "Pricing approach", type: "textarea" },
        {
          id: "salesChannels",
          label: "Sales channels",
          type: "multi",
          options: [
            "Direct sales",
            "Self-serve",
            "Partners",
            "Marketplace",
            "Other",
          ],
        },
        { id: "partnerships", label: "Relevant partners", type: "textarea" },
        {
          id: "modelValidation",
          label: "Validation of this model",
          type: "textarea",
          help: "Separate measured evidence from plans or hypotheses.",
        },
      ],
      help: {
        meaning:
          "Describe how the business may earn revenue and how customers would buy.",
        reason:
          "Investors need to distinguish a tested business model from an early hypothesis.",
        enter:
          "List revenue sources, price logic, sales channels, partners, and the evidence behind each.",
        example:
          "Subscription concept discussed with three target buyers; no contracts or revenue yet.",
        mistakes:
          "Describing pipeline as revenue or labeling a plan as proven validation.",
        question: "What does a credible early business model include?",
      },
    },
    {
      title: founderTitles[6]!,
      intro:
        "Record actual traction—or explicitly choose the pre-revenue path.",
      fields: [
        {
          id: "preRevenue",
          label: "We are pre-revenue and have no sales yet",
          type: "checkbox",
        },
        {
          id: "users",
          label: "Users or active trials",
          type: "number",
          min: 0,
          when: { field: "preRevenue", equals: false },
        },
        {
          id: "payingCustomers",
          label: "Paying customers",
          type: "number",
          min: 0,
          when: { field: "preRevenue", equals: false },
        },
        {
          id: "revenue",
          label: "Revenue for the stated period",
          type: "number",
          min: 0,
          when: { field: "preRevenue", equals: false },
        },
        {
          id: "growthPeriod",
          label: "Growth period and measurement method",
          type: "text",
          when: { field: "preRevenue", equals: false },
        },
        {
          id: "preRevenueEvidence",
          label: "What have you learned without sales?",
          type: "textarea",
          when: { field: "preRevenue", equals: true },
          help: "May describe interviews, tests, prototypes, or waitlists—with the method and limitations.",
        },
        {
          id: "retention",
          label: "Retention or repeat-use signal (if applicable)",
          type: "textarea",
        },
        {
          id: "tractionEvidence",
          label: "Supporting evidence",
          type: "upload",
          accept: ".pdf,.png,.jpg,.jpeg,.csv,.xlsx",
        },
      ],
      help: {
        meaning: "Share measured activity or tell us you have no sales yet.",
        reason:
          "Idea-stage and pre-revenue teams are valid; sales evidence is not a mandatory requirement for them.",
        enter:
          "Choose pre-revenue when appropriate. If reporting users, revenue, or growth, include a period and measurement definition.",
        example:
          "Pre-revenue; prototype tested with a small set of target users; method and sample size described.",
        mistakes:
          "Inventing revenue, mixing registered accounts with active users, or leaving out the measurement window.",
        question: "What if I have no sales yet?",
      },
    },
    {
      title: founderTitles[7]!,
      intro: "Describe the founder team, including a valid solo-founder path.",
      fields: [
        {
          id: "founderRole",
          label: "Your role and responsibilities",
          type: "text",
          required: true,
        },
        {
          id: "founderExperience",
          label: "Relevant experience",
          type: "textarea",
          required: true,
        },
        {
          id: "skills",
          label: "Team skills",
          type: "multi",
          options: [
            "Engineering",
            "Product",
            "Sales",
            "Operations",
            "Research",
            "Finance",
            "Design",
            "Other",
          ],
        },
        {
          id: "soloFounder",
          label: "I am currently a solo founder",
          type: "checkbox",
        },
        {
          id: "cofounders",
          label: "Co-founders and roles",
          type: "repeater",
          when: { field: "soloFounder", equals: false },
        },
        {
          id: "teamStructure",
          label: "Current hiring or capability gaps",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "Introduce the people responsible for the startup and the skills around them.",
        reason:
          "Investors often want to understand execution capacity and complementary expertise.",
        enter:
          "Describe your role, relevant experience, skill coverage, and any current gaps. A solo founder can continue without adding co-founders.",
        example:
          "Solo founder; product and customer discovery background; plans to seek technical support.",
        mistakes:
          "Adding a person without permission, or implying a co-founder has committed when they have not.",
        question: "Can I submit as a solo founder?",
      },
    },
    {
      title: founderTitles[8]!,
      intro:
        "Explain the amount, timing, and intended use of funding you are exploring.",
      fields: [
        {
          id: "fundingAmount",
          label: "Funding amount sought",
          type: "number",
          min: 0,
          required: true,
        },
        {
          id: "fundingCurrency",
          label: "Currency",
          type: "select",
          required: true,
          options: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "Other"],
        },
        {
          id: "fundingStage",
          label: "Funding stage",
          type: "select",
          required: true,
          options: ["Exploring", "Pre-seed", "Seed", "Growth", "Other"],
        },
        {
          id: "useOfFunds",
          label: "Planned use of funds",
          type: "repeater",
          required: true,
          help: "Use one row for each area and describe its milestone.",
        },
        {
          id: "priorFunding",
          label: "Prior funding or grants",
          type: "textarea",
        },
        {
          id: "instrument",
          label: "Instrument context (if known)",
          type: "select",
          options: [
            "Not decided",
            "Equity",
            "SAFE or similar",
            "Debt",
            "Grant",
            "Other",
          ],
        },
      ],
      help: {
        meaning:
          "Describe a funding target as a current planning request and show what it would support.",
        reason:
          "Use-of-funds detail makes the request easier to discuss; no transaction is made through this platform.",
        enter:
          "Choose a currency, indicate stage and break the request into costs and outcomes.",
        example:
          "Product validation and limited hiring over a stated planning period; amounts remain assumptions.",
        mistakes:
          "Treating the amount as a committed raise or promising a fixed return.",
        question: "How detailed should my use-of-funds plan be?",
      },
    },
    {
      title: founderTitles[9]!,
      intro:
        "Upload applicable company documents; unincorporated teams can mark them not applicable.",
      fields: [
        {
          id: "registrationStatus",
          label: "Registration-document status",
          type: "select",
          required: true,
          options: [
            "Not incorporated / not applicable",
            "Available to upload",
            "In progress",
            "Need guidance",
          ],
        },
        {
          id: "registrationDocs",
          label: "Registration and tax documents",
          type: "upload",
          accept: ".pdf,.png,.jpg,.jpeg",
          when: { field: "registrationStatus", equals: "Available to upload" },
        },
        {
          id: "ownershipDocs",
          label: "Ownership or authorization documents",
          type: "upload",
          accept: ".pdf,.png,.jpg,.jpeg",
        },
        {
          id: "legalContext",
          label: "Jurisdiction and document context",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "Provide registration, tax, ownership, and authorization evidence when it applies.",
        reason:
          "Document requirements depend on legal status and jurisdiction; idea-stage teams may have nothing to upload yet.",
        enter:
          "Select the current status and upload only authorized documents through private storage.",
        example:
          "Not incorporated; registration and tax-document fields are not applicable yet.",
        mistakes:
          "Uploading another person's private records or claiming a document is filed when it is still a draft.",
        question: "Which company documents do I need before incorporation?",
      },
    },
    {
      title: founderTitles[10]!,
      intro:
        "Share a pitch deck and financial or traction evidence you are authorized to provide.",
      fields: [
        {
          id: "pitchDeck",
          label: "Pitch deck (PDF)",
          type: "upload",
          accept: ".pdf",
          required: true,
          help: "PDF only · maximum 20 MB when storage is configured.",
        },
        {
          id: "financialSummary",
          label: "Financial statements or summary",
          type: "upload",
          accept: ".pdf,.csv,.xlsx",
        },
        {
          id: "salesEvidence",
          label: "Sales, traction, or customer evidence",
          type: "upload",
          accept: ".pdf,.png,.jpg,.jpeg,.csv,.xlsx",
        },
        {
          id: "evidenceNotes",
          label: "What each file supports",
          type: "textarea",
        },
      ],
      help: {
        meaning:
          "Attach materials that help explain the company and any stated financial or traction data.",
        reason:
          "Reviewers need context and source evidence, but idea-stage founders are not expected to invent sales records.",
        enter:
          "Provide a pitch deck if available and label each supporting file. Only upload materials you are allowed to share.",
        example:
          "Deck PDF plus a dated anonymized pilot summary; no sales evidence where there are no sales.",
        mistakes:
          "Uploading a deck that exposes third-party confidential material without permission or assuming selection is upload confirmation.",
        question:
          "What should an idea-stage founder upload instead of sales evidence?",
      },
    },
    {
      title: founderTitles[11]!,
      intro:
        "Review the extracted summary, missing items, and every document status before submission.",
      fields: [
        {
          id: "aiReviewSummary",
          label: "Draft summary to review",
          type: "summary",
        },
        {
          id: "missingFields",
          label: "Missing or inconsistent information to resolve",
          type: "textarea",
        },
        {
          id: "aiSuggestion",
          label: "Optional wording suggestion to review and edit",
          type: "textarea",
          help: "Suggestions never update your answers automatically.",
        },
        {
          id: "founderAccuracy",
          label: "I have reviewed this application and confirm its accuracy",
          type: "checkbox",
          required: true,
        },
        {
          id: "publicProfileSummary",
          label: "Public profile summary for startup discovery (optional)",
          type: "textarea",
          max: 900,
          help: "Write only what you want public. Do not include confidential, financial, customer, or personal information.",
        },
        {
          id: "publicProfileConsent",
          label:
            "I consent to showing the public-profile fields in discovery if an administrator separately approves publication",
          type: "checkbox",
          help: "Optional. Leaving this unchecked keeps the startup private and does not prevent application submission.",
        },
      ],
      help: {
        meaning:
          "Review a readable startup summary and resolve missing details before submission.",
        reason:
          "AI may point out gaps or suggest language, but you decide what to change. It never submits or verifies facts.",
        enter:
          "Compare the summary with your source information, correct inaccuracies, and affirm the final application deliberately.",
        example:
          "Replace a suggested statement with the exact evidence you can support—or remove it.",
        mistakes:
          "Accepting an AI suggestion without review, or treating a generated summary as an independent verification.",
        question: "How should I review an AI-generated summary?",
      },
    },
  ]),
};
export function getStep(role: string, index: number): StepSpec | undefined {
  if (role !== "investor" && role !== "founder") return;
  return ONBOARDING_STEPS[role][index - 1];
}
