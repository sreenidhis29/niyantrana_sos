import React, { ReactNode } from 'react';

interface HUDLayoutProps {
    children: ReactNode;
}

export const HUDLayout: React.FC<HUDLayoutProps> = ({ children }) => {
    return (
        <div className="fixed inset-0 overflow-hidden bg-slate-950 text-cyber-cyan font-mono select-none">

            {/* Background/Map Layer */}
            <div className="absolute inset-0 z-0">
                {children}
            </div>

            {/* Scanline Effect Overlay (pointer-events-none so we can interact with map) */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-scanline opacity-20" />

            {/* Glassmorphism HUD Overlay */}
            <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6 bg-slate-950/10 backdrop-blur-[2px]">
                {/* Top Header */}
                <header className="flex justify-between items-center w-full border-b border-cyber-cyan/30 pb-4 shadow-[0_4px_10px_rgba(34,211,238,0.1)]">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-widest uppercase text-cyber-cyan drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                            Niyantrana
                        </h1>
                        <span className="text-xs tracking-widest opacity-80 uppercase text-alert-rose">
                            Tactical HUD // Phase 1
                        </span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyber-cyan animate-pulse"></span>
                            <span className="text-xs tracking-widest">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </header>

                {/* Center Area left empty for map projection to show through clearly */}
                <div className="flex-1 relative w-full my-4">
                    {/* Neon Corner Borders */}
                    {/* Top Left */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-cyan opacity-80 shadow-[0_0_10px_#22d3ee_inset]"></div>
                    {/* Top Right */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-cyan opacity-80 shadow-[0_0_10px_#22d3ee_inset]"></div>
                    {/* Bottom Left */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-cyan opacity-80 shadow-[0_0_10px_#22d3ee_inset]"></div>
                    {/* Bottom Right */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-cyan opacity-80 shadow-[0_0_10px_#22d3ee_inset]"></div>
                </div>

                {/* Bottom Footer Area */}
                <footer className="w-full flex justify-between items-end border-t border-cyber-cyan/30 pt-4">
                    {/* Placeholder for Command Components later */}
                    <div className="text-xs opacity-70">DISPATCH CONTROL AWAITING UPLINK...</div>
                    <div className="text-xs font-mono">LAT: 00.00 | LNG: 00.00</div>
                </footer>
            </div>
        </div>
    );
};
