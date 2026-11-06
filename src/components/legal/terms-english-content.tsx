import Link from "next/link";
import { EMAIL_PRIMARY, emailHref } from "@/lib/contact-info";
import { pricingPath, privacyPath, refundsPath } from "@/lib/routes";

/**
 * The English terms. What Paddle's domain review looks for is all here, so keep it when changing them: the legal seller,
 * acceptance, Paddle as reseller and merchant of record (clause 2.1), misuse rules, generative-AI rules with a takedown
 * route (section 3), suspension, the service level, IP and a contact. Nothing here may read "no refunds": refunds live in
 * the Refund Policy (`refunds-english-content.tsx`), which only points at Paddle's own.
 */
const PADDLE_AUP = "https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle";

export function TermsEnglishContent() {
  return (
    <>
      <p className="not-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
        These Terms and Conditions govern the relationship between DT A I, a company registered in Bulgaria and trading as &ldquo;Keplerbay&rdquo;
        (hereinafter referred to as the &ldquo;Contractor&rdquo;) and clients (hereinafter referred
        to as the &ldquo;Client&rdquo;), in connection with the provision of services for generating
        and editing video content using artificial intelligence (AI). The Client contracts with DT A I for these services. By
        creating an account, placing an order or continuing to use the website and the service, the Client agrees to these
        Terms.
      </p>

      <h2>1. Work Process and Approvals</h2>
      <p>
        <strong>1.1. Orders:</strong>{" "}The Client orders a one-time video or a subscription at the prices published on the{" "}
        <Link href={pricingPath("en")}>pricing page</Link>, or agrees a custom quote with the Contractor.
      </p>
      <p>
        <strong>1.2. Script and visualization:</strong>{" "}Scriptwriting is included in the plans that list it and is otherwise
        available as an add-on. Without it, the Client provides the script or voiceover text.
      </p>
      <p>
        <strong>1.3. Providing images:</strong>{" "}At their discretion, the Contractor may send initial
        static images for style confirmation. The Contractor is not obliged to send intermediate
        images for approval unless this has been explicitly agreed upon in writing before the start
        of the work.
      </p>
      <p>
        <strong>1.4. Revisions:</strong>{" "}Each plan includes the number of revisions shown on the pricing page. One revision is
        one round of changes per video, covering up to 30% of the video&apos;s length. Fixes for mistakes on the
        Contractor&apos;s side are free and do not count as revisions. Any additional changes are charged separately due to
        the direct technological costs of a new AI generation.
      </p>

      <h2>2. Prices, Payment and Subscriptions</h2>
      <p>
        <strong>2.1. Online orders:</strong>{" "}Our order process is conducted by our online reseller Paddle.com. Paddle.com is
        the Merchant of Record for all our online orders - packs, subscriptions, paid project changes and invoices sent
        through our website. Paddle provides all customer service inquiries and handles returns, and its{" "}
        <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">Buyer Terms</a>{" "}
        apply to the purchase.
      </p>
      <p>
        <strong>2.2. Prices and tax:</strong>{" "}Prices are in US dollars and are shown before tax. Paddle adds any sales tax or
        VAT due at checkout.
      </p>
      <p>
        <strong>2.3. Payment:</strong>{" "}Online orders are paid at checkout. A custom quote is billed through a Paddle invoice,
        payable by the date shown on it.
      </p>
      <p>
        <strong>2.4. Video time:</strong>{" "}Seconds of video are added to the Client&apos;s account once the payment is
        collected, and a project&apos;s length is taken from that balance when the project is submitted. Unused video time
        ends when the account is deleted.
      </p>
      <p>
        <strong>2.5. Subscriptions:</strong>{" "}A subscription is billed monthly or annually, as chosen at checkout, and renews
        automatically until it is cancelled. The Client can cancel at any time from their account, or ask the Contractor to
        pause or cancel it. After a cancellation the plan and its video time stay available until the end of the paid period,
        and no further payment is taken.
      </p>
      <p>
        <strong>2.6. Refunds:</strong>{" "}Refunds are covered by our <Link href={refundsPath("en")}>Refund Policy</Link>.
      </p>

      <h2>3. Acceptable Use and AI Content</h2>
      <p>
        <strong>3.1. Prohibited use:</strong>{" "}The Client must not use the website or the service:
      </p>
      <ul>
        <li>for anything unlawful, or for fraud, spam or deceiving other people;</li>
        <li>to infringe copyright, trademarks or any other right of a third party;</li>
        <li>to interfere with the security of the service, including malware, probing for weaknesses or scraping.</li>
      </ul>
      <p>
        <strong>3.2. Prohibited content:</strong>{" "}The Contractor does not create, and the Client must not request:
      </p>
      <ul>
        <li>deepfakes, face swaps or voice impersonation;</li>
        <li>content using a real person&apos;s face, voice or likeness without that person&apos;s explicit consent;</li>
        <li>illegal, hateful, sexual or otherwise harmful content;</li>
        <li>
          content that falls outside{" "}
          <a href={PADDLE_AUP} target="_blank" rel="noopener noreferrer">Paddle&apos;s Acceptable Use Policy</a>.
        </li>
      </ul>
      <p>
        <strong>3.3. The Client&apos;s materials:</strong>{" "}The Client is responsible for their briefs, scripts, images, logos,
        voices and other materials, and confirms that they hold the rights and consents needed to use them.
      </p>
      <p>
        <strong>3.4. Review of content:</strong>{" "}The Contractor may review briefs, materials and outputs, and may refuse or
        remove content that breaks these Terms.
      </p>
      <p>
        <strong>3.5. Accuracy and publishing:</strong>{" "}AI output can contain errors. The Client checks each video before
        publishing it and is responsible for how it is used, including the claims it makes and any AI disclosure that a law or
        platform requires. Videos are not professional, legal, medical or financial advice.
      </p>
      <p>
        <strong>3.6. Infringement reports:</strong>{" "}Anyone who believes a video made by the Contractor infringes their rights
        can write to <a href={emailHref("Infringement report")}>{EMAIL_PRIMARY.label}</a> with the video, the right concerned and their
        contact details. The Contractor reviews each report and removes content where it is justified. Accounts that infringe
        repeatedly are closed.
      </p>

      <h2>4. Right of Refusal and Termination</h2>
      <p>
        <strong>4.1. Unilateral termination:</strong>{" "}The Contractor reserves the right to refuse to
        execute an order, suspend an account or terminate an ongoing project at any time in case of:
      </p>
      <ul>
        <li>A material breach of these Terms, or repeated or serious violations of them;</li>
        <li>Non-payment;</li>
        <li>A security or fraud risk;</li>
        <li>Unclear or systematically difficult communication from the Client;</li>
        <li>Manifestations of malicious intent, offensive behavior, or lack of professional ethics;</li>
        <li>Attempts to generate illegal, unethical, or harmful content using AI.</li>
      </ul>
      <p>
        <strong>4.2. Refunds on termination:</strong>{" "}Any refund in these cases follows our{" "}
        <Link href={refundsPath("en")}>Refund Policy</Link>.
      </p>

      <h2>5. Specifics of AI Technology and Deadlines</h2>
      <p>
        <strong>5.1. Technological limitations:</strong>{" "}AI technology is in an early stage. The
        Contractor aims for the highest possible quality but is not responsible for technical
        limitations of the models (bugs, artifacts). The Contractor (video engineer) has the right
        to modify scenes during the process to ensure the optimal visual result.
      </p>
      <p>
        <strong>5.2. Deadlines:</strong>{" "}Videos are usually delivered in 3 to 10 days, depending on complexity and length. The
        Contractor is not responsible for delays caused by technical problems with external AI
        servers.
      </p>
      <p>
        <strong>5.3. Availability:</strong>{" "}The Contractor does not guarantee that the website and the service will be
        uninterrupted or error-free.
      </p>

      <h2>6. Copyright and Portfolio</h2>
      <p>
        <strong>6.1. The Client&apos;s videos:</strong>{" "}After full payment, and to the extent the law allows, the Client owns
        the delivered videos and source files. Individual plans are for personal and creator use. Advertising a business
        requires a Business plan, which includes full commercial use.
      </p>
      <p>
        <strong>6.2. The service:</strong>{" "}The Contractor keeps all rights in the website, the software and the service.
      </p>
      <p>
        <strong>6.3. Portfolio:</strong>{" "}The Contractor reserves the right to use parts of the final video or
        working materials in their portfolio unless explicit confidentiality has been agreed upon.
      </p>

      <h2>7. Changes and Contact</h2>
      <p>
        <strong>7.1. Changes:</strong>{" "}When these Terms change, the &ldquo;Last updated&rdquo; date above changes too.
      </p>
      <p>
        <strong>7.2. Contact:</strong>{" "}Questions about these Terms: <a href={emailHref()}>{EMAIL_PRIMARY.label}</a>. See also our{" "}
        <Link href={privacyPath("en")}>Privacy Policy</Link>.
      </p>
    </>
  );
}
