import Link from "next/link";
import { EMAIL_PRIMARY, emailHref } from "@/lib/contact-info";
import { termsPath } from "@/lib/routes";

/**
 * The English refund policy. DT A I is the seller, so this is our own promise: 14 days on video time not yet used, free fixes, a refund when we cannot deliver, and the legal
 * withdrawal right of EU and UK consumers. Refunds are made by hand in Stripe, and the video time is taken back with an
 * adjustment in the team's Clients tab.
 */
function Mail() {
  return <a href={emailHref("Refund request")}>{EMAIL_PRIMARY.label}</a>;
}

export function RefundsEnglishContent() {
  return (
    <>
      <p className="not-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
        This policy explains how refunds work for orders placed with Keplerbay, the trading name of DT A I. DT A I is the
        seller of every order, and card payments are processed by Stripe.
      </p>

      <h2>1. Changed your mind</h2>
      <p>
        You can ask for a full refund within 14 days of a purchase, for any video time from that purchase you have not used.
        You do not need to give a reason. To ask, write to <Mail /> from the email address on your account.
      </p>

      <h2>2. Once work has started</h2>
      <p>
        Your videos are made to your brief, and the AI generation and production costs start with the work. Video time used on
        a project that has started production is therefore not refunded, except as described in sections 3 and 4.
      </p>

      <h2>3. If something is wrong with your video</h2>
      <p>
        Tell us first, in your project&apos;s comments or at <Mail />. Fixes for mistakes on our side are always free and do
        not use a revision. If we cannot deliver what you ordered, you are entitled to a replacement or a refund for that
        project.
      </p>

      <h2>4. Your legal rights</h2>
      <p>
        Consumers in the EU and the UK have a legal right to withdraw from an online purchase within 14 days, without giving a
        reason. By paying, you ask us to start work during that period. If you withdraw after a project has started, you pay
        for the part of the work already done, and the right ends once the video has been fully delivered.
      </p>
      <p>
        Nothing in this policy limits the rights you have under the law of your state or country.
      </p>

      <h2>5. Subscriptions</h2>
      <p>
        A subscription renews automatically until you cancel it. You can cancel at any time from your account, or by writing to
        us at <Mail />. No further payment is taken, and your plan and its video time stay available until the end of the paid
        period. Cancelling does not request a refund by itself, and a period already paid for is not refunded in part, except
        as described in sections 1, 3 and 4.
      </p>

      <h2>6. How refunds are paid</h2>
      <ul>
        <li>A refund goes back to your original payment method, including any tax you paid on it.</li>
        <li>It usually reaches you within 5 to 10 business days, depending on your bank.</li>
        <li>When an order is refunded, the video time it bought is removed from your account.</li>
        <li>If we decline a paid change request on a project, its payment is refunded.</li>
        <li>Seconds spent on a change request are returned to your balance if we decline it or you withdraw it.</li>
      </ul>

      <h2>7. Chargebacks</h2>
      <p>
        Please write to us before disputing a charge with your bank. A refund request is usually resolved faster, and a
        chargeback can suspend your account while it is reviewed.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about this policy: <Mail />. Our <Link href={termsPath("en")}>Terms and Conditions</Link> cover the rest of
        how we work.
      </p>
    </>
  );
}
