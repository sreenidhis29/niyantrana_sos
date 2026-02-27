import React, { ReactNode } from 'react';
import Link from 'next/link';

export type ThemeColor = 'cyan' | 'rose' | 'blue' | 'amber';

interface HUDLayoutProps {
    children: ReactNode;
    themeColor?: ThemeColor;
}

export const HUDLayout: React.FC<HUDLayoutProps> = ({ children, themeColor = 'cyan' }) => {
    const themeParams = {
        cyan: {
            text: 'text-cyber-cyan',
            textDrop: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
            border: 'border-cyber-cyan/30',
            borderSolid: 'border-cyber-cyan',
            shadow: 'shadow-[0_4px_10px_rgba(34,211,238,0.1)]',
            shadowInset: 'shadow-[0_0_10px_#22d3ee_inset]',
            bgPulse: 'bg-cyber-cyan'
        },
        rose: {
            text: 'text-rose-500',
            textDrop: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]',
            border: 'border-rose-500/30',
            borderSolid: 'border-rose-500',
            shadow: 'shadow-[0_4px_10px_rgba(244,63,94,0.1)]',
            shadowInset: 'shadow-[0_0_10px_#f43f5e_inset]',
            bgPulse: 'bg-rose-500'
        },
        blue: {
            text: 'text-blue-500',
            textDrop: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]',
            border: 'border-blue-500/30',
            borderSolid: 'border-blue-500',
            shadow: 'shadow-[0_4px_10px_rgba(59,130,246,0.1)]',
            shadowInset: 'shadow-[0_0_10px_#3b82f6_inset]',
            bgPulse: 'bg-blue-500'
        },
        amber: {
            text: 'text-amber-500',
            textDrop: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
            border: 'border-amber-500/30',
            borderSolid: 'border-amber-500',
            shadow: 'shadow-[0_4px_10px_rgba(245,158,11,0.1)]',
            shadowInset: 'shadow-[0_0_10px_#f59e0b_inset]',
            bgPulse: 'bg-amber-500'
        }
    };

    const theme = themeParams[themeColor];

    return (
        <div className={`fixed inset-0 overflow-hidden bg-slate-950 ${theme.text} font-mono select-none`}>

            {/* Background/Map Layer */}
            <div className="absolute inset-0 z-0">
                {children}
            </div>

            {/* Scanline Effect Overlay (pointer-events-none so we can interact with map) */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-scanline opacity-20" />

            {/* Glassmorphism HUD Overlay (REMOVED BLUR FOR SHARPNESS) */}
            <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6 bg-slate-950/20">
                {/* Top Header */}
                <header className={`flex justify-between items-center w-full border-b ${theme.border} pb-4 ${theme.shadow}`}>
                    <Link href="/" className="flex flex-col group cursor-pointer pointer-events-auto">
                        <h1 className={`text-2xl font-bold tracking-widest uppercase transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,1)] ${theme.text} ${theme.textDrop}`}>
                            Niyantrana
                        </h1>
                        <span className="text-xs tracking-widest opacity-80 uppercase text-alert-rose">
                            Tactical HUD // Phase 1
                        </span>
                    </Link>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${theme.bgPulse} animate-pulse`}></span>
                            <span className="text-xs tracking-widest">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </header>

                {/* Center Area left empty for map projection to show through clearly */}
                <div className="flex-1 relative w-full my-4">
                    {/* Neon Corner Borders */}
                    {/* Top Left */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${theme.borderSolid} opacity-80 ${theme.shadowInset}`}></div>
                    {/* Top Right */}
                    <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${theme.borderSolid} opacity-80 ${theme.shadowInset}`}></div>
                    {/* Bottom Left */}
                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 ${theme.borderSolid} opacity-80 ${theme.shadowInset}`}></div>
                    {/* Bottom Right */}
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${theme.borderSolid} opacity-80 ${theme.shadowInset}`}></div>
                </div>

                {/* Bottom Footer Area */}
                <footer className={`w-full flex justify-between items-end border-t ${theme.border} pt-4`}>
                    <div className="text-xs opacity-70">DISPATCH CONTROL AWAITING UPLINK...</div>
                    <div className="text-xs font-mono">LAT: 00.00 | LNG: 00.00</div>
                </footer>
            </div>
        </div>
    );
};
