import type { ReactNode } from "react";

export const metadata = { title: "Chroni" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
