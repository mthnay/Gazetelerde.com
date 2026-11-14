import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NavProgress from "@/components/motion/NavProgress";
import Analytics from "@/components/Analytics";
import ErrorReporter from "@/components/ErrorReporter";
import { getCategories } from "@/lib/news";
import { buildSafe } from "@/lib/db";
import { SessionProvider } from "@/components/SessionProvider";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import "./globals.css";

// Başlıklar: karakterli, değişken serif (opsz / SOFT / WONK eksenleri animasyonlarda da kullanılıyor)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"], display: "swap" });

// Sayfa boyanmadan önce temayı uygula (yanıp sönmeyi önler)
const bootScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t)}catch(e){d.setAttribute('data-theme','light')}})()`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Gazetelerde | Geleceğin Haberciliği",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/rss.xml", title: "Gazetelerde RSS" }] } },
  openGraph: { siteName: SITE_NAME, locale: "tr_TR", type: "website" },
  twitter: { card: "summary_large_image" },
  // Google Discover büyük görsel kartı ve uzun önizlemeler için
  robots: {
    index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Google Search Console / Bing Webmaster doğrulaması (ortam değişkeniyle)
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0d0b" },
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
  ],
};

export default async function RootLayout({ children }) {
  const categories = await buildSafe(() => getCategories(), []);
  return (
    <html lang="tr" data-theme="light" suppressHydrationWarning className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a href="#icerik" className="skip-link">İçeriğe geç</a>
        <ThemeProvider>
          <SessionProvider>
            <NavProgress />
            <Navbar categories={categories} />
            <main id="icerik">{children}</main>
            <Footer categories={categories} />
            <ThemeToggle />
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
        <ErrorReporter />
      </body>
    </html>
  );
}
