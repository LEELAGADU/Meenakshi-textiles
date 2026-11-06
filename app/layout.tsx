import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEENAKSHI TEXTILES | Timeless Elegance",
  description: "Discover sarees, kurtis, dress materials and more at MEENAKSHI TEXTILES.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
