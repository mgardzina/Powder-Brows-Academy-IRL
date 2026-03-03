"use client";

import Script from "next/script";

// Replace with your actual Google Analytics ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function GoogleAnalytics() {
  // Don't render if no GA ID is configured
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google Consent Mode v2 - must be first */}
      <Script id="google-consent-mode" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          // Default consent state - all denied until user makes a choice
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'granted',
            'personalization_storage': 'denied',
            'security_storage': 'granted',
            'wait_for_update': 500
          });

          // Enable URL passthrough for better conversion tracking
          gtag('set', 'url_passthrough', true);

          // Enable ads data redaction when consent is denied
          gtag('set', 'ads_data_redaction', true);
        `}
      </Script>

      {/* Google Tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
