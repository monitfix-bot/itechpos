import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: s.siteTitle,
    description:
      "Hệ thống quản lý bán hàng, sửa chữa, dịch vụ cho cửa hàng Laptop và Điện thoại",
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s = await getSettings();
  const theme = s.themeColor || "blue";

  return (
    <html
      lang="vi"
      data-theme={theme}
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme_color")||document.documentElement.getAttribute("data-theme");var m=localStorage.getItem("pos_theme_mode");var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==="halloween"||m==="dark"||(!m&&prefersDark)){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-mesh-light text-foreground font-sans selection:bg-blue-600 selection:text-white" suppressHydrationWarning>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
