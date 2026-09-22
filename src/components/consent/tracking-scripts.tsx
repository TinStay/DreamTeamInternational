"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent";

/*
 * The marketing tags, mounted only once the visitor has allowed marketing
 * cookies (`useConsent`): nothing here is in the server HTML, so a visitor who
 * declines - or has not answered yet - never loads Google or OpenAI at all.
 * The `afterInteractive` scripts are appended the moment the component mounts,
 * which is right after "Accept" without a reload; withdrawing consent reloads
 * the page (see the banner), so a loaded tag never outlives its consent.
 */

/** The Google Ads account the site's Google tag belongs to. */
export const GOOGLE_ADS_ID = "AW-18108686547";
const OPENAI_PIXEL_ID = "9vxEQCFdaKzy9yXADo8cMC";

export function TrackingScripts() {
  const consent = useConsent();
  if (!consent?.marketing) return null;
  const analyticsStorage = consent.analytics ? "granted" : "denied";
  return (
    <>
      {/*
        Google tag (gtag.js) for the Google Ads account - the base tag: page views for Ads measurement and
        audiences, under Consent Mode v2 in its "basic" form: the tag is not loaded until consent, and when it is,
        the default (everything denied) and the visitor's update (the ad signals granted, `analytics_storage` per
        their analytics choice) are queued before `config`, so Google records the consent as the visitor's own and
        personalises for EEA traffic (with no signal at all it treated every visit as non-personalised - `npa=1`
        on the collect call). The snippet queues into `dataLayer` before gtag.js lands, so the two scripts' order is
        free. A conversion (e.g. a submitted form) needs its conversion label from Ads - `gtag('event',
        'conversion', { send_to: 'AW-18108686547/<label>' })` beside `trackLeadCreated` once there is one.
      */}
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'${analyticsStorage}'});gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      {/*
        OpenAI conversion pixel (oaiq). Vendor snippet as shipped: it stubs `window.oaiq` with a command queue,
        then injects the real SDK, so calls fired before the SDK lands (`lib/openai-pixel.ts`) are replayed.
      */}
      <Script id="openai-pixel" strategy="afterInteractive">
        {`!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("init",{pixelId:"${OPENAI_PIXEL_ID}"});`}
      </Script>
    </>
  );
}
