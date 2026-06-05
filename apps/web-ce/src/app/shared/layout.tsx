export default function SharedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <main>{children}</main>
        </div>
    )
}
