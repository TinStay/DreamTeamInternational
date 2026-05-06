import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StyledComponentsRegistry } from "@/lib/styled-components-registry";
import { LanguageProvider } from "@/lib/i18n/language-context";
// import { FloatingAiAssistant } from "@/components/ui/glowing-ai-chat-assistant";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/posthog-provider";
import { PostHogPageView } from "@/components/posthog-pageview";
import { Suspense } from "react";

const syne = Syne({ 
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dreamteam.technology"),
  title: "DreamTeam Technology | AI Video Production Agency",
  description: "DreamTeam Technology creates high-impact AI-generated videos for brands worldwide — from realistic to animated. Custom scripts, global clients, fast turnarounds.",
  keywords: "AI video production, 3D animation, brand videos, AI-generated scenes, product videos, DreamTeam Technology",
  alternates: {
    canonical: "/bg",
    languages: {
      en: "/en",
      bg: "/bg",
    },
  },
  openGraph: {
    title: "DreamTeam Technology | AI Video Production",
    description: "End-to-end AI video production — photorealistic, animated, or hybrid. Serving global clients with custom scripts and diverse budgets.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamTeam Technology",
    description: "AI-powered video production for modern brands.",
  },
  icons: {
    icon: "/logo/logo_short_black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} font-sans antialiased relative min-h-screen`}
        suppressHydrationWarning
      >
        <PostHogProvider>
          <StyledComponentsRegistry>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <LanguageProvider>
                <Suspense fallback={null}>
                  <PostHogPageView />
                </Suspense>
                <div className="relative z-10">
                  {children}
                  {/* <FloatingAiAssistant /> */}
                </div>
              </LanguageProvider>
            </ThemeProvider>
          </StyledComponentsRegistry>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
