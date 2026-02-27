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

      <div className="z-20 flex flex-col items-center justify-center w-full max-w-4xl px-6 min-h-screen">
        {step === 'hero' ? (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000 w-full relative">
            <div className="mb-12 relative group w-full px-4 cursor-default">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.4em] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-4 relative z-10 transition-all duration-300 animate-glitch-primary whitespace-nowrap overflow-visible leading-none select-none text-center w-full">
                Niyantrana
              </h1>

              {/* Secondary Chromatic Abberation Layer */}
              <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-40 select-none pointer-events-none transition-all duration-200">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.4em] text-alert-rose translate-x-1 animate-glitch-secondary blur-[0.5px] whitespace-nowrap text-center w-full">Niyantrana</h1>
              </div>

              <div className="h-[2px] w-48 md:w-96 mx-auto bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-40 mt-8 mb-6 animate-pulse" />
              <p className="text-sm md:text-xl text-cyber-cyan/60 tracking-[0.4em] uppercase font-bold animate-in slide-in-from-top-4 duration-1000">
                Advanced Tactical Command & Control
              </p>
            </div>

            <button
              onClick={() => setStep('scenarios')}
              className="group relative px-12 py-4 border-2 border-cyber-cyan/50 hover:border-cyber-cyan hover:bg-cyber-cyan/10 transition-all duration-300 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[0_0_50px_rgba(34,211,238,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-2 text-lg font-bold tracking-widest uppercase text-white group-hover:text-cyber-cyan transition-colors">
                Initialize System <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute top-0 left-0 w-0 h-full bg-cyber-cyan/20 group-hover:w-full transition-all duration-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-12 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-2">
                Tactical Scenario Selection
              </h2>
              <p className="text-cyber-cyan tracking-[0.4em] uppercase text-xs animate-pulse font-bold">
                Select Incident to Initialize Uplink
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {SCENARIOS.map((m, index) => (
                <button
                  key={m.id}
                  onClick={() => handleScenarioSelect(m.id)}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className={`p-8 border-2 transition-all duration-500 text-left relative group bg-slate-900 shadow-lg animate-in slide-in-from-bottom-8 fill-mode-both
                                    ${m.themeColor === 'rose' ? 'border-rose-500/10 hover:border-rose-500 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] text-rose-500/70 hover:text-rose-500' : ''}
                                    ${m.themeColor === 'blue' ? 'border-blue-500/10 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] text-blue-500/70 hover:text-blue-500' : ''}
                                    ${m.themeColor === 'amber' ? 'border-amber-500/10 hover:border-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] text-amber-500/70 hover:text-amber-500' : ''}
                                    `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 font-bold tracking-widest text-xl mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                    {m.title.split(': ')[0]}
                    <br />
                    <span className="text-2xl text-white group-hover:text-inherit transition-colors">{m.title.split(': ')[1]}</span>
                  </div>
                  <p className="relative z-10 text-xs opacity-70 group-hover:opacity-100 leading-relaxed font-semibold transition-opacity">
                    {m.description}
                  </p>

                  <div className={`absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-500`} />

                  {/* Accent corner */}
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current opacity-20 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125" />
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
