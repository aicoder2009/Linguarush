import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linguarush - How fast can you identify languages?",
  description: "Test your language recognition skills with Linguarush! Identify languages from text samples across multiple game modes: Sprint, Time Attack, Endless, and Perfect Run. Challenge yourself with 24+ languages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased"
        style={{ fontFamily: 'Unbounded, system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
