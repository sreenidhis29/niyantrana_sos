"use client";
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { doc, setDoc, serverTimestamp, collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Shield, Camera, Zap, X, MapPin } from 'lucide-react';
import { HUDLayout, ThemeColor } from '@/components/HUD/HUDLayout';
import { TacticalMap } from '@/components/Map/TacticalMap';
import { UnitSidebar, TacticalUnit, MissionLog } from '@/components/HUD/UnitSidebar';
import { MapUnit, MapZone } from '@/components/Map/MapEngine';

interface MissionData {
    id: string;
    title: string;
    description: string;
    themeColor: ThemeColor;
    center: [number, number];
}

// Function to get a random point inside a circle (Incircle logic)
function getRandomPointInCircle(centerLat: number, centerLng: number, radiusMeters: number) {
    const r = radiusMeters * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const dy = r * Math.sin(theta);
    const dx = r * Math.cos(theta);
    const newLat = centerLat + (dy / 111111);
    const newLng = centerLng + (dx / (111111 * Math.cos(centerLat * Math.PI / 180)));
    return { lat: newLat, lng: newLng };
}

const MISSIONS: MissionData[] = [
    { id: 'alpha', title: 'INCIDENT ALPHA: FIRE', description: 'Major structural fire in commercial zone. High risk of spread.', themeColor: 'rose', center: [13.0118, 77.5552] },
    { id: 'beta', title: 'INCIDENT BETA: FLOOD', description: 'Flash flooding reported in low-lying areas. Evacuation required.', themeColor: 'blue', center: [11.7480, 79.7714] },
    { id: 'gamma', title: 'INCIDENT GAMMA: AVIATION', description: 'Aviation emergency. Aircraft off runway. Mass casualty potential.', themeColor: 'amber', center: [11.1367, 75.9553] }
];

function TacticalDashboardContent() {
    const searchParams = useSearchParams();
    const missionId = searchParams.get('mission');

    const [selectedMission, setSelectedMission] = useState<MissionData | null>(null);
    const [sidebarUnits, setSidebarUnits] = useState<TacticalUnit[]>([]);
    const [dispatchedMapUnits, setDispatchedMapUnits] = useState<MapUnit[]>([]);
    const [mapZones, setMapZones] = useState<MapZone[]>([]);
    const [logs, setLogs] = useState<MissionLog[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
    const [activeSOS, setActiveSOS] = useState<any>(null);
    const [sosMarker, setSosMarker] = useState<{ lat: number; lng: number } | null>(null);
    const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const mission = MISSIONS.find(m => m.id === missionId) || MISSIONS[0];
        setSelectedMission(mission);

        // Initialize units
        setSidebarUnits([
            { id: 'u1', name: 'Fire-Ladder', type: 'rescue', status: 'idle' },
            { id: 'u2', name: 'Rescue-Boat', type: 'rescue', status: 'idle' },
            { id: 'u3', name: 'Med-Response', type: 'medical', status: 'idle' }
        ]);

        setDispatchedMapUnits([]);
        setMapZones([
            { id: 'z1', lat: mission.center[0], lng: mission.center[1], radius: 1000, type: 'Quarantine', color: mission.themeColor === 'rose' ? '#f43f5e' : mission.themeColor === 'blue' ? '#3b82f6' : '#f59e0b' }
        ]);

        setLogs([
            { id: 'init', timestamp: new Date(), message: `UPLINK ESTABLISHED. TRACKING ${mission.title}.`, type: 'info' }
        ]);

        // SOS Listener
        if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            const sosQuery = query(
                collection(db, 'sos_signals'),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const unsubscribeSOS = onSnapshot(sosQuery, (snapshot) => {
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Show only if it's within the last 30 seconds to avoid old signals
                    const signalTime = data.timestamp?.toDate()?.getTime() || 0;
                    const now = Date.now();
                    if (now - signalTime < 30000 && data.status === 'active') {
                        setActiveSOS(data);
                        setIsSOSModalOpen(true);

                        // Generate dynamic incircle marker for the dashboard map
                        const randomPos = getRandomPointInCircle(data.lat, data.lng, 200);
                        setSosMarker(randomPos);

                        setLogs((prev) => [
                            ...prev,
                            {
                                id: `sos-${Date.now()}`,
                                timestamp: new Date(),
                                message: `CRITICAL SOS [${data.id.slice(-4)}]: LAT:${data.lat.toFixed(4)} LNG:${data.lng.toFixed(4)} // STATUS: ACTIVE`,
                                type: 'error'
                            }
                        ]);
                    }
                });
            });

            return () => unsubscribeSOS();
        }
    }, [missionId]);

    const handleAcknowledgeSOS = async () => {
        if (!activeSOS) return;
        setIsSOSModalOpen(false);
        setToast({ message: 'SOS ACKNOWLEDGED. POSITION MARKED.', type: 'info' });

        // Mark as acknowledged in Firebase
        if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            await setDoc(doc(db, 'sos_signals', activeSOS.id), { status: 'acknowledged' }, { merge: true });
        }
    };

    const handleDeploySOSUnits = async () => {
        if (!activeSOS) return;
        setIsSOSModalOpen(false);

        // Auto-center map on victim
        const mission = MISSIONS.find(m => m.id === missionId) || MISSIONS[0];
        setSelectedMission({ ...mission, center: [activeSOS.lat, activeSOS.lng] });

        setToast({ message: 'EMERGENCY DEPLOYMENT INITIALIZED', type: 'info' });
        setLogs((prev) => [
            ...prev,
            { id: `deploy-${Date.now()}`, timestamp: new Date(), message: `HEAVY RESCUE DISPATCHED TO SOS COORDINATES.`, type: 'warning' }
        ]);

        // Automatically dispatch first available unit to victim location
        if (sidebarUnits.length > 0) {
            const unit = sidebarUnits[0];
            handleUnitDrop(unit, activeSOS.lat, activeSOS.lng);
        }

        if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            await setDoc(doc(db, 'sos_signals', activeSOS.id), { status: 'deployed' }, { merge: true });
        }
    };

    const handleUnitDrop = useCallback(
        async (unitData: { id: string; name: string; type: string }, lat: number, lng: number) => {
            // Boundary Refinement for Brigade Gateway Fire
            if (selectedMission?.id === 'alpha') {
                const targetLat = 13.0118;
                const targetLng = 77.5552;

                // Simple Haversine
                const R = 6371e3;
                const φ1 = lat * Math.PI / 180;
                const φ2 = targetLat * Math.PI / 180;
                const Δφ = (targetLat - lat) * Math.PI / 180;
                const Δλ = (targetLng - lng) * Math.PI / 180;
                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                if (distance > 100) {
                    setToast({ message: 'Tactical Error: Out of Range', type: 'error' });
                    setLogs((prev) => [
                        ...prev,
                        { id: `err-${Date.now()}`, timestamp: new Date(), message: `DISPATCH FAILED: ${unitData.name} outside 100m ops range.`, type: 'error' }
                    ]);
                    return;
                }
            }

            setSidebarUnits((prev) =>
                prev.map((u) => u.id === unitData.id ? { ...u, status: 'dispatched' } : u)
            );

            setDispatchedMapUnits((prev) => {
                const exists = prev.find((u) => u.id === unitData.id);
                if (exists) {
                    return prev.map((u) => u.id === unitData.id ? { ...u, lat, lng, status: 'dispatched' } : u);
                }
                return [...prev, { id: unitData.id, name: unitData.name, lat, lng, type: unitData.type, status: 'dispatched' }];
            });

            setLogs((prev) => [
                ...prev,
                { id: `log-${Date.now()}`, timestamp: new Date(), message: `UNIT DISPATCHED: ${unitData.name} -> LAT: ${lat.toFixed(4)}, LNG: ${lng.toFixed(4)}`, type: 'warning' }
            ]);

            if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                try {
                    await setDoc(doc(db, 'units', unitData.id), {
                        name: unitData.name,
                        status: 'dispatched',
                        target_pos: { lat, lng },
                        timestamp: serverTimestamp(),
                    }, { merge: true });
                } catch (err) {
                    console.error('Firestore dispatch error:', err);
                }
            }
        },
        []
    );

    if (!selectedMission) return <div className="h-full w-full bg-slate-950 flex items-center justify-center text-cyber-cyan">INITIALIZING COMMAND LINK...</div>;

    return (
        <HUDLayout themeColor={selectedMission.themeColor}>
            <div className="w-full h-full flex pt-24 pb-16 px-6 gap-6 relative z-10 pointer-events-auto">
                <div className={`flex-[7] h-full relative border bg-slate-950 shadow-2xl
                    ${selectedMission.themeColor === 'rose' ? 'border-rose-500/30' : ''}
                    ${selectedMission.themeColor === 'blue' ? 'border-blue-500/30' : ''}
                    ${selectedMission.themeColor === 'amber' ? 'border-amber-500/30' : ''}
                    `}
                >
                    <TacticalMap
                        units={dispatchedMapUnits}
                        zones={mapZones}
                        center={selectedMission.center}
                        sosMarker={sosMarker}
                        onUnitDrop={handleUnitDrop}
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-4 z-20">
                        <div className="text-white/20 text-xs font-mono tracking-widest uppercase">
                            Drop Unit Here to Dispatch
                        </div>
                    </div>
                </div>

                <div className="flex-[3] h-full relative shadow-2xl flex flex-col gap-6">
                    <div className="p-4 border-2 border-cyber-cyan/30 bg-slate-900 shadow-inner">
                        <h3 className="text-[10px] font-bold text-cyber-cyan/60 uppercase tracking-[0.3em] mb-4">Command Actions</h3>
                        <button
                            onClick={async () => {
                                if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                                    await setDoc(doc(db, 'broadcast_alerts', 'latest'), {
                                        id: 'alert-' + Date.now(),
                                        timestamp: serverTimestamp(),
                                        message: 'EMERGENCY: EVACUATE REGION // INITIALIZE SOS UPLINK',
                                        status: 'active'
                                    });
                                    setToast({ message: 'BROADCAST ALERT SENT TO MOBILE', type: 'info' });
                                }
                            }}
                            className="w-full py-4 bg-slate-800 border-2 border-cyber-cyan text-cyber-cyan font-bold uppercase tracking-[0.3em] hover:bg-cyber-cyan hover:text-slate-950 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-95"
                        >
                            Broadcast SOS Link
                        </button>
                    </div>
                    <div className="flex-1 min-h-0">
                        <UnitSidebar
                            units={sidebarUnits}
                            logs={logs}
                            themeColor={selectedMission.themeColor}
                        />
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-24 right-10 z-[100] animate-in slide-in-from-right-10 duration-300">
                    <div className={`px-6 py-3 border-2 shadow-lg flex items-center gap-3 bg-slate-900 font-mono tracking-widest
                        ${toast.type === 'error' ? 'border-alert-rose text-alert-rose shadow-alert-rose/20' : 'border-cyber-cyan text-cyber-cyan shadow-cyber-cyan/20'}
                    `}>
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                        <span className="uppercase font-bold">{toast.message}</span>
                    </div>
                </div>
            )}
            {/* SOS Alert Modal */}
            {isSOSModalOpen && activeSOS && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
                    <div className="w-full max-w-2xl border-2 border-alert-rose p-1 bg-slate-900 shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden">
                        <div className="flex justify-between items-center bg-alert-rose px-4 py-2 text-white font-bold tracking-[0.2em] uppercase">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 animate-pulse" />
                                <span>Critical SOS Inbound</span>
                            </div>
                            <button onClick={() => setIsSOSModalOpen(false)} className="hover:text-slate-900 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-scanline">
                            {/* Snapshot Preview */}
                            <div className="relative aspect-video border border-alert-rose/50 bg-slate-950 overflow-hidden group">
                                {activeSOS.snapshot ? (
                                    <img src={activeSOS.snapshot} alt="SOS Snapshot" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-alert-rose/50">
                                        <Camera className="w-12 h-12 mb-2" />
                                        <span className="text-[10px] uppercase">No Vision Data</span>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 flex items-center gap-1 bg-alert-rose/20 px-1 border border-alert-rose/40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-alert-rose animate-pulse" />
                                    <span className="text-[8px] font-bold uppercase text-alert-rose">Live Capture</span>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-col gap-4 font-mono">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-alert-rose/70 uppercase tracking-widest font-bold">Location Data</div>
                                    <div className="flex items-center gap-2 text-white text-sm">
                                        <MapPin className="w-4 h-4 text-alert-rose" />
                                        <span>{activeSOS.lat.toFixed(4)}, {activeSOS.lng.toFixed(4)}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[10px] text-alert-rose/70 uppercase tracking-widest font-bold">Incident Type</div>
                                    <div className="text-white text-sm uppercase px-2 py-1 border border-alert-rose/30 bg-alert-rose/10 inline-block font-bold mt-1">
                                        {activeSOS.type} Signal
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col gap-2">
                                    <button
                                        onClick={handleDeploySOSUnits}
                                        className="w-full py-3 bg-alert-rose text-white font-bold uppercase tracking-widest text-xs hover:bg-rose-600 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Deploy Forces
                                    </button>
                                    <button
                                        onClick={handleAcknowledgeSOS}
                                        className="w-full py-3 border border-alert-rose/40 text-alert-rose font-bold uppercase tracking-widest text-[10px] hover:bg-alert-rose/10 transition-all"
                                    >
                                        Acknowledge Only
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-3 border-t border-alert-rose/20 flex items-center justify-center">
                            <div className="text-[8px] text-alert-rose/50 animate-pulse uppercase tracking-[0.3em]">
                                Tracking high-frequency distress loop // encrypted uplink established
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </HUDLayout>
    );
}

export default function TacticalPage() {
    return (
        <Suspense fallback={<div className="h-full w-full bg-slate-950 flex items-center justify-center text-cyber-cyan">SYNCHRONIZING SATELLITE...</div>}>
            <TacticalDashboardContent />
        </Suspense>
    );
}
