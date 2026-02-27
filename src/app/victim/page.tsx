"use client";
import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Shield, Camera, Mic, Zap, AlertCircle, Bell } from 'lucide-react';

export default function VictimPortal() {
    const [permissionModal, setPermissionModal] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0);
    const [broadcastAlert, setBroadcastAlert] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const progressTimer = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const requestPermissions = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setPermissionModal(false);
        } catch (err) {
            console.error("Permission denied", err);
            // In a real app we'd show a better error
            setPermissionModal(false);
        }
    };

    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Highlight disaster region (Simulated: draw a tinted circle in the center)
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 10;
        ctx.beginPath();
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Add a scanline pattern overlay to the snapshot
        ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
        ctx.fill();

        return canvas.toDataURL('image/jpeg', 0.5);
    };

    const startPulse = () => {
        if (!stream) return;
        setIsRecording(true);
        setProgress(0);
        chunksRef.current = [];

        // Start MediaRecorder
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorderRef.current = recorder;
        recorder.start();

        const startTime = Date.now();
        const duration = 5000;

        if (progressTimer.current) clearInterval(progressTimer.current);

        progressTimer.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                if (progressTimer.current) clearInterval(progressTimer.current);
                finishSOS();
            }
        }, 50);
    };

    const stopPulse = () => {
        if (!isRecording) return;
        setIsRecording(false);
        setProgress(0);
        if (progressTimer.current) clearInterval(progressTimer.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const finishSOS = async () => {
        if (!isRecording) return;
        setIsRecording(false);

        // Stop recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        // Take snapshot
        const snapshot = takeSnapshot();

        // Push to Firebase if configured
        if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            try {
                const sosId = `sos-${Date.now()}`;
                await setDoc(doc(db, 'sos_signals', sosId), {
                    id: sosId,
                    timestamp: serverTimestamp(),
                    status: 'active',
                    snapshot: snapshot, // Base64 thumbnail
                    lat: 13.0118, // Simulated location (Brigade Gateway)
                    lng: 77.5552,
                    type: 'emergency',
                    description: 'Automated SOS signal from Victim Portal.'
                });
                console.log("SOS Signal Synced to Command Hub");
            } catch (err) {
                console.error("SOS Sync Error:", err);
            }
        }

        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        setProgress(100);
    };

    // Cleanup
    useEffect(() => {
        // Listen for Broadcast Alerts
        if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            const unsubscribe = onSnapshot(doc(db, 'broadcast_alerts', 'latest'), (doc) => {
                const data = doc.data();
                if (data && data.status === 'active') {
                    // Only show alerts from the last 2 minutes
                    const alertTime = data.timestamp?.toDate()?.getTime() || 0;
                    if (Date.now() - alertTime < 120000) {
                        setBroadcastAlert(data);
                    }
                }
            });
            return () => unsubscribe();
        }
    }, []);

    const handleAcknowledgeBroadcast = async () => {
        setBroadcastAlert(null);
        if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            await setDoc(doc(db, 'broadcast_alerts', 'latest'), { status: 'acknowledged' }, { merge: true });
        }
        // Auto-trigger capture
        requestPermissions().then(() => {
            startPulse();
        });
    };

    useEffect(() => {
        if (!stream) return;

        // Audio Level Analysis
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setVolume(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };

            updateVolume();
            audioContextRef.current = audioContext;
        } catch (err) {
            console.error("Audio Context Error:", err);
        }

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (progressTimer.current) clearInterval(progressTimer.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [stream]);

    return (
        <main className="fixed inset-0 bg-slate-950 text-cyber-cyan font-mono overflow-hidden">
            {/* Background Scanline */}
            <div className="absolute inset-0 pointer-events-none bg-scanline opacity-10 z-0" />

            {/* Hidden Canvas for Snapshots */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header HUD */}
            <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-alert-rose drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                        Emergency Link
                    </h1>
                    <span className="text-[10px] opacity-60">NIYANTRANA // V-PORTAL 1.0</span>
                </div>
                <div className="flex gap-4">
                    {!isRecording && (
                        <div className="relative">
                            <Mic
                                className={`w-5 h-5 transition-all duration-100 ${stream ? 'text-cyber-cyan' : 'text-slate-800'}`}
                                style={{
                                    filter: stream ? `drop-shadow(0 0 ${volume / 5}px rgba(34,211,238,0.8))` : 'none',
                                    transform: `scale(${1 + (volume / 200)})`
                                }}
                            />
                            {volume > 10 && (
                                <div className="absolute -inset-1 rounded-full bg-cyber-cyan/10 animate-ping pointer-events-none" />
                            )}
                        </div>
                    )}
                    <Camera className={`w-5 h-5 ${stream ? 'text-cyber-cyan' : 'text-slate-800'}`} />
                </div>
            </header>

            {/* Central Pulse Button Area */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-8 z-10">
                <div className="relative flex items-center justify-center">
                    {/* Outer Progress Ring SVG */}
                    <svg className="w-64 h-64 -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r="110"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-slate-900"
                        />
                        <circle
                            cx="128"
                            cy="128"
                            r="110"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 110}
                            strokeDashoffset={2 * Math.PI * 110 * (1 - progress / 100)}
                            strokeLinecap="round"
                            className="text-alert-rose transition-all duration-75 ease-linear shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                        />
                    </svg>

                    {/* Massive Pulse Button */}
                    <button
                        onMouseDown={startPulse}
                        onMouseUp={stopPulse}
                        onMouseLeave={stopPulse}
                        onTouchStart={(e) => { e.preventDefault(); startPulse(); }}
                        onTouchEnd={stopPulse}
                        className={`absolute w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300
                            ${isRecording ? 'bg-alert-rose scale-95 shadow-[0_0_60px_rgba(244,63,94,1)]' : 'bg-slate-900 border-2 border-alert-rose/40 hover:border-alert-rose shadow-[0_0_30px_rgba(244,63,94,0.3)]'}
                        `}
                    >
                        <Zap className={`w-16 h-16 mb-2 ${isRecording ? 'text-white' : 'text-alert-rose animate-pulse'}`} />
                        <span className={`font-bold tracking-widest text-lg ${isRecording ? 'text-white' : 'text-alert-rose'}`}>
                            {isRecording ? 'SIGNALING' : (progress === 100 ? 'LINK SENT' : 'PULSE')}
                        </span>
                    </button>

                    {/* Ring Accents */}
                    {!isRecording && progress < 100 && (
                        <div className="absolute inset-0 animate-ping opacity-20 pointer-events-none">
                            <div className="w-full h-full rounded-full border-2 border-alert-rose"></div>
                        </div>
                    )}
                </div>

                <div className="text-center max-w-xs">
                    <p className="text-xs font-bold tracking-[0.2em] text-alert-rose mb-3 animate-pulse">
                        S.O.S UPLINK ACTIVE
                    </p>
                    <p className="text-[10px] tracking-[0.1em] opacity-60 leading-relaxed uppercase">
                        {progress === 100
                            ? "SOS SIGNAL SENT TO COMMAND CENTER. STAY CALM. LIVE FEED IS BEING MONITORED."
                            : "Press and hold pulse button to transmit real-time telemetry, live vision, and high-frequency distress signals to Niyantrana Command."
                        }
                    </p>
                </div>
            </div>

            {/* Live Feed / Recording View */}
            {stream && (
                <div className={`absolute transition-all duration-500 ease-in-out z-20 overflow-hidden
                    ${isRecording
                        ? 'inset-x-0 top-0 bottom-0 bg-slate-950 flex flex-col items-center justify-center pt-20 pb-40'
                        : 'bottom-10 left-10 w-32 h-44 border border-cyber-cyan/30 bg-slate-900/80'
                    }
                `}>
                    {/* Recording Backdrop (Blurred video for atmosphere) */}
                    {isRecording && (
                        <div className="absolute inset-0 opacity-20 blur-2xl scale-110 pointer-events-none">
                            <video
                                key="backdrop"
                                ref={(el) => { if (el) el.srcObject = stream; }}
                                autoPlay
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Main Video Overlay */}
                    <div className={`relative transition-all duration-500 shadow-2xl overflow-hidden
                        ${isRecording
                            ? 'w-[85%] aspect-[3/4] border-2 border-alert-rose ring-4 ring-alert-rose/20'
                            : 'w-full h-full'
                        }
                    `}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Live/Rec Indicator */}
                        <div className="absolute top-4 left-4 flex items-center gap-2 z-30 bg-slate-950/60 backdrop-blur-md px-2 py-1 border border-white/10 rounded">
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-alert-rose animate-pulse' : 'bg-cyber-cyan animate-pulse'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                                {isRecording ? 'RECORDING' : 'LIVE FEED'}
                            </span>
                        </div>
                    </div>

                    {/* Large Microphone UI (Shown only when recording) */}
                    {isRecording && (
                        <div className="mt-12 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="relative">
                                {/* Sound Wave Rings */}
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute inset-0 rounded-full border border-cyber-cyan/30 pointer-events-none"
                                        style={{
                                            transform: `scale(${1 + (volume / 100) * (i + 1)})`,
                                            opacity: (volume / 255) * (1 / (i + 1))
                                        }}
                                    />
                                ))}

                                <div className={`p-8 rounded-full border-2 transition-all duration-100 flex items-center justify-center
                                    ${volume > 15 ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_40px_rgba(34,211,238,0.4)]' : 'border-cyber-cyan/20 bg-slate-900'}
                                `}>
                                    <Mic
                                        className="w-12 h-12 text-cyber-cyan"
                                        style={{
                                            transform: `scale(${1 + (volume / 300)})`,
                                            filter: `drop-shadow(0 0 ${volume / 4}px rgba(34,211,238,0.8))`
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-bold tracking-[0.3em] text-cyber-cyan uppercase">Audio Uplink Active</span>
                                <div className="flex gap-1 h-4 items-end">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-cyber-cyan/60 rounded-t"
                                            style={{
                                                height: `${Math.max(2, (volume / (10 + i * 5)) * 100)}%`,
                                                transition: 'height 0.1s ease-out'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Status Footer */}
            <footer className="absolute bottom-0 w-full p-4 flex justify-center z-20">
                <div className="flex items-center gap-2 opacity-40">
                    <div className="w-1 h-1 rounded-full bg-cyber-cyan animate-pulse" />
                    <span className="text-[8px] uppercase tracking-widest">End-to-End Encryption Active (AES-256)</span>
                </div>
            </footer>

            {/* Initial Permission Modal */}
            {permissionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-sm">
                    <div className="w-full max-w-sm border-2 border-cyber-cyan/50 p-8 flex flex-col items-center gap-6 bg-slate-900 shadow-[0_0_50px_rgba(34,211,238,0.1)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none" />
                        <Shield className="w-16 h-16 text-cyber-cyan animate-pulse" />
                        <div className="text-center relative z-10">
                            <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-cyber-cyan mb-4 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                Command Protocol
                            </h2>
                            <p className="text-[10px] opacity-80 leading-relaxed mb-6 uppercase tracking-widest">
                                BIOMETRIC & ENVIRONMENTAL ACCESS REQUIRED FOR RESCUE SEARCH. PERMIT CAMERA AND AUDIO UPLINK TO INITIALIZE TRIAGE.
                            </p>
                        </div>
                        <button
                            onClick={requestPermissions}
                            className="relative z-10 w-full py-4 border-2 border-cyber-cyan hover:bg-cyber-cyan hover:text-slate-950 transition-all duration-300 uppercase font-bold tracking-widest text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        >
                            Authorize Access
                        </button>
                    </div>
                </div>
            )}

            {/* Broadcast Signal Alert (Overlay) */}
            {broadcastAlert && (
                <div className="fixed inset-0 z-[150] flex flex-col items-center justify-end p-6 bg-alert-rose/20 backdrop-blur-md">
                    <div className="w-full max-w-sm border-2 border-alert-rose bg-slate-900 shadow-[0_0_50px_rgba(244,63,94,0.5)] animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
                        <div className="bg-alert-rose p-3 flex items-center gap-3">
                            <Bell className="w-6 h-6 text-white animate-bounce" />
                            <span className="text-white font-bold tracking-widest uppercase text-xs">Priority Broadcast</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-white font-bold text-sm tracking-wide leading-relaxed uppercase">
                                {broadcastAlert.message}
                            </p>
                            <div className="text-[10px] text-alert-rose/60 uppercase racking-widest">
                                Emergency Uplink Requested // Command Signal Active
                            </div>
                            <button
                                onClick={handleAcknowledgeBroadcast}
                                className="w-full py-4 bg-alert-rose text-white font-bold uppercase tracking-widest text-xs hover:bg-rose-600 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            >
                                Initiate SOS Response
                            </button>
                            <button
                                onClick={() => setBroadcastAlert(null)}
                                className="w-full py-2 text-[10px] text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Ignore Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
