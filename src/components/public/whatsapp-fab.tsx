import { MessageCircle } from "lucide-react"

interface WhatsAppFABProps {
    whatsappNumber: string
}

export function WhatsAppFAB({ whatsappNumber }: WhatsAppFABProps) {
    if (!whatsappNumber) return null

    const whatsappUrl = `https://wa.me/${whatsappNumber}`

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-110 hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Contactar por WhatsApp"
        >
            <MessageCircle className="h-7 w-7" />
        </a>
    )
}
