export const metadata = { title: "Risk disclosure" };

export default function RiskDisclosurePage() {
  return (
    <article className="container max-w-4xl py-14 sm:py-20">
      <p className="eyebrow">Risk information · draft for review</p>
      <h1 className="display mt-3 text-5xl">
        Early-stage investing can lose everything.
      </h1>
      <p className="mt-5 text-sm leading-7 text-muted">
        This general educational disclosure is not investment advice, a
        solicitation, legal advice or a substitute for locally required
        securities disclosures. Qualified counsel must review it for each
        operating jurisdiction.
      </p>
      <div className="prose-elevatex mt-10">
        <h2>Capital at risk</h2>
        <p>
          Startup investments may be highly speculative. Investors may lose some
          or all of their capital, receive no distributions, hold an illiquid
          position for an indefinite period and have limited ability to resell
          or influence outcomes. Company failure, dilution, competitive changes,
          governance issues, regulatory events and inaccurate or incomplete
          information may materially affect value.
        </p>
        <h2>Information limits</h2>
        <p>
          Profiles, application details and materials may be supplied by
          founders and can be incomplete, outdated or unverified. Platform
          review is not an audit, background check or guarantee. Users are
          responsible for independent due diligence and for seeking qualified
          legal, tax, accounting and financial advice.
        </p>
        <h2>Forecast uncertainty</h2>
        <p>
          Scenario charts are deterministic calculations from user-provided
          assumptions. Actual outcomes can differ materially; small changes in
          growth, costs, cash timing or customer retention can change the
          result. A projected revenue line is not a valuation, return estimate,
          promise, forecast assurance or probability of success.
        </p>
        <h2>No transaction execution</h2>
        <p>
          The current product does not custody assets, receive investment funds,
          execute trades, transfer money or arrange a securities transaction.
          Nothing on this site should be read as an offer to sell or a
          solicitation to buy a security.
        </p>
        <h2>Illustrative examples</h2>
        <p>
          Any sample startup, story or example record marked demo is fictional
          and illustrative. It is not evidence of real customers, investment
          activity, returns, endorsements or platform outcomes.
        </p>
      </div>
    </article>
  );
}
