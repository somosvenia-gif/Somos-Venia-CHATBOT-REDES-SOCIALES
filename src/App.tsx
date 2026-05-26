import React, { useState, useEffect } from 'react';
import { Customer } from './types';
import { INITIAL_CUSTOMERS } from './initialData';
import DashboardSection from './components/DashboardSection';
import InboxSection from './components/InboxSection';
import AutomationsSection from './components/AutomationsSection';
import ContactsSection from './components/ContactsSection';
import SettingsSection from './components/SettingsSection';
import { 
  LayoutDashboard, Inbox, Sliders, Users, Settings, 
  HelpCircle, LogOut, Radio, Bell, LayoutGrid, Sparkles, Send, Check
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'automations' | 'contacts' | 'settings'>('inbox');
  const [activeCustomerId, setActiveCustomerId] = useState<string>('whatsapp_sarah');
  const [stitchMode, setStitchMode] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('https://omnicrm-chatbot.onrender.com/webhook');

  const [customers, setCustomers] = useState<Customer[]>([]);

  // Periodically fetch customers from server to sync webhooks real-time
  useEffect(() => {
    let active = true;
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setCustomers(data);
          }
        }
      } catch (err) {
        console.error('Failed to sync customers from server:', err);
      }
    };

    fetchCustomers(); // Initial fetch
    const interval = setInterval(fetchCustomers, 3000); // Polling every 3 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Handle single entity update (Notes, tags, or auto-IA toggle)
  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    // Optimistic UI updates
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    try {
      await fetch('/api/customers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: updatedCustomer })
      });
    } catch (err) {
      console.error('Failed to sync customer update:', err);
    }
  };

  // Add new customer instance from modal drawer in Contacts panel
  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    setActiveCustomerId(newCustomer.id);
    try {
      await fetch('/api/customers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: newCustomer })
      });
    } catch (err) {
      console.error('Failed to sync new customer:', err);
    }
  };

  // Single delete customer
  const handleDeleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    const remaining = customers.filter(c => c.id !== id);
    if (remaining.length > 0) {
      setActiveCustomerId(remaining[0].id);
    }
    try {
      await fetch('/api/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  // Switch to Inbox panel with a specific customer active
  const handleSelectCustomerForChat = (id: string) => {
    setActiveCustomerId(id);
    setActiveTab('inbox');
  };

  // Simulated Broadcast Campaign triggered from New Broadcast CTA button
  const handleNewBroadcast = () => {
    const textMsg = prompt(
      stitchMode 
        ? "🌺 ¡CAMPANIA DE BROADCAST GALAXY!\nIntroduce el mensaje de texto para enviar masivamente a todos los miembros de tu Ohana:"
        : "⚡ CAMPAÑA DE BROADCAST EN MASA:\nIntroduce el mensaje para enviar masivamente a todos tus contactos activos (WhatsApp, IG, FB):"
    );
    if (!textMsg) return;

    // Push broadcast message to all active contacts
    setCustomers(prev => prev.map(c => {
      const broadcastMsg = {
        id: Math.random().toString(),
        sender: 'agent' as const,
        text: textMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      return {
        ...c,
        lastMessage: textMsg,
        lastInteractionTime: 'Sent just now',
        messages: [...c.messages, broadcastMsg]
      };
    }));

    alert(stitchMode 
      ? `🌺 ¡Transmisión cósmica enviada con éxito a ${customers.length} naves de la Ohana!`
      : `✅ ¡Broadcast de mensajería masiva distribuido con éxito a sus ${customers.length} contactos!`
    );
  };

  // Stitch funny quotes companion trigger state
  const [stitchQuoteIdx, setStitchQuoteIdx] = useState(0);
  const [showStitchBalloon, setShowStitchBalloon] = useState(false);

  const stitchQuotesList = [
    "¡Ohana significa familia! Y familia significa estar siempre juntos.",
    "¡Meega nala k queens! Jumba dice que la IA automatiza más rápido que su nave espacial.",
    "¿Preguntas? Stitch responde con su procesador cuántico de galaxias.",
    "¡Taka aki! El doctor Pleakley dice que los clientes están de muy buen humor.",
    "¡Aloha! Juguemos con el respondedor automático de Gemini Jumba.",
    "¡Stitch amar a tu Ohana comercial! Dale corazones y ofertas locas."
  ];

  const handleNextStitchQuote = () => {
    setStitchQuoteIdx(prev => (prev + 1) % stitchQuotesList.length);
    setShowStitchBalloon(true);
    setTimeout(() => {
      setShowStitchBalloon(false);
    }, 4500);
  };

  const handleClearMockData = async () => {
    setCustomers([]);
    try {
      await fetch('/api/customers/clear', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear database on server:', err);
    }
  };

  const handleRestoreMockData = async () => {
    try {
      const res = await fetch('/api/customers/restore', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        if (data.length > 0) {
          setActiveCustomerId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to restore database on server:', err);
    }
  };

  return (
    <div id="omni-workspace-root" className={`min-h-screen text-slate-800 antialiased bg-slate-50 flex ${
      stitchMode ? 'stitch-alien-theme text-white bg-[#0e071a]' : ''
    }`}>
      
      {/* SIDE NAVIGATION SHELL */}
      <aside className={`w-64 border-r shrink-0 h-screen sticky top-0 flex flex-col justify-between p-4 ${
        stitchMode 
          ? 'border-pink-500/20 bg-gradient-to-b from-[#1c1b1b] to-indigo-950/20 text-white' 
          : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <div className="space-y-6">
          {/* Logo Group */}
          <div className="px-2 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
              stitchMode ? 'bg-[#d70357] text-white animate-bounce' : 'bg-cyan-600 text-white'
            }`}>
              {stitchMode ? '👾' : 'O'}
            </div>
            <div>
              <h1 className={`text-base font-black tracking-tight flex items-center gap-1 leading-none ${
                stitchMode ? 'text-white' : 'text-slate-950'
              }`}>
                {stitchMode ? 'Lilo CRM' : 'OmniCRM'}
              </h1>
              <span className={`text-[10px] uppercase tracking-widest font-mono leading-none ${
                stitchMode ? 'text-pink-300' : 'text-slate-400'
              }`}>
                {stitchMode ? 'Stitch Edition' : 'Active Session'}
              </span>
            </div>
          </div>

          {/* New Broadcast Call to Action CTA */}
          <button 
            type="button"
            onClick={handleNewBroadcast}
            className={`w-full font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform ${
              stitchMode 
                ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-900/30' 
                : 'bg-cyan-600 text-white hover:bg-cyan-700'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {stitchMode ? 'Transmisión Ohana' : 'Nuevo Broadcast'}
          </button>

          {/* Nav List */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard' 
                  ? (stitchMode ? 'bg-[#201f1f] text-pink-400 border-r-2 border-pink-500 font-bold' : 'bg-slate-100 text-cyan-600 font-bold border-r-2 border-cyan-600') 
                  : (stitchMode ? 'text-slate-400 hover:bg-[#201f1f] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'inbox' 
                  ? (stitchMode ? 'bg-[#201f1f] text-pink-400 border-r-2 border-pink-500 font-bold' : 'bg-slate-100 text-cyan-600 font-bold border-r-2 border-cyan-600') 
                  : (stitchMode ? 'text-slate-400 hover:bg-[#201f1f] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
              }`}
            >
              <Inbox className="w-4 h-4 shrink-0" />
              <span>Bandeja Entrada</span>
            </button>

            <button 
              onClick={() => setActiveTab('automations')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'automations' 
                  ? (stitchMode ? 'bg-[#201f1f] text-pink-400 border-r-2 border-pink-500 font-bold' : 'bg-slate-100 text-cyan-600 font-bold border-r-2 border-cyan-600') 
                  : (stitchMode ? 'text-slate-400 hover:bg-[#201f1f] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Automations</span>
            </button>

            <button 
              onClick={() => setActiveTab('contacts')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'contacts' 
                  ? (stitchMode ? 'bg-[#201f1f] text-pink-400 border-r-2 border-pink-500 font-bold' : 'bg-slate-100 text-cyan-600 font-bold border-r-2 border-cyan-600') 
                  : (stitchMode ? 'text-slate-400 hover:bg-[#201f1f] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Contactos</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'settings' 
                  ? (stitchMode ? 'bg-[#201f1f] text-pink-400 border-r-2 border-pink-500 font-bold' : 'bg-slate-100 text-cyan-600 font-bold border-r-2 border-cyan-600') 
                  : (stitchMode ? 'text-slate-400 hover:bg-[#201f1f] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        {/* Footer info inside sidebar */}
        <div className="space-y-4">
          <div className={`px-2 pt-4 border-t space-y-2 ${stitchMode ? 'border-pink-500/10' : 'border-slate-100'}`}>
            <span className={`block text-[10px] font-bold uppercase tracking-widest leading-none ${
              stitchMode ? 'text-pink-300' : 'text-slate-400'
            }`}>Canal Activo</span>
            <span className={`flex items-center gap-1.5 text-xs font-mono ${
              stitchMode ? 'text-[#ffb2be]' : 'text-cyan-600'
            }`}>
              <Radio className={`w-3.5 h-3.5 animate-pulse ${stitchMode ? 'text-pink-400' : 'text-cyan-500'}`} /> Webhook: Live
            </span>
          </div>

          <div className="space-y-0.5">
            <a 
              href="#" 
              onClick={() => alert("❓ Documentación de OmniCRM: Conéctese con sus API keys corporativas en Settings > Secrets.")}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                stitchMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Ayuda General</span>
            </a>
            <a 
              href="#" 
              onClick={() => {
                if (confirm('¿Cerrar sesión en OmniCRM Workspace Simulado?')) {
                  alert('Sesión cerrada. ¡Hasta luego!');
                }
              }}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                stitchMode ? 'text-slate-300 hover:text-rose-400' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Salir</span>
            </a>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE MAIN WINDOW FRAME */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top App Bar Header Area */}
        <header className={`h-16 border-b backdrop-blur-md sticky top-0 px-6 flex items-center justify-between z-40 ${
          stitchMode 
            ? 'border-pink-500/20 bg-[#131313]/90 text-white' 
            : 'bg-white/95 border-slate-200 text-slate-700'
        }`}>
          {/* Quick Search */}
          <div className="flex items-center gap-6">
            <div className="relative flex items-center">
              <span className={`absolute left-3 ${stitchMode ? 'text-pink-300' : 'text-slate-400'}`}>🔍</span>
              <input 
                type="text"
                placeholder="Búsqueda rápida..."
                onClick={() => alert("🔍 Use los cuadros de búsqueda interactivos integrados en cada sección específica de Bandeja o Contactos para una experiencia más fluida.")}
                className={`border-none text-xs rounded-full pl-8 pr-4 py-1.5 w-64 focus:outline-none cursor-pointer ${
                  stitchMode 
                    ? 'bg-[#201f1f] text-white placeholder-pink-300/50' 
                    : 'bg-slate-100 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
            
            {/* Platform Fast Badges Navigation link shortcuts */}
            <span className={`hidden md:flex gap-4 text-xs font-mono ${
              stitchMode ? 'text-pink-300' : 'text-slate-500'
            }`}>
              <span className="hover:text-cyan-600 cursor-pointer">WhatsApp</span>
              <span className="hover:text-cyan-600 cursor-pointer">Instagram</span>
              <span className="hover:text-cyan-600 cursor-pointer">Facebook</span>
            </span>
          </div>

          {/* Right Controls notification block */}
          <div className="flex items-center gap-4">
            
            {/* System Online Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] ${
              stitchMode 
                ? 'bg-[#201f1f] hover:bg-neutral-800 border-pink-500/20 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{stitchMode ? 'Stitch Activo' : 'Sistemas Activos'}</span>
            </div>

            <button 
              onClick={() => alert("🔔 Ninguna alerta pendiente en este momento")}
              className={`transition-all p-1 whitespace-nowrap cursor-pointer ${
                stitchMode ? 'text-pink-300 hover:text-pink-100' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => alert("⚙️ OmniCRM Dashboard Apps vinculadas")}
              className={`transition-all p-1 whitespace-nowrap cursor-pointer ${
                stitchMode ? 'text-pink-300 hover:text-pink-100' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Apps de meta"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {/* Profile Avatar circle with link */}
            <div 
              onClick={() => setActiveTab('settings')}
              className={`w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer hover:scale-105 transition-transform ${
                stitchMode ? 'border-pink-500' : 'border-cyan-600'
              }`}
              title="Ir a Configuración"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLl3TMRsp9fCQk1W-zufJUO1MmSHpgiAEzVAfMqq4eRv0WD4qUth3pjP_HaM16pjoFbiC1Xt_xiq6yNXxom-14U1WDyJ3oFGLEumOq1ox1sGS8N6PzUR74SnOKLVKt1xybdP8eWEAPTgAwFBoygimq8UHDAJ5SFipmg0YX9VBCAspBV6D9lzFwyA9JHxbjL9D7urCxCJ7VvuG93FX2qL07cU3cyfI5zevAi8kFv3KBj67q9DCWhv9RWuCfJDmDfq-UdVh7nFauL3s"
                alt="Agente"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* ACTIVE MODULE CONTAINER PORTAL */}
        <main className="flex-1 p-6 overflow-y-auto chat-scrollbar">

          {activeTab === 'dashboard' && (
            <DashboardSection 
              customers={customers} 
              stitchMode={stitchMode} 
            />
          )}

          {activeTab === 'inbox' && (
            <InboxSection 
              customers={customers}
              activeCustomerId={activeCustomerId}
              setActiveCustomerId={setActiveCustomerId}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              stitchMode={stitchMode}
              webhookUrl={webhookUrl}
            />
          )}

          {activeTab === 'automations' && (
            <AutomationsSection 
              stitchMode={stitchMode} 
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsSection 
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onSelectCustomerForChat={handleSelectCustomerForChat}
              onClearCustomer={handleDeleteCustomer}
              stitchMode={stitchMode}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsSection 
              stitchMode={stitchMode}
              setStitchMode={setStitchMode}
              webhookUrl={webhookUrl}
              setWebhookUrl={setWebhookUrl}
              onClearMockData={handleClearMockData}
              onRestoreMockData={handleRestoreMockData}
              totalCustomers={customers.length}
            />
          )}

        </main>

      </div>

      {/* STITCH COZY FLOATING COMPANION WIDGET IF CONFIG TRIGGER IS PRESSED */}
      {stitchMode && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end select-none">
          {/* Talk Balloon */}
          {showStitchBalloon && (
            <div className="bg-[#1c1b1b] border-2 border-[#ffb2be] text-white p-3 rounded-2xl rounded-br-none shadow-2xl max-w-xs mb-2 text-xs font-sans relative animate-fade-in">
              <p className="leading-relaxed">"{stitchQuotesList[stitchQuoteIdx]}"</p>
              <div className="text-[10px] text-primary font-mono text-right mt-1.5">— Stitch (Experimento 626)</div>
              {/* Little quote point */}
              <div className="absolute right-0 bottom-[-8px] w-4 h-4 bg-[#1a1919] border-r-2 border-b-2 border-[#ffb2be] rotate-45"></div>
            </div>
          )}

          {/* Stitch Avatar Icon */}
          <button 
            type="button"
            onClick={handleNextStitchQuote}
            className="w-14 h-14 bg-gradient-to-br from-[#ffd9de] via-[#d70357] to-cyan-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-white cursor-pointer active:scale-90 transition-transform group animate-bounce"
            title="¡Hablar con Stitch!"
          >
            <span className="text-2xl group-hover:scale-125 transition-transform" role="img" aria-label="Stitch Companion">👽</span>
          </button>
        </div>
      )}

    </div>
  );
}
