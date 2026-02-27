"use client";
import React, { useRef, useEffect } from 'react';
import { Shield, Truck, Helicopter, Cross, AlertTriangle, Terminal } from 'lucide-react';
import { ThemeColor } from './HUDLayout';

export interface TacticalUnit {
    id: string;
    name: string;
    type: 'rescue' | 'medical' | 'police' | 'air';
    status: 'idle' | 'en_route' | 'on_scene' | 'dispatched';
}

export interface MissionLog {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
}

interface UnitSidebarProps {
    units: TacticalUnit[];
    logs?: MissionLog[];
    themeColor?: ThemeColor;
    onDispatch?: (unitId: string) => void;
}

export const UnitSidebar: React.FC<UnitSidebarProps> = ({ units, logs = [], themeColor = 'cyan', onDispatch }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'rescue': return <Truck className="w-5 h-5" />;
            case 'medical': return <Cross className="w-5 h-5" />;
            case 'police': return <Shield className="w-5 h-5" />;
            case 'air': return <Helicopter className="w-5 h-5" />;
            default: return <Shield className="w-5 h-5" />;
        }
    };

    const themeParams = {
        cyan: {
            text: 'text-cyber-cyan',
            border: 'border-cyber-cyan/30',
            bg: 'bg-cyber-cyan/10',
            glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
            iconHover: 'group-hover:bg-cyber-cyan group-hover:text-slate-950',
            borderInset: 'shadow-[0_0_10px_rgba(34,211,238,0.1)_inset]',
            dot: 'bg-cyber-cyan',
        },
        rose: {
            text: 'text-rose-500',
            border: 'border-rose-500/30',
            bg: 'bg-rose-500/10',
            glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]',
            iconHover: 'group-hover:bg-rose-500 group-hover:text-slate-950',
            borderInset: 'shadow-[0_0_10px_rgba(244,63,94,0.1)_inset]',
            dot: 'bg-rose-500',
        },
        blue: {
            text: 'text-blue-500',
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/10',
            glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]',
            iconHover: 'group-hover:bg-blue-500 group-hover:text-slate-950',
            borderInset: 'shadow-[0_0_10px_rgba(59,130,246,0.1)_inset]',
            dot: 'bg-blue-500',
        },
        amber: {
            text: 'text-amber-500',
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/10',
            glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
            iconHover: 'group-hover:bg-amber-500 group-hover:text-slate-950',
            borderInset: 'shadow-[0_0_10px_rgba(245,158,11,0.1)_inset]',
            dot: 'bg-amber-500',
        }
    };

    const theme = themeParams[themeColor];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'dispatched': return 'text-alert-rose border-alert-rose/60 bg-alert-rose/10';
            case 'on_scene': return 'text-green-400 border-green-400/60 bg-green-400/10';
            case 'en_route': return 'text-yellow-400 border-yellow-400/60 bg-yellow-400/10';
            default: return `${theme.text} ${theme.border} bg-slate-900/50`;
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'error': return 'text-alert-rose';
            case 'warning': return 'text-yellow-400';
            case 'success': return 'text-green-400';
            default: return theme.text;
        }
    };

    const isRescueAlphaDispatched = units.some(
        (u) => u.name === 'Rescue-Alpha' && u.status === 'dispatched'
    );

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, unit: TacticalUnit) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: unit.id, name: unit.name, type: unit.type }));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className={`w-full h-full flex flex-col bg-slate-950 border-l ${theme.border} ${theme.text} font-mono pointer-events-auto`}>
            {/* Top Section: Unit Inventory */}
            <div className="flex-[6] p-4 flex flex-col gap-4 overflow-y-auto">
                <div className={`border-b ${theme.border} pb-2 mb-2`}>
                    <h2 className={`text-xl font-bold uppercase tracking-widest ${theme.text} ${theme.glow}`}>
                        Force Deployment
                    </h2>
                    <div className="text-xs opacity-70">DRAG UNIT TO MAP TO DISPATCH</div>
                </div>

                {/* MISSION ASSIGNED Alert for Rescue-Alpha */}
                {isRescueAlphaDispatched && (
                    <div className="flex items-center gap-2 p-3 border border-alert-rose bg-alert-rose/10 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                        <AlertTriangle className="w-5 h-5 text-alert-rose shrink-0" />
                        <div>
                            <div className="text-alert-rose font-bold tracking-widest text-xs uppercase">Mission Assigned</div>
                            <div className="text-alert-rose/80 text-xs">RESCUE-ALPHA: PROCEED TO ZONE</div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {units.map((unit) => (
                        <div
                            key={unit.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, unit)}
                            className={`group cursor-grab active:cursor-grabbing p-3 border transition-all duration-200 flex items-center justify-between ${theme.borderInset} ${getStatusColor(unit.status)}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 border ${theme.border} bg-slate-950 ${theme.text} ${theme.iconHover} transition-colors`}>
                                    {getIcon(unit.type)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold tracking-wide">{unit.name}</span>
                                    <span className="text-xs opacity-70 uppercase">{unit.type} // {unit.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${unit.status === 'dispatched' ? 'bg-alert-rose' : theme.dot} animate-pulse`}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Section: Mission Log Terminal */}
            <div className={`flex-[4] border-t ${theme.border} bg-slate-950/90 flex flex-col`}>
                <div className={`flex items-center gap-2 p-2 border-b ${theme.border} bg-slate-900/50`}>
                    <Terminal className={`w-4 h-4 ${theme.text}`} />
                    <span className="text-xs tracking-widest uppercase font-bold">Mission Status Uplink</span>
                </div>
                <div className="flex-1 p-3 overflow-y-auto text-xs space-y-2 font-mono">
                    {logs.map((log) => (
                        <div key={log.id} className={`flex gap-3 opacity-90 ${getLogColor(log.type)}`}>
                            <span className="opacity-50 shrink-0">
                                [{log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                            </span>
                            <span className="break-words">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
};
