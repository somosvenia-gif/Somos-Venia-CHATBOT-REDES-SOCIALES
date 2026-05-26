import React, { useState } from 'react';
import { Customer } from '../types';
import { TrendingUp, MessageSquare, ArrowUpRight, Zap, Target, Award, Users } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  stitchMode: boolean;
}

export default function DashboardSection({ customers, stitchMode }: DashboardProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // ── Stats calculadas desde datos REALES ──────────────────────────────────
  const totalContacts = customers.length;
  const activeWhatsApp  = customers.filter(c => c.platform === 'whatsapp').length;
  const activeInstagram = customers.filter(c => c.platform === 'instagram').length;
  const activeFacebook  = customers.filter(c => c.platform === 'facebook').length;

  const totalMsgs       = customers.reduce((acc, c) => acc + c.messages.length, 0);
  const aiActiveCount   = customers.filter(c => c.aiActive).length;
  const aiPct           = totalContacts > 0 ? Math.round((aiActiveCount / totalContacts) * 100) : 0;

  // Mensajes por mes (últimos 12 meses desde timestamps reales — fallback a 0)
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const currentMonth = new Date().getMonth(); // 0‑indexed
  const trafficData = Array(12).fill(0).map((_, i) => {
    const targetMonth = (currentMonth - 11 + i + 12) % 12;
    return customers.reduce((acc, c) => {
      return acc + c.messages.filter(m => {
        // Intenta parsear el timestamp del mensaje; si falla, cuenta solo el mes actual
        try {
          const d = new Date(m.timestamp);
          return !isNaN(d.getTime()) && d.getMonth() === targetMonth;
        } catch { return false; }
      }).length;
    }, 0);
  });

  // Si no hay datos reales suficientes muestra zeros limpios
  const maxVal    = Math.max(...trafficData, 1);
  const chartH    = 160;
  const chartW    = 500;

  const points = trafficData.map((val, i) => ({
    x: (i / (trafficData.length - 1)) * (chartW - 40) + 20,
    y: chartH - (val / maxVal) * (chartH - 40) - 10,
  }));

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX  = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  // Porcentajes de canal
  const whatsappPct  = totalContacts > 0 ? Math.round((activeWhatsApp  / totalContacts) * 100) : 0;
  const instagramPct = totalContacts > 0 ? Math.round((activeInstagram / totalContacts) * 100) : 0;
  const facebookPct  = totalContacts > 0 ? Math.round((activeFacebook  / totalContacts) * 100) : 0;

  return (
    <div id="dashboard-container" className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight flex items-center gap-2 ${
            stitchMode ? 'text-white' : 'text-slate-900'
          }`}>
            {stitchMode ? '🚀 Panel de Control de la Ohana Galáctica' : '🎛️ Panel General de Operaciones'}
          </h2>
          <p className={`text-sm mt-1 ${stitchMode ? 'text-pink-200' : 'text-slate-500'}`}>
            {stitchMode
              ? '¡Ih! Stitch vigila y mide todo el caos de comunicación cósmica de tus naves.'
              : 'Supervisa el rendimiento de tu equipo, los tiempos de respuesta y la actividad por canal en tiempo real.'}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border shadow-sm ${
          stitchMode ? 'bg-[#201f1f] text-pink-300 border-pink-500/20' : 'bg-slate-100 text-cyan-700 border-slate-200'
        }`}>
          <Zap className="w-3 h-3 animate-pulse" />
          <span>TELEMETRÍA EN TIEMPO REAL</span>
        </div>
      </div>

      {/* Banner Stitch */}
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

      {/* Tarjetas de métricas reales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Total Contactos */}
        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Total Contactos</p>
            <Users className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
              {totalContacts.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {totalContacts === 0 ? 'Esperando primeros mensajes reales' : 'Conversaciones activas en bandeja'}
          </p>
        </div>

        {/* WhatsApp */}
        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">WhatsApp</p>
            <MessageSquare className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
              {activeWhatsApp.toLocaleString()}
            </span>
            {totalContacts > 0 && (
              <span className="text-cyan-600 text-xs font-semibold mb-1">{whatsappPct}% del total</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">Contactos ingresados por WhatsApp</p>
        </div>

        {/* Instagram */}
        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Instagram</p>
            <MessageSquare className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
              {activeInstagram.toLocaleString()}
            </span>
            {totalContacts > 0 && (
              <span className="text-rose-500 text-xs font-semibold mb-1">{instagramPct}% del total</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">Contactos ingresados por Instagram</p>
        </div>

        {/* Facebook */}
        <div className={`border p-5 rounded-2xl space-y-2 hover:border-cyan-600 transition-all shadow-md group ${
          stitchMode ? 'bg-indigo-950/20 border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-slate-500">
            <p className="text-xs font-bold uppercase tracking-wider">Facebook</p>
            <MessageSquare className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
              {activeFacebook.toLocaleString()}
            </span>
            {totalContacts > 0 && (
              <span className="text-slate-500 text-xs font-semibold mb-1">{facebookPct}% del total</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">Contactos ingresados por Facebook</p>
        </div>

      </div>

      {/* Gráfica + Métricas de IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfica de tráfico mensual */}
        <div className={`p-5 rounded-2xl border shadow-lg lg:col-span-2 space-y-3 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h4 className={`text-sm font-semibold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
                Tráfico Mensual de Conversaciones
              </h4>
              <p className="text-xs text-slate-400">Mensajes por mes — datos reales de la bandeja</p>
            </div>
            <span className="text-xs font-mono text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-100">
              {stitchMode ? 'Energía Galáctica' : 'Tráfico en Vivo'}
            </span>
          </div>

          <div className="relative pt-6">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0891b2" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="stitchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#d70357" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#44d8f1" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {[0,1,2,3,4].map(g => {
                const y = 10 + (g * (chartH - 30)) / 4;
                return <line key={g} x1="20" y1={y} x2={chartW - 20} y2={y}
                  stroke={stitchMode ? '#2a2a2a' : '#f1f5f9'} strokeWidth="1" strokeDasharray="4 4" />;
              })}

              <path d={areaPath} fill={stitchMode ? 'url(#stitchGrad)' : 'url(#chartGrad)'} />
              <path d={linePath} fill="none"
                stroke={stitchMode ? '#ffd9de' : '#0891b2'} strokeWidth="3.5" strokeLinecap="round" />

              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill="white"
                  stroke={stitchMode ? '#ffb2be' : '#0891b2'} strokeWidth="3">
                  <title>{months[(currentMonth - 11 + i + 12) % 12]}: {trafficData[i]} mensajes</title>
                </circle>
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-5 pt-2">
            {Array(12).fill(0).map((_, i) => (
              <span key={i}>{months[(currentMonth - 11 + i + 12) % 12]}</span>
            ))}
          </div>
        </div>

        {/* Métricas de IA */}
        <div className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <h4 className={`text-sm font-semibold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
            Actividad del Sistema IA
          </h4>

          <div className="relative flex flex-col items-center justify-center py-4">
            <svg viewBox="0 0 120 70" className="w-40 h-auto">
              <path d="M 15 65 A 45 45 0 0 1 105 65" fill="none"
                stroke={stitchMode ? '#2a2a2a' : '#e2e8f0'} strokeWidth="10" strokeLinecap="round" />
              <path d="M 15 65 A 45 45 0 0 1 105 65" fill="none"
                stroke={stitchMode ? '#ffd9de' : '#0891b2'} strokeWidth="10" strokeLinecap="round"
                strokeDasharray="141"
                strokeDashoffset={`${141 - (141 * aiPct / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute top-[38px] text-center">
              <span className={`text-2xl font-black font-mono tracking-tight ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
                {aiPct}%
              </span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">IA Activa</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-cyan-600"></div>
                <span>Contactos con IA activada</span>
              </div>
              <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>
                {aiActiveCount}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${aiPct}%` }}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                <span>Total mensajes en bandeja</span>
              </div>
              <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>
                {totalMsgs}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                style={{ width: totalMsgs > 0 ? '100%' : '0%' }}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Canales conectados</span>
              </div>
              <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>
                3 / 3
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Widgets de estado del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado Webhook</span>
            <span className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-800'}`}>
              Meta API v20.0
            </span>
            <span className="text-[11px] text-emerald-500 block font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Activo y escuchando
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Base de Datos</span>
            <span className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-800'}`}>
              Firebase Realtime DB
            </span>
            <span className="text-[11px] text-slate-500 block">Sincronización en tiempo real</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Motor de IA</span>
            <span className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-800'}`}>Gemini 3.5 Flash</span>
            <span className="text-[11px] text-cyan-600 block font-bold">Respondiendo automáticamente</span>
          </div>
        </div>
      </div>

    </div>
  );
}
