import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'PropCare | AI-Driven Property Management',
    description: 'Elevate your property operations with the PropCare AI Staff Portal.',
}

import { LanguageProvider } from '@/components/LanguageProvider'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="de">
            <body className={inter.className}>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </body>
        </html>
    )
}
