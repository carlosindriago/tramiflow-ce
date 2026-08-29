/**
 * TramiFlow Enterprise Edition (EE) License Verifier
 */
export function isProEnabled(): boolean {
    const key = process.env.TRAMIFLOW_LICENSE_KEY || process.env.NEXT_PUBLIC_TRAMIFLOW_LICENSE_KEY
    return Boolean(key && (key.startsWith('tf_pro_') || key.startsWith('PRO-')))
}

export function getProLicenseKey(): string | null {
    return process.env.TRAMIFLOW_LICENSE_KEY || process.env.NEXT_PUBLIC_TRAMIFLOW_LICENSE_KEY || null
}

export function requireProLicense(): void {
    if (!isProEnabled()) {
        throw new Error('Esta funcionalidad requiere una licencia Enterprise / Pro activa.')
    }
}
