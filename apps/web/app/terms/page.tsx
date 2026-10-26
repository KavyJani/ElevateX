export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <article className="container max-w-4xl py-14 sm:py-20">
      <p className="eyebrow">Terms · draft for review</p>
      <h1 className="display mt-3 text-5xl">
        A starting point for clear expectations.
      </h1>
      <p className="mt-5 text-sm leading-7 text-muted">
        This is illustrative product copy, not a binding agreement or legal
        advice. A qualified lawyer must tailor it to the operator, countries
        served, eligibility rules, dispute forum and applicable laws before
        public launch.
      </p>
      <div className="prose-elevatex mt-10">
        <h2>Service scope</h2>
        <p>
          ElevateX is designed for startup discovery, application review,
          introductions and planning tools. It does not execute investments,
          hold or transfer funds, custody assets, broker securities or guarantee
          that a connection, review or transaction will occur. Public profile
          visibility does not constitute an offer or recommendation.
        </p>
        <h2>Accurate and authorized submissions</h2>
        <p>
          Account holders should provide accurate information, update material
          changes and submit only records they may lawfully share. Do not submit
          bank passwords or PINs. AI-generated wording is a draft requiring
          human review; it is not verification and never makes platform
          decisions.
        </p>
        <h2>Profiles and introductions</h2>
        <p>
          Public startup profiles are shown only after founder consent and
          administrator approval. A profile may be reviewed, withheld or
          removed. Investor interest, introductions and messages do not form an
          investment commitment, partnership or advisory relationship.
        </p>
        <h2>Financial tools</h2>
        <p>
          Scenarios depend on user-supplied assumptions and may be incomplete or
          inaccurate. They are not investment, legal, tax, accounting or
          financial advice, do not establish company value and do not predict
          future performance. Users should obtain qualified advice and verify
          source data independently.
        </p>
        <h2>Service availability and conduct</h2>
        <p>
          Features depend on configured database, storage, email and AI
          services. Unavailable actions will not be described as completed.
          Users must not misuse accounts, evade authorization, upload malware,
          disclose another person’s confidential information without consent or
          interfere with service security.
        </p>
        <h2>Operator details</h2>
        <p>
          Replace this draft with the legal entity’s name, address, governing
          law, age/eligibility provisions, acceptable-use terms, dispute
          process, liability language, termination process and effective date
          following qualified review.
        </p>
      </div>
    </article>
  );
}
