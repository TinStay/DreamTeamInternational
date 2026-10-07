/**
 * The English privacy policy, written to the US standard (the California CCPA / CPRA and the other state privacy laws -
 * Colorado, Connecticut, Virginia, Utah, Texas, Oregon and the rest: categories collected, sources, purposes, who it is
 * disclosed to, "sale" / "sharing", the rights and how to use them, Global Privacy Control, retention, children) while
 * keeping the EU GDPR rights, since DreamTeam is based in Bulgaria. Every vendor, cookie and duration here must match
 * the code - `lib/consent.ts`, the banner copy (`consent.categories.*`) and `PROJECT_GUIDE.md`'s consent row.
 */
const MAIL = "info@dreamteam.technology";

function Mail({ subject }: { subject?: string }) {
  return <a href={`mailto:${MAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}>{MAIL}</a>;
}

export function PrivacyEnglishContent() {
  return (
    <>
      <p className="not-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
        This Privacy Policy explains how DreamTeam (&ldquo;DreamTeam&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses,
        shares and protects personal information when you visit{" "}
        <a href="https://www.dreamteamvideo.com" className="text-primary underline-offset-4 hover:underline">
          https://www.dreamteamvideo.com
        </a>{" "}
        or use our AI video service, including your account, video packs and subscriptions, and your projects (together, the
        &ldquo;Service&rdquo;). It describes the rights you have under US state privacy laws, including the California
        Consumer Privacy Act as amended by the California Privacy Rights Act (&ldquo;CCPA&rdquo;), and under the EU General
        Data Protection Regulation (&ldquo;GDPR&rdquo;).
      </p>

      <h2>1. Who we are</h2>
      <ul>
        <li>
          <strong>Company:</strong> DreamTeam, an AI video production company based in Sofia, Bulgaria
        </li>
        <li>
<<<<<<< Updated upstream
          <strong>Contact email:</strong>{" "}
          <a href="mailto:info@dreamteam.technology">info@dreamteam.technology</a>
        </li>
        <li>
          <strong>Activity:</strong> Company creating video content using artificial intelligence.
        </li>
      </ul>

      <h2>2. Data We Collect</h2>
      <p>Our website is informational in nature; the data we process through it is:</p>
      <p>
        <strong>Contact Data:</strong> When you send us an inquiry through a contact or quote form,
        we collect your name, email address, phone number and what you write to us (including any
        files you attach), and we receive it by email in order to reply.
      </p>
      <p>
        <strong>Cookies and similar technologies:</strong> By itself the website stores only what it
        needs to work: your language and theme and your cookie choice (the <code>dt_consent</code>{" "}
        cookie, kept for six months). Everything else runs only after you agree in the cookie banner,
        and you can change or withdraw your choice at any time from &ldquo;Cookie settings&rdquo; in
        the footer:
      </p>
      <ul>
        <li>
          <strong>Analytics (PostHog, servers in the EU):</strong> How the site is used &mdash; pages
          visited, clicks and session recordings &mdash; so we can improve it. Cookie{" "}
          <code>ph_*</code>, 1 year.
        </li>
        <li>
          <strong>Marketing (Google Ads, OpenAI):</strong> Whether our advertisements lead to
          inquiries, and audiences for remarketing. Cookies <code>_gcl_au</code> (90 days) and{" "}
          <code>__obref</code> (1 year).
        </li>
        <li>
          <strong>Embedded videos:</strong> YouTube videos load in privacy-enhanced mode and set
          YouTube&rsquo;s cookies only when you play them; videos hosted on Bunny Stream set no
          advertising cookies.
=======
          <strong>Privacy and support contact:</strong> <Mail />
>>>>>>> Stashed changes
        </li>
      </ul>
      <p>
        For the GDPR, DreamTeam is the controller of your personal information. For the CCPA, DreamTeam is the business
        responsible for it.
      </p>

      <h2>2. Personal information we collect</h2>
      <p>
        In the last 12 months we have collected the categories below. For each one we list where it comes from and what we
        use it for.
      </p>
      <ul>
        <li>
<<<<<<< Updated upstream
          <strong>Service Providers:</strong> Vercel (hosting and cookieless analytics), Resend
          (delivery of your inquiries to our email), PostHog (analytics, EU), Google and OpenAI
          (advertising measurement &mdash; only with your consent), Bunny Stream and YouTube (video
          hosting).
=======
          <strong>Identifiers and contact details:</strong> your name, email address and phone number, your account ID, and
          your IP address. These come from you (when you sign up, contact us or send a quote request), from Google or
          Microsoft if you use them to sign in (they share your name and email), and automatically from your browser.
>>>>>>> Stashed changes
        </li>
        <li>
          <strong>Account records:</strong> when you signed up, how you sign in, and your confirmation that you accepted our
          Terms of Use, read this Privacy Policy and are at least 18 years old.
        </li>
        <li>
          <strong>Commercial information:</strong> the packs and subscriptions you buy, your plan and its status, your
          balance of video seconds and how it changed, and your payment history. Payments are processed by{" "}
          <strong>Stripe</strong>. We never see or store your full card or bank account number. Stripe tells us whether a
          payment succeeded, and we keep the transaction reference and the plan you bought.
        </li>
        <li>
          <strong>Content you give us:</strong> your project briefs and answers, the scripts, images, videos, audio and other
          files you upload, your comments and revision requests, and the videos and files we deliver to you.
        </li>
        <li>
          <strong>Internet and device activity:</strong> pages visited, clicks and similar usage data, plus browser and
          device type. This is collected only with your consent, except for cookieless visit counts (see section 6) and the
          security logs our hosting provider keeps.
        </li>
        <li>
          <strong>Approximate location:</strong> the country our hosting provider derives from your IP address. We use it
          only to show the site in the right language. We do not collect precise geolocation.
        </li>
      </ul>
      <p>
        <strong>Sensitive personal information.</strong> We do not ask for sensitive personal information, such as
        government ID numbers, health data or precise location. We do not use any for inferring characteristics about you.
        Please do not put it in briefs or files unless your project needs it.
      </p>

      <h2>3. How we use it</h2>
      <ul>
        <li>To create and run your account and sign you in.</li>
        <li>To sell you packs and subscriptions, take payment through Stripe, and add your video seconds once the payment is collected.</li>
        <li>To produce, review and deliver your videos, and to manage your projects, revisions and comments.</li>
        <li>To reply to your inquiries and give you support.</li>
        <li>To send you service messages, such as order, project and account notices.</li>
        <li>To keep the Service secure and to prevent fraud and abuse.</li>
        <li>With your consent only: to understand how the site is used (analytics) and to measure our advertising (marketing).</li>
        <li>To comply with the law, including tax and accounting rules, and to enforce our Terms.</li>
      </ul>
      <p>
        <strong>AI and your materials.</strong> We use your briefs and files only to make your project. To produce your
        video, they may be processed by the AI tools we work with, on our instructions and only for that purpose. We do not
        use your materials to train AI models unless you agree to it in writing.
      </p>

      <h2>4. Who we share it with</h2>
      <p>We disclose personal information only to:</p>
      <ul>
        <li>
          <strong>Service providers</strong> that work for us under contract and may use it only to provide their services
          to us:
          <ul>
            <li>Vercel: hosting, and cookieless visit counts.</li>
            <li>Supabase: accounts, sign-in, our database, and private file storage for your projects and deliveries.</li>
            <li>Stripe: payments and subscriptions.</li>
            <li>Resend: email delivery.</li>
            <li>Bunny Stream and YouTube: video hosting for our own portfolio.</li>
            <li>The AI production tools we use to make your video.</li>
            <li>Google and Microsoft: only if you choose them to sign in.</li>
            <li>PostHog: analytics, EU servers, only with your consent.</li>
          </ul>
        </li>
        <li>
          <strong>Advertising partners, only with your consent:</strong> Google (Google Ads) and OpenAI receive information
          about your visit through their tags. This is used to measure whether our ads lead to inquiries and to build
          remarketing audiences.
        </li>
        <li>
          <strong>Legal and safety:</strong> authorities or other parties when the law requires it, or when it is needed to
          protect our rights, our users or the public.
        </li>
        <li>
          <strong>Business transfers:</strong> a buyer or successor if DreamTeam is involved in a merger, acquisition or sale
          of assets, under this policy&rsquo;s protections.
        </li>
      </ul>
      <p>
        <strong>&ldquo;Sale&rdquo; and &ldquo;sharing&rdquo;.</strong> We do not sell personal information for money and
        never have. Under California law, letting advertising partners&rsquo; tags collect information for cross-context
        behavioral advertising can count as &ldquo;sharing&rdquo;, or as a &ldquo;sale&rdquo; or &ldquo;targeted
        advertising&rdquo; under other states&rsquo; laws. On our site that happens only if you accept marketing cookies.
        In the last 12 months the information involved was identifiers (cookie IDs and IP address) and internet activity on
        our site. You can opt out at any time (see section 7). We do not knowingly sell or share the personal information of
        anyone under 16.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>
          <strong>Account, projects, files and comments:</strong> for as long as your account is open. They are deleted when
          you ask us to delete your account (see section 8).
        </li>
        <li>
          <strong>Payment and tax records:</strong> for as long as tax and accounting law requires, even after your account
          is deleted.
        </li>
        <li>
          <strong>Inquiries sent by form or email:</strong> for as long as we need them to answer you and follow up.
        </li>
        <li>
          <strong>Cookies:</strong> for the durations listed in section 6.
        </li>
      </ul>

      <h2>6. Cookies, Global Privacy Control and Do Not Track</h2>
      <p>
        By itself the website stores only what it needs to work: your language and theme, your cookie choice (the{" "}
        <code>dt_consent</code> cookie, kept for six months) and, if you sign in, the session cookies that keep you signed in
        (<code>sb-*</code>, set by Supabase and removed when you sign out or the session expires). Everything else runs only
        after you agree in the cookie banner. You can change or withdraw your choice at any time from &ldquo;Cookie
        settings&rdquo; in the footer.
      </p>
      <ul>
        <li>
          <strong>Analytics (PostHog, EU servers):</strong> how the site is used, including pages visited, clicks and session
          recordings, so we can improve it. Cookie <code>ph_*</code>, 1 year.
        </li>
        <li>
          <strong>Marketing (Google Ads, OpenAI):</strong> whether our ads lead to inquiries, and audiences for remarketing.
          Cookies <code>_gcl_au</code> (90 days) and <code>__obref</code> (1 year).
        </li>
        <li>
          <strong>Embedded videos:</strong> YouTube videos load in privacy-enhanced mode and set YouTube&rsquo;s cookies only
          when you play them. Videos hosted on Bunny Stream set no advertising cookies.
        </li>
      </ul>
      <p>
        We also use Vercel Analytics, which counts visits without cookies or personal identifiers. The Clutch review badge
        loads from clutch.co.
      </p>
      <p>
        <strong>Global Privacy Control (GPC).</strong> If your browser sends the GPC signal, we treat it as a request to opt
        out of the sale and sharing of your personal information and of targeted advertising. Our marketing tags then do not
        load, even if you clicked &ldquo;Accept all&rdquo;. <strong>Do Not Track:</strong> there is no common standard for
        these browser signals, so we do not respond to them. We do honor GPC.
      </p>

      <h2>7. Your privacy rights</h2>
      <p>
        Residents of California and of other states with privacy laws, including Colorado, Connecticut, Virginia, Utah,
        Texas and Oregon, have the rights below. We extend them to all our users in the US, and GDPR gives similar rights to
        people in the EU and UK.
      </p>
      <ul>
        <li>
          <strong>Right to know and access:</strong> the categories and the specific pieces of personal information we hold
          about you, where they came from, why we use them and who we disclose them to.
        </li>
        <li>
          <strong>Right to delete:</strong> your personal information, subject to legal exceptions such as tax records.
        </li>
        <li>
          <strong>Right to correct:</strong> information that is inaccurate.
        </li>
        <li>
          <strong>Right to portability:</strong> a copy of your information in a usable format.
        </li>
        <li>
          <strong>Right to opt out</strong> of the sale or sharing of personal information and of targeted advertising:
          decline or withdraw marketing cookies in &ldquo;Cookie settings&rdquo;, turn on GPC, or email us.
        </li>
        <li>
          <strong>Right to limit</strong> the use of sensitive personal information. We do not use any beyond what the
          Service needs.
        </li>
        <li>
          <strong>Right to non-discrimination:</strong> we will not deny you the Service, charge you a different price or
          give you a lower quality of service because you used any of these rights.
        </li>
        <li>
          <strong>Under the GDPR, also:</strong> the right to restrict or object to processing, to withdraw consent at any
          time, and to complain to your data protection authority.
        </li>
      </ul>
      <p>
        <strong>How to make a request.</strong> Email <Mail subject="Privacy request" /> and tell us which right you want to
        use. To protect your information, we verify that the request comes from you: we write back to the email address on
        your account, or ask for details only the account holder would know. You may use an authorized agent; we will ask
        for your signed permission and may still verify your identity with you. We respond within 45 days. If we need more
        time, we may extend that by another 45 days and will tell you why. Requests are free of charge.
      </p>
      <p>
        <strong>Appeals.</strong> If we decline your request, you can appeal by replying to our answer with
        &ldquo;Appeal&rdquo;. We will give you a written decision, with our reasons, within 45 days (60 days in Colorado). If
        you are not satisfied, you can contact your state&rsquo;s Attorney General.
      </p>

      <h2>8. Deleting your account</h2>
      <p>
        To delete your account, contact our support team at <Mail subject="Account deletion request" /> or through the
        contact form, from the email address on your account. Support will take care of it:
      </p>
      <ul>
        <li>Any active subscription is cancelled first, so you are not charged again.</li>
        <li>
          Within 30 days we delete your account, your projects, the files you uploaded, the files we delivered and your
          comments, and we confirm by email.
        </li>
        <li>Unused video seconds end with the account.</li>
        <li>Copies in our providers&rsquo; backups are removed as those backups expire.</li>
        <li>We keep only what the law requires us to keep, such as payment and tax records, and only for as long as it requires.</li>
      </ul>

      <h2>9. How we protect it</h2>
      <p>
        All traffic to the Service is encrypted (HTTPS). Your project files and delivered videos are stored privately, and
        you open them through links that expire within minutes or, to watch a video, an hour. Only you and our production
        team can access them; within DreamTeam, client data is open only to the team members who produce and support
        projects. No
        system is completely secure, but we work to protect your information and will notify you as the law requires if a
        breach affects it.
      </p>

      <h2>10. International transfers</h2>
      <p>
        DreamTeam is based in the European Union (Bulgaria), and our service providers may store and process information in
        the United States, the EU and other countries. When personal information of people in the EU or UK is transferred
        abroad, our providers protect it with recognized safeguards, such as the EU Standard Contractual Clauses or the EU-US
        Data Privacy Framework.
      </p>

      <h2>11. Children</h2>
      <p>
        The Service is for adults: you must be at least 18 years old to create an account. We do not knowingly collect
        personal information from children under 13, and we do not sell or share the information of anyone under 16. If you
        believe a child has given us personal information, contact us and we will delete it.
      </p>

      <h2>12. Emails</h2>
      <p>
        We send service emails about your account, orders and projects. We do not send marketing newsletters today. If we
        start, we will only send them to people who agreed to receive them, every one will have an unsubscribe link, and we
        will follow the CAN-SPAM Act.
      </p>

      <h2>13. California &ldquo;Shine the Light&rdquo;</h2>
      <p>
        We do not disclose personal information to third parties for their own direct marketing purposes.
      </p>

      <h2>14. Changes to this policy</h2>
      <p>
        When we change this policy, we update the &ldquo;Last updated&rdquo; date above. If a change is material, we will
        also tell account holders by email before it takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your information: <Mail subject="Privacy question" />.
      </p>
    </>
  );
}
