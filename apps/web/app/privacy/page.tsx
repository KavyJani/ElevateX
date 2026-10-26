export const metadata = { title: "Privacy information" };

export default function PrivacyPage() {
  return (
    <article className="container max-w-4xl py-14 sm:py-20">
      <p className="eyebrow">Privacy · draft for review</p>
      <h1 className="display mt-3 text-5xl">
        Your information has boundaries.
      </h1>
      <p className="mt-5 text-sm leading-7 text-muted">
        This is a product information draft, not a final legal privacy notice.
        The operator must identify the data controller, contact channel,
        jurisdiction, retention periods, processors and lawful bases before
        inviting real users.
      </p>
      <div className="prose-elevatex mt-10">
        <h2>Information that may be processed</h2>
        <p>
          Account details, verification state, founder or investor application
          answers, selected private financial records, submitted documents,
          saved public profiles, connection requests, messages, meeting
          requests, notification state and security/audit events may be stored
          when the corresponding database and provider are configured.
        </p>
        <h2>Why it is used</h2>
        <p>
          Information is used to provide account access, persist onboarding,
          evaluate applications, display approved public profiles, authorize
          connections, exchange messages, request meetings, support customer
          contact and protect the service. AI assistance is advisory; provide
          only information that is authorized for the selected provider and
          avoid sharing confidential information unless you have permission.
        </p>
        <h2>Visibility and sharing</h2>
        <p>
          Application records and financial records are private to the account
          and authorized reviewers. Founder information is not public by
          default. A separate optional public summary and explicit consent are
          required before an administrator may approve a startup listing.
          Document access requires an explicit owner grant and application
          connection policy; an accepted connection alone does not reveal files.
          Public profiles contain selected fields only.
        </p>
        <h2>Service providers and storage</h2>
        <p>
          Configured email, private object storage, database and AI providers
          may process information needed to provide their respective functions.
          Provider configuration and appropriate contracts are the operator’s
          responsibility. The application can revoke database grants, but the
          current storage integration cannot guarantee physical object deletion
          or retention enforcement without a provider-supported deletion
          contract.
        </p>
        <h2>Security, retention and choices</h2>
        <p>
          The product uses server-side authorization, password hashing,
          revocable sessions, CSRF controls, request throttles and audit events.
          No system can promise absolute security. Users should not submit bank
          passwords, PINs or third-party confidential materials without
          authority. Exact data access, correction, deletion, retention, backup,
          breach notification and regulator rights depend on the operator’s
          jurisdiction-specific policy and must be completed before production
          use.
        </p>
        <h2>Contact</h2>
        <p>
          Use the contact page only after its delivery provider is configured.
          Replace this paragraph with the responsible organization’s verified
          privacy contact before launch.
        </p>
      </div>
    </article>
  );
}
