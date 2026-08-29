'use client'

import React from 'react'
import { isProEnabled } from '@carlosindriago/core'
import { UpgradeUpsell } from './upgrade-upsell'

export interface ProGateProps {
    children: React.ReactNode
    featureName?: string
    description?: string
    fallback?: React.ReactNode
}

export function ProGate({
    children,
    featureName = 'esta funcionalidad',
    description,
    fallback,
}: ProGateProps) {
    if (isProEnabled()) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    return <UpgradeUpsell featureName={featureName} description={description} />
}
