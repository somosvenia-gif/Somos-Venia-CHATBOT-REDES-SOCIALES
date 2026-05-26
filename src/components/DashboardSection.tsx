import React, { useState } from 'react';
import { Customer } from '../types';
import { TrendingUp, MessageSquare, ArrowUpRight, Zap, Target, Award, Users } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  stitchMode: boolean;
}

export default function DashboardSection({ customers, stitchMode }: DashboardProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Stats Calculations
  const totalContacts = customers.length + 12838; // 12,842 total in screenshot mockup
  const activeWhatsApp = 8211;
  const activeInstagram = 3490;
  const activeFacebook = 1141;

  // Render clean responsive SVGs for analytics
  const trafficData = [450, 520, 680, 890, 1100, 950, 800, 720, 900, 1280, 1150, 1340];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const maxVal = Math.max(...trafficData);
  const chartHeight = 160;
  const chartWidth = 500;

  // Path generator for curved area chart
  const points = trafficData.map((val, index) => {
    const x = (index / (trafficData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (val / maxVal) * (chartHeight - 40) - 10;
    return { x, y };
  });

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Add nice cubic bezier smoothing
    const prev = points[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight flex items-center gap-2 ${
            stitchMode ? 'text-white' : 'text-slate-900'
          }`}>
            {stitchMode ? '🚀 Panel de Control de la Ohana Galáctica' : '🎛️ Dashboard Geral de Operações'}
          </h2>
          <p className={`text-sm mt-1 ${stitchMode ? 'text-pink-200' : 'text-slate-500'}`}>
            {stitchMode 
              ? '¡Ih! Stitch vigila y mide todo el caos de comunicación cósmica de tus naves.' 
              : 'Supervise el rendimiento de asistencia de su equipo, los tiempos de respuesta y la segmentación del canal.'}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border shadow-sm ${
          stitchMode ? 'bg-[#201f1f] text-pink-300 border-pink-500/20' : 'bg-slate-100 text-cyan-700 border-slate-200'
        }`}>
          <Zap className="w-3 h-3 animate-pulse" />
          <span>REAL-TIME TELEMETRY CONNECTED</span>
        </div>
      </div>

      {/* Stitch Welcome Banner if Stitch mode is on */}
      {stitchMode && (
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-900/40 via-[#d70357]/20 to-surface-container-high border-l-4 border-[#ffd9de] p-5 rounded-xl shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-[#44d8f1]/20 to-transparent pointer-events-none opacity-55"></div>
          <div className="flex items-start gap-4">
            <span className="text-4xl">🌺</span>
            <div>
              <h3 className="text-lg font-bold text-[#ffb2be]">¡Aloha significa Familia!</h3>
              <p className="text-sm text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
                "Ohana significa familia, y la familia nunca abandona a un cliente con tiquetes rezagados". 
                Stitch ha pintado la oficina con flores de hibisco y configurado el respondedor ultra cósmico con 
                fórmulas estelares del doctor Jumba Jookiba. ¡Ih!
              </p>
              <div className="mt-3 flex gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-300 font-mono">Modelo: Gemini 3.5 Flash</span>
                <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/30 rounded text-xs text-[#ffb2be] font-mono font-bold">Estado: ¡SÚPER ACTIVO! 👽</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Total Contactos</p>
            <Users className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>{totalContacts.toLocaleString()}</span>
            <span className="text-emerald-500 text-xs font-semibold mb-1 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Suscripciones activas acumuladas</p>
        </div>

        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Activos en WhatsApp</p>
            <MessageSquare className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>{activeWhatsApp.toLocaleString()}</span>
            <span className="text-cyan-600 text-xs font-semibold mb-1">64% del total</span>
          </div>
          <p className="text-[10px] text-slate-400">Canal de mayor volumen corporatvo</p>
        </div>

        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Activos en Instagram</p>
            <MessageSquare className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>{activeInstagram.toLocaleString()}</span>
            <span className="text-rose-500 text-xs font-semibold mb-1">27% del total</span>
          </div>
          <p className="text-[10px] text-slate-400">Consultas de catálogo e influencers</p>
        </div>

        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Activos en Facebook</p>
            <MessageSquare className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>{activeFacebook.toLocaleString()}</span>
            <span className="text-slate-500 text-xs font-semibold mb-1">9% del total</span>
          </div>
          <p className="text-[10px] text-slate-400">Flujo tradicional de soporte técnico</p>
        </div>
      </div>

      {/* Two Columns Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Curved Area Traffice Chart */}
        <div className={`p-5 rounded-2xl border shadow-lg lg:col-span-2 space-y-3 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h4 className={`text-sm font-semibold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>Tránsito Mensual de Conversaciones</h4>
              <p className="text-xs text-slate-400">Interacciones consolidadas multicanal en 2026</p>
            </div>
            <span className="text-xs font-mono text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-100">
              {stitchMode ? 'Energía Galáctica' : 'Tráfico Inteligente'}
            </span>
          </div>

          <div className="relative pt-6">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="stitchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d70357" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#44d8f1" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map((gridLine) => {
                const y = 10 + (gridLine * (chartHeight - 30)) / 4;
                return (
                  <line 
                    key={gridLine} 
                    x1="20" 
                    y1={y} 
                    x2={chartWidth - 20} 
                    y2={y} 
                    stroke={stitchMode ? "#2a2a2a" : "#f1f5f9"} 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                );
              })}

              {/* Area path */}
              <path d={areaPath} fill={stitchMode ? "url(#stitchGrad)" : "url(#chartGrad)"} />

              {/* Path line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke={stitchMode ? "#ffd9de" : "#0891b2"} 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />

              {/* Data points */}
              {points.map((p, index) => (
                <circle
                  key={index}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  className="fill-white stroke-cyan-600 cursor-pointer hover:r-7 transition-all"
                  stroke={stitchMode ? "#ffb2be" : "#0891b2"}
                  strokeWidth="3"
                >
                  <title>{months[index]}: {trafficData[index]}</title>
                </circle>
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-5 pt-2">
            {months.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
        </div>

        {/* Team Performance Metric Guage */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <h4 className={`text-sm font-semibold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>Eficiencia Comercial e IA</h4>
          
          <div className="relative flex flex-col items-center justify-center py-4">
            {/* SVG polar arc representing 94.5% SLA Match */}
            <svg viewBox="0 0 120 70" className="w-40 h-auto">
              {/* Background Arc */}
              <path
                d="M 15 65 A 45 45 0 0 1 105 65"
                fill="none"
                stroke={stitchMode ? "#2a2a2a" : "#e2e8f0"}
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Colored active path */}
              <path
                d="M 15 65 A 45 45 0 0 1 105 65"
                fill="none"
                stroke={stitchMode ? "#ffd9de" : "#0891b2"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="141"
                strokeDashoffset="10" // Represents 93% efficiency
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute top-[38px] text-center">
              <span className={`text-2xl font-black font-mono tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>93.2%</span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">SLA Cumplido</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-cyan-600"></div>
                <span>Tiempo Medio Respuesta</span>
              </div>
              <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>1.2m</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-600 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                <span>Tasa de Autoresolución IA</span>
              </div>
              <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>78.4%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '78%' }}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>Puntuación de Humores (CSAT)</span>
              </div>
              <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>4.9 / 5.0</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Target/Goal widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Meta Semanal</span>
            <span className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-800'}`}>1,500 Clientes Nuevos</span>
            <span className="text-[11px] text-emerald-500 block font-bold">+14% respecto ayer</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Soporte Mejor Agente</span>
            <span className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-800'}`}>Marcus Vance (128 resueltos)</span>
            <span className="text-[11px] text-slate-500 block">Tiempo de respuesta óptimo</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fuerza Conversacional IA</span>
            <span className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-800'}`}>OmniBot Inteligente</span>
            <span className="text-[11px] text-cyan-600 block font-bold">Conectado a Gemini 3.5 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
