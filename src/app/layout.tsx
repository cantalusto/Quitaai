import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Quita aí — Controle. Cobre. Receba.",
    template: "%s · Quita aí",
  },
  description:
    "Controle de fiado, crediário e empréstimos para açougues e comércios. Cadastre clientes, registre vendas, envie cobranças no WhatsApp.",
  applicationName: "Quita aí",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quita aí",
  },
  openGraph: {
    title: "Quita aí — Controle. Cobre. Receba.",
    description: "Controle de fiado, crediário e empréstimos.",
    type: "website",
    locale: "pt_BR",
    siteName: "Quita aí",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <AppShell>{children}</AppShell>
            <Toaster
              position="top-center"
              theme="system"
              richColors
              toastOptions={{
                style: {
                  fontFamily: "var(--font-inter)",
                },
              }}
            />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
