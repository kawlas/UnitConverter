import React from 'react';
import { Helmet } from 'react-helmet';

interface SchemaOrgProps {
  title: string;
  description: string;
  category: string;
}

export function SchemaOrg({ title, description, category }: SchemaOrgProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `${title} Converter`,
    "operatingSystem": "All",
    "applicationCategory": "UtilitiesApplication",
    "description": description,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How to convert ${category} units quickly?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can use our free online ${category} converter tool to instantly convert between different units with high precision.`
        }
      },
      {
        "@type": "Question",
        "name": `Is this ${category} conversion accurate?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, all calculations use standard mathematical conversion formulas and run locally in your browser for instant results.`
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqData)}
      </script>
    </Helmet>
  );
}
