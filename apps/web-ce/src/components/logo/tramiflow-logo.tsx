'use client'

import React from 'react'

interface TramiFlowLogoProps {
    variant?: 'full' | 'icon-only'
    className?: string
}

export function TramiFlowLogo({ variant = 'full', className = '' }: TramiFlowLogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Icon - Document with circular arrows */}
            <div className="relative flex h-10 w-10 items-center justify-center">
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                >
                    {/* Background circle with border */}
                    <circle cx="20" cy="20" r="20" fill="#0d4a2e" stroke="#00fd36" strokeWidth="1.5" />

                    {/* Document icon */}
                    <rect
                        x="13"
                        y="10"
                        width="14"
                        height="20"
                        rx="1.5"
                        fill="white"
                    />
                    <path
                        d="M24 10L24 14L28 14L24 10Z"
                        fill="#00fd36"
                    />
                    {/* Document lines */}
                    <line x1="15" y1="16" x2="25" y2="16" stroke="#0d4a2e" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="15" y1="19" x2="25" y2="19" stroke="#0d4a2e" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="15" y1="22" x2="22" y2="22" stroke="#0d4a2e" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="15" y1="25" x2="25" y2="25" stroke="#0d4a2e" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Circular arrow - White (left side) - better contrast */}
                    <path
                        d="M 20 5 A 15 15 0 0 1 35 20"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <polygon
                        points="35,20 31,16 31,24"
                        fill="white"
                    />

                    {/* Circular arrow - Green (right side) */}
                    <path
                        d="M 20 35 A 15 15 0 0 1 5 20"
                        stroke="#00fd36"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <polygon
                        points="5,20 9,16 9,24"
                        fill="#00fd36"
                    />
                </svg>
            </div>

            {/* Text - Only shown in full variant */}
            {variant === 'full' && (
                <div className="flex flex-col">
                    <span className="text-base font-bold tracking-tight">
                        <span className="text-white">Trami</span><span style={{ color: '#00fd36' }}>Flow</span>
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#00fd36' }}>
                        ENTERPRISE
                    </span>
                </div>
            )}
        </div>
    )
}
