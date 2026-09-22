export function PrivacyEnglishContent() {
  return (
    <>
      <p className="not-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
        We at &ldquo;DreamTeam&rdquo;, accessible at{" "}
        <a href="https://www.dreamteamvideo.com" className="text-primary underline-offset-4 hover:underline">
          https://www.dreamteamvideo.com
        </a>
        , respect your privacy and are committed to protecting your personal data. This policy
        describes how we process information collected through our website.
      </p>

      <h2>1. Data Controller</h2>
      <p>The controller of the data collected through this website is:</p>
      <ul>
        <li>
          <strong>Company:</strong> DreamTeam
        </li>
        <li>
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
        </li>
      </ul>
      <p>
        We also use Vercel Analytics, which counts visits without cookies or personal identifiers, and
        the Clutch review badge, which loads from clutch.co.
      </p>

      <h2>3. Purposes of Processing</h2>
      <p>We use your data solely for:</p>
      <ul>
        <li>Responding to your inquiries.</li>
        <li>Analyzing the performance of our website.</li>
        <li>Marketing purposes and improving our advertising campaigns.</li>
      </ul>

      <h2>4. Sharing Data with Third Parties</h2>
      <p>
        We do not sell or provide your personal data to third parties for their marketing purposes.
        Your data may only be shared with:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> Vercel (hosting and cookieless analytics), Resend
          (delivery of your inquiries to our email), PostHog (analytics, EU), Google and OpenAI
          (advertising measurement &mdash; only with your consent), Bunny Stream and YouTube (video
          hosting).
        </li>
        <li>
          <strong>Partners:</strong> Our website may contain links to our clients or partners in the
          &ldquo;Partners&rdquo; section. Please note that these websites have their own privacy
          policies.
        </li>
      </ul>

      <h2>5. Artificial Intelligence and Your Data</h2>
      <p>As an AI video production company, we guarantee that:</p>
      <p>
        On our informational website, no client files are uploaded or processed (images, videos,
        voice recordings) for training AI models unless this is explicitly agreed upon in an
        individual service contract.
      </p>

      <h2>6. Your Rights (under GDPR)</h2>
      <p>
        Although we currently operate mainly in Bulgaria, we comply with European standards that give
        you the right to:
      </p>
      <ul>
        <li>Access your personal data.</li>
        <li>Correction or deletion (&ldquo;right to be forgotten&rdquo;).</li>
        <li>Restriction of processing.</li>
        <li>
          Change or withdraw your cookie consent at any time (&ldquo;Cookie settings&rdquo; in the
          footer, or your browser settings).
        </li>
      </ul>

      <h2>7. Data Retention Period</h2>
      <p>
        We store your data only for as long as necessary for the purposes for which it was collected
        or as required by law.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions regarding this policy, please contact us at:{" "}
        <a href="mailto:info@dreamteam.technology">info@dreamteam.technology</a>.
      </p>
    </>
  );
}
