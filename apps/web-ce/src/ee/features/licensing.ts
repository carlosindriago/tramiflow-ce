export const getProVersion = (): string => {
    return '1.0.0-PRO'
}

export const isValidProLicense = (licenseKey: string): boolean => {
    return licenseKey.startsWith('tf_pro_') || licenseKey.startsWith('PRO-')
}
