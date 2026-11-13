import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import Navbar from "@/components/Navbar";
import { getCategories } from "@/lib/news";
import { SessionProvider } from "@/components/SessionProvider";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

// Tema, sayfa boyanmadan önce uygulanır (beyaz/siyah yanıp sönmeyi önler)
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Gazetelerde | Geleceğin Haberciliği",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/rss.xml", title: "Gazetelerde RSS" }] } },
  openGraph: { siteName: SITE_NAME, locale: "tr_TR", type: "website" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#f0f0f5" },
  ],
};

export default async function RootLayout({ children }) {
  const categories = await getCategories();
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <SessionProvider>
          <Navbar categories={categories} />
          <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            {children}
          </main>
          <ThemeToggle />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
