import './globals.css'
import * as React from 'react';
import type { PropsWithChildren } from 'react';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="bg-[#141414] text-white min-h-screen font-sans">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  )
}
