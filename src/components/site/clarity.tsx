import Script from "next/script";

/**
 * Microsoft Clarity (visit recordings and heatmaps). The project ID is public:
 * it appears in every page's HTML. Set NEXT_PUBLIC_CLARITY_PROJECT_ID in Vercel
 * to override. Signed-in pages carry data-clarity-mask="true", so Clarity
 * hides quotes, prices and company details there.
 */
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";

export function Clarity() {
  if (!/^[a-z0-9]{6,20}$/i.test(CLARITY_PROJECT_ID)) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
