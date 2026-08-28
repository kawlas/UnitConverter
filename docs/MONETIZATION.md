# Monetization release gate

The current implementation only reserves responsive ad space when
`VITE_ADSENSE_PLACEHOLDERS=true`. It does not load Google code, set cookies, or
make an external request.

Do not enable real ads until all of these are complete:

- the site is approved in AdSense and the real publisher and slot IDs are available;
- `ads.txt` is generated with the real publisher ID;
- Google Privacy & Messaging or another Google-certified IAB TCF CMP is active
  for the EEA, UK, and Switzerland;
- the ad tag is not called before the required consent signal;
- production mobile checks confirm the calculator and answer remain above ads,
  ads are clearly labelled, controls are not close enough to cause accidental
  clicks, and reserved dimensions prevent layout shift;
- analytics compares engagement, Core Web Vitals, viewability, and revenue per
  thousand sessions before adding another placement.

References:

- https://support.google.com/adsense/answer/7584263
- https://support.google.com/adsense/answer/13554020
- https://support.google.com/adsense/answer/1346295
