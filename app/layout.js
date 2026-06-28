import './globals.css'

export const metadata = {
  title: 'Idea Catcher',
  description: 'AI-powered idea capture and categorisation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
