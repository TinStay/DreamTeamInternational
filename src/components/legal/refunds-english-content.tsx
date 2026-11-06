import Link from "next/link";
import { EMAIL_PRIMARY, emailHref } from "@/lib/contact-info";
import { termsPath } from "@/lib/routes";

/**
 * The English refund policy. Paddle's domain review accepts either a link to Paddle's own refund policy or a change-of-mind
 * window of 14 to 90 days, and refuses "no refunds", "all sales are final" and anything shorter. This one takes the link:
 * Paddle sells to the client, so its policy decides, and a promise made here that is more generous would bind us. Keep the
 * link, the route through paddle.net and the merchant-of-record line.
 */
const PADDLE_REFUNDS = "https://www.paddle.com/legal/refund-policy";

function Mail() {
  return <a href={emailHref("Refund question")}>{EMAIL_PRIMARY.label}</a>;
}

export function RefundsEnglishContent() {
  return (
    <>
      <p className="not-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
        This policy explains how refunds work for orders placed with Keplerbay, the trading name of DT A I. Our online orders
        are sold by Paddle.com, our reseller and the Merchant of Record, so refunds are handled by Paddle under{" "}
        <a href={PADDLE_REFUNDS} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
          Paddle&apos;s Refund Policy
        </a>
        , which applies to every online order.
      </p>

      <h2>1. How to request a refund</h2>
      <p>
        Go to <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>{" "}
        and select &ldquo;Request refund&rdquo;, or use the link on your receipt. You can also write to us at <Mail /> and we will help you. Approved
        refunds generally reach your original payment method within 14 days.
      </p>

      <h2>2. Your legal rights</h2>
      <p>
        Consumers in the EU, the EEA, the UK and some other countries have a legal right to withdraw from a purchase, usually
        within 14 days. Paddle&apos;s Refund Policy lists these rights and when they end. Paddle may also refund other requests
        made within 14 days of the transaction. Nothing in this policy limits the rights you have by law.
      </p>

      <h2>3. If something is wrong with your video</h2>
      <p>
        Tell us first, in your project&apos;s comments or at <Mail />. Fixes for mistakes on our side are always free and do
        not use a revision. If we cannot deliver what you ordered because of a technical issue, you are entitled to a
        replacement or a refund.
      </p>

      <h2>4. Subscriptions</h2>
      <p>
        You can cancel a subscription at any time from your account. No further payment is taken, and your plan and its video
        time stay available until the end of the paid period. Cancelling does not request a refund by itself: to ask for one,
        follow section 1.
      </p>

      <h2>5. Video time and paid changes</h2>
      <ul>
        <li>When an order is refunded, your access to what it bought ends, including its video time.</li>
        <li>If we decline a paid change request on a project, its payment is refunded.</li>
        <li>Seconds spent on a change request are returned to your balance if we decline it or you withdraw it.</li>
      </ul>

      <h2>6. Contact</h2>
      <p>
        Questions about this policy: <Mail />. Our <Link href={termsPath("en")}>Terms and Conditions</Link> cover the rest of
        how we work.
      </p>
    </>
  );
}
