import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Synthos - AI Training Data Validation Platform",
    template: "%s | Synthos",
  },
  description:
    "Synthos validates AI training data to prevent model collapse before it happens. Detect synthetic data quality issues with 90%+ accuracy. Trusted by AI teams building production models.",
  keywords: [
    "AI training data validation",
    "model collapse prevention",
    "synthetic data quality",
    "AI data validation platform",
    "machine learning data quality",
    "training data certification",
    "AI model collapse detection",
    "data quality assurance AI",
    "synthetic data validation",
    "ML training pipeline",
    "AI data integrity",
    "Synthos",
    "Genovo Technologies",
  ],
  authors: [{ name: "Genovo Technologies", url: "https://genovotech.com" }],
  creator: "Genovo Technologies",
  publisher: "Genovo Technologies",
  metadataBase: new URL("https://synthos.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://synthos.dev",
    siteName: "Synthos",
    title: "Synthos - AI Training Data Validation Platform",
    description:
      "Prevent model collapse before training begins. Synthos validates your AI training data with 90%+ prediction accuracy, saving teams from $100M+ training failures.",
    images: [
      {
        url: "/synthos-logo.jpeg",
        width: 1024,
        height: 1024,
        alt: "Synthos - AI Training Data Validation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synthos - AI Training Data Validation Platform",
    description:
      "Prevent model collapse before training begins. Validate synthetic data quality with 90%+ accuracy.",
    images: ["/synthos-logo.jpeg"],
    creator: "@genovotech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have them:
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

// JSON-LD structured data for search engines and AI systems
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Synthos",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "AI training data validation platform that detects model collapse risks before training begins. Validates synthetic data quality with 90%+ prediction accuracy across distribution fidelity, feature correlation, temporal consistency, and schema compliance dimensions.",
  url: "https://synthos.dev",
  author: {
    "@type": "Organization",
    name: "Genovo Technologies",
    url: "https://genovotech.com",
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "80000",
    offerCount: "4",
    description: "Credit-based pricing from Starter ($1,500) to Enterprise ($80,000)",
  },
  featureList: [
    "Model collapse detection and prevention",
    "Multi-dimensional data quality validation",
    "Distribution fidelity analysis",
    "Feature correlation checking",
    "Temporal consistency validation",
    "Schema compliance verification",
    "Outlier detection",
    "Data quality warranties with financial guarantees",
    "REST API for pipeline integration",
    "Large dataset support up to 500GB",
  ],
  screenshot: "https://synthos.dev/synthos-logo.jpeg",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Genovo Technologies",
  url: "https://genovotech.com",
  logo: "https://synthos.dev/synthos-logo-icon.jpeg",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@genovotech.com",
    contactType: "sales",
  },
  brand: {
    "@type": "Brand",
    name: "Synthos",
    url: "https://synthos.dev",
    description: "AI Training Data Validation Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/synthos-logo-icon.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/synthos-logo-icon.jpeg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
