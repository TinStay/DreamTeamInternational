import Link from "next/link";
import { EMAIL_PRIMARY, emailHref } from "@/lib/contact-info";
import { pricingPath, privacyPath, refundsPath } from "@/lib/routes";

/**
 * The English terms. DT A I is the seller of every order and Stripe only processes the payments. Refunds live in the Refund Policy (`refunds-english-content.tsx`). The site sells to the US
 * first, so the terms carry what US law and practice expect: the automatic-renewal disclosure (ROSCA, California's ARL -
 * clause 2.5), the warranty disclaimer and liability cap in capitals (section 7), the note that fully AI-generated work may
 * not be copyrightable in the US (6.1), the AI-performer disclosure and the FTC rules on testimonials (3.6), a DMCA route
 * (3.7) and the governing law (7.4).
 */

export function TermsEnglishContent() {
  return (
    <>
      <p className="not-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
        These Terms and Conditions govern the relationship between DT A I Ltd., a company registered in Bulgaria (UIC 208668338,
        VAT number BG208668338) with its office at 27-29 Nikolay Kopernik Street, floor 2, office 17, Sofia 1574, and trading as
        &ldquo;Keplerbay&rdquo;
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
        <strong>2.1. Online orders:</strong>{" "}The Contractor is the seller of every order placed through the website: packs,
        subscriptions, paid project changes and invoices. Card payments are processed by Stripe. The Contractor does not
        see or store full card numbers.
      </p>
      <p>
        <strong>2.2. Prices and tax:</strong>{" "}Prices are in US dollars and are shown before tax. Any sales tax or VAT due is
        added at checkout.
      </p>
      <p>
        <strong>2.3. Payment:</strong>{" "}Online orders are paid at checkout. A custom quote is billed by invoice, payable by the
        date shown on it.
      </p>
      <p>
        <strong>2.4. Video time:</strong>{" "}Seconds of video are added to the Client&apos;s account once the payment is
        collected, and a project&apos;s length is taken from that balance when the project is submitted. Unused video time
        ends when the account is deleted.
      </p>
      <p>
        <strong>2.5. Subscriptions and automatic renewal:</strong>{" "}A subscription is billed monthly or annually, as
        chosen at checkout. It renews automatically at the end of each billing period, and the payment method on file is
        charged the price shown at checkout for the next period, until the Client cancels. The price, the billing period and
        the renewal are shown before the Client confirms the purchase, and a receipt confirms them by email. The
        Client can cancel at any time online, from their account, or by writing to{" "}
        <a href={emailHref("Cancel my subscription")}>{EMAIL_PRIMARY.label}</a>; cancelling takes effect at the end of the
        paid period, the plan and its video time stay available until then, and no further payment is taken. A reminder is
        emailed before an annual plan renews. Price changes are announced by email at least 30 days before they
        apply to a renewal.
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
        publishing it and is responsible for how it is used, including the claims it makes. Videos are not professional,
        legal, medical or financial advice.
      </p>
      <p>
        <strong>3.6. AI disclosures and advertising rules:</strong>{" "}Some laws and platforms require advertisements to
        disclose AI-generated people, voices or scenes - for example New York requires a conspicuous disclosure when an
        advertisement uses a synthetic performer. The Client is responsible for those disclosures where their videos are
        shown, and for complying with advertising law, including the rules of the US Federal Trade Commission. In
        particular, a creator-style (UGC) video with an AI-generated person must not be presented as the genuine experience or
        opinion of a real customer.
      </p>
      <p>
        <strong>3.7. Infringement reports (DMCA):</strong>{" "}Anyone who believes a video made by the Contractor infringes their rights
        can write to <a href={emailHref("Infringement report")}>{EMAIL_PRIMARY.label}</a> with the video, the right concerned and their
        contact details - a notice under the US Digital Millennium Copyright Act goes to the same address. The Contractor
        reviews each report and removes content where it is justified. Accounts that infringe repeatedly are closed.
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
        <strong>6.1. The Client&apos;s videos:</strong>{" "}After full payment, the Contractor assigns to the Client all rights
        it holds in the delivered videos and source files, and the Client may use them for any lawful purpose their plan
        allows. Individual plans are for personal and creator use. Advertising a business
        requires a Business plan, which includes full commercial use. The Client should know that copyright law in the
        United States and some other countries protects only what a person created: parts of a video generated entirely by
        AI may not be protected by copyright, and the Contractor does not promise that a video can be registered or
        enforced against others. Elements of the video may use AI models, stock material or fonts under their own licences,
        which the Contractor chooses so that the Client&apos;s use under their plan is allowed.
      </p>
      <p>
        <strong>6.2. The service:</strong>{" "}The Contractor keeps all rights in the website, the software and the service.
      </p>
      <p>
        <strong>6.3. Portfolio:</strong>{" "}The Contractor reserves the right to use parts of the final video or
        working materials in their portfolio unless explicit confidentiality has been agreed upon.
      </p>

      <h2>7. Warranties, Liability and Governing Law</h2>
      <p>
        <strong>7.1. No other warranties:</strong>{" "}EXCEPT AS STATED IN THESE TERMS, THE SERVICE AND THE VIDEOS ARE PROVIDED
        &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;, AND THE CONTRACTOR DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED,
        INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT, AND ANY WARRANTY THAT A VIDEO WILL
        ACHIEVE PARTICULAR VIEWS, SALES OR OTHER RESULTS.
      </p>
      <p>
        <strong>7.2. Limitation of liability:</strong>{" "}TO THE FULLEST EXTENT THE LAW ALLOWS, THE CONTRACTOR IS NOT LIABLE
        FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE OR DATA, ARISING OUT
        OF THESE TERMS OR THE SERVICE, AND ITS TOTAL LIABILITY FOR ALL CLAIMS IS LIMITED TO THE AMOUNT THE CLIENT PAID FOR
        THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM. Nothing in these Terms limits liability that cannot be limited by
        law, or the rights a consumer has under the law of their state or country.
      </p>
      <p>
        <strong>7.3. The Client&apos;s responsibility:</strong>{" "}The Client will defend and compensate the Contractor for
        claims by others that arise from the Client&apos;s materials, from instructions the Client gave, or from the
        Client&apos;s use of a video in breach of these Terms or the law.
      </p>
      <p>
        <strong>7.4. Governing law and disputes:</strong>{" "}These Terms are governed by the law of Bulgaria, and disputes are
        heard by the courts of Sofia, Bulgaria. If the Client is a consumer, they keep the protection of the mandatory
        consumer law of the place where they live, and may bring a claim there. The Client and the Contractor will first try
        to settle any dispute by writing to each other.
      </p>
      <p>
        <strong>7.5. Age and accounts:</strong>{" "}The Client must be at least 18 years old to create an account or place an
        order, and is responsible for keeping their sign-in details safe and for what is done through their account.
      </p>

      <h2>8. Changes and Contact</h2>
      <p>
        <strong>8.1. Changes:</strong>{" "}When these Terms change, the &ldquo;Last updated&rdquo; date above changes too.
        Account holders are told by email about material changes before they take effect.
      </p>
      <p>
        <strong>8.2. Contact:</strong>{" "}Questions about these Terms: <a href={emailHref()}>{EMAIL_PRIMARY.label}</a>. See also our{" "}
        <Link href={privacyPath("en")}>Privacy Policy</Link>.
      </p>
    </>
  );
}
