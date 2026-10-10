import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import FeedbackButton from '@/components/feedback/FeedbackButton';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OraQL_ — Sports Betting Intelligence',
  description:
    'Data-driven probability analysis for smarter betting decisions. Ranked picks, transparent reasoning, and multi-match strategy building.',
  keywords: ['sports betting', 'probability', 'OraQL_ picks', 'betting intelligence'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-warm-white font-body text-txt-primary antialiased">
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
