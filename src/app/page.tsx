"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const SCENARIOS = [
  { id: 'alpha', title: 'INCIDENT ALPHA: FIRE', themeColor: 'rose', description: 'Major structural fire in commercial zone.' },
  { id: 'beta', title: 'INCIDENT BETA: FLOOD', themeColor: 'blue', description: 'Flash flooding reported in low-lying areas.' },
  { id: 'gamma', title: 'INCIDENT GAMMA: AVIATION', themeColor: 'amber', description: 'Aviation emergency. Aircraft off runway.' }
];

export default function Home() {
  const [step, setStep] = useState<'hero' | 'scenarios'>('hero');
  const router = useRouter();

  const handleScenarioSelect = (id: string) => {
    router.push(`/tactical?mission=${id}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 font-mono text-cyber-cyan flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-scanline opacity-20 z-10" />

      <div className="z-20 flex flex-col items-center w-full max-w-4xl px-6">
        {step === 'hero' ? (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
            <div className="mb-12">
              <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-[0.4em] drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] mb-4">
                Niyantrana
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50 mb-6" />
              <p className="text-xl md:text-2xl text-cyber-cyan/80 tracking-[0.2em] uppercase font-light">
                Advanced Command & Control S.O.S
              </p>
            </div>

            <button
              onClick={() => setStep('scenarios')}
              className="group relative px-12 py-4 border-2 border-cyber-cyan/50 hover:border-cyber-cyan hover:bg-cyber-cyan/10 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 text-lg font-bold tracking-widest uppercase">
                Continue <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute top-0 left-0 w-0 h-full bg-cyber-cyan/20 group-hover:w-full transition-all duration-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-12 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold uppercase tracking-widest text-cyber-cyan drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-2">
                Tactical Scenario Selection
              </h2>
              <p className="text-alert-rose tracking-widest uppercase text-xs animate-pulse">
                Select Incident to Initialize Uplink
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {SCENARIOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleScenarioSelect(m.id)}
                  className={`p-8 border-2 transition-all duration-300 text-left relative group bg-slate-900 shadow-lg
                                    ${m.themeColor === 'rose' ? 'border-rose-500/30 hover:border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] text-rose-500' : ''}
                                    ${m.themeColor === 'blue' ? 'border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] text-blue-500' : ''}
                                    ${m.themeColor === 'amber' ? 'border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] text-amber-500' : ''}
                                    `}
                >
                  <div className="font-bold tracking-widest text-xl mb-3 drop-shadow-md">
                    {m.title.split(': ')[0]}
                    <br />
                    <span className="text-2xl">{m.title.split(': ')[1]}</span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed font-semibold">
                    {m.description}
                  </p>

                  {/* Accent corner */}
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('hero')}
              className="mt-12 text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity underline underline-offset-4"
            >
              Return to Command Root
            </button>
          </div>
        )}
      </div>

      {/* Ambient Background Elements */}
      <div className="absolute bottom-10 left-10 w-32 h-32 border border-cyber-cyan/10 rounded-full animate-pulse-slow" />
      <div className="absolute top-10 right-10 w-24 h-24 border border-cyber-cyan/10 rounded-full animate-pulse-slow delay-700" />
    </div>
  );
}
