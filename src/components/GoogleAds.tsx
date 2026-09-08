import { adConfig } from "@/lib/ads";

export default function GoogleAds() {
  if (!adConfig.enabled || !adConfig.clientId) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.clientId}`}
      crossOrigin="anonymous"
    />
  );
}
