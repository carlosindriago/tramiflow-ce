export interface PaymentConfig {
    yape: { number: string; name: string; active: boolean; qrUrl?: string; hideNumber?: boolean }
    plin: { number: string; name: string; active: boolean; qrUrl?: string; hideNumber?: boolean }
    bank: { bankName: string; account: string; cci: string; name: string; active: boolean }
    price: { amount: number; currency: 'PEN' | 'USD'; name: string }
}
