import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Synthos",
  description:
    "Learn about Synthos, the AI training data validation platform by Genovo Technologies. Our mission is to prevent model collapse and ensure training data quality for AI teams worldwide.",
  openGraph: {
    title: "About Synthos - AI Training Data Validation",
    description: "Learn about Synthos and our mission to prevent AI model collapse through data validation.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
