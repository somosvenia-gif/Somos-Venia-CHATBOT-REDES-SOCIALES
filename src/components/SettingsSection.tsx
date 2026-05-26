import React, { useState } from 'react';
import { Settings, Shield, Link, Bell, Server, Database, Bot, Sparkles, Sliders } from 'lucide-react';

interface SettingsSectionProps {
  stitchMode: boolean;
  setStitchMode: (active: boolean) => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  onClearMockData: () => void;
  onRestoreMockData: () => void;
  totalCustomers: number;
}

export default function SettingsSection({
  stitchMode,
  setStitchMode,
  webhookUrl,
  setWebhookUrl,
  onClearMockData,
  onRestoreMockData,
  totalCustomers
}: SettingsSectionProps) {
  const [verifyToken, setVerifyToken] = useState('meta_omnicrm_token_99');
  const [temperature, setTemperature] = useState(0.3);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Trigger simulated meta webhook incoming ping
  const handleSimulateWebhook = () => {
    setTestingWebhook(true);
    setSimulatedLog(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 📡 POST Request received on /webhook`,
      `[${new Date().toLocaleTimeString()}] 📦 Payload: { object: "whatsapp_business_account", entry: [ ... ] }`,
      `[${new Date().toLocaleTimeString()}] 🔔 Micro-WebHook Dispatch: Emitted chat update to socket.io client`
    ]);

    setTimeout(() => {
      setTestingWebhook(false);
      setSimulatedLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✅ Processed successfully! Response status 200 OK`
      ]);
      alert("✅ ¡Simulación de Webhook completa exitosamente!\nMeta Graph se comunicó con el puerto dev del bot.\nSe ha enviado una notificación de prueba al buzón.");
    }, 1200);
  };

  return (
    <div id="settings-pane-wrapper" className="space-y-6 select-none max-w-4xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold tracking-tight flex items-center gap-2 ${
          stitchMode ? 'text-white' : 'text-slate-900'
        }`}>
          ⚙️ {stitchMode ? 'Configuraciones de la Galaxia' : 'Configuraciones del Sistema'}
        </h2>
        <p className={`text-sm mt-1 ${stitchMode ? 'text-pink-200' : 'text-slate-500'}`}>
          {stitchMode 
            ? 'Ajusta los propulsores cósmicos, los chips de comportamiento y el nivel de travesura.' 
            : 'Establezca sus parámetros de integraciones de Meta, verifique webhooks y configure el co-pilot del chatbot.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left pane cards */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Aesthetic Toggle Stitch Theme widget */}
          <div className={`border rounded-2xl p-5 space-y-3 shadow-sm relative overflow-hidden ${
            stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌺</span>
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
                    Modo Stitch / Diseño de Stitch
                  </h3>
                  <p className="text-xs leading-relaxed mt-0.5 text-slate-500">
                    Transforma por completo la interfaz del CRM en una experiencia divertida ambientada en Lilo y Stitch. 
                    Activa colores fucsias estelares y hace que la IA (Gemini 3.5 Flash) responda con la personalidad de Stitch (Experimento 626) en español.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setStitchMode(!stitchMode)}
                className={`px-4 py-2 rounded-lg text-xs font-bold leading-none shrink-0 transition-all cursor-pointer ${
                  stitchMode 
                    ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-900/30' 
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                {stitchMode ? 'Desactivar 👽' : 'Activar 👽'}
              </button>
            </div>
          </div>

          {/* Webhook Configuration card */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-sm ${
            stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <h4 className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b ${
              stitchMode ? 'border-pink-500/10 text-white' : 'border-slate-100 text-slate-900'
            }`}>
              <Link className="w-4 h-4 text-cyan-600" /> Credenciales del Webhook Meta (WhatsApp/Instagram/Facebook)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">URL del Webhook (Render Callback)</label>
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className={`w-full border text-xs rounded p-2 focus:ring-1 focus:ring-cyan-600 focus:outline-none font-mono ${
                    stitchMode ? 'bg-[#131313] border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Coloque esta URL en su panel de Meta App Dashboard &gt; Whatsapp &gt; Configuration.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Verify Token (Meta Subscription)</label>
                  <input 
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className={`w-full border text-xs rounded p-2 focus:ring-1 focus:ring-cyan-600 focus:outline-none font-mono ${
                      stitchMode ? 'bg-[#131313] border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Meta Graph API Version</label>
                  <input 
                    type="text"
                    value="v20.0"
                    disabled
                    className={`w-full border text-xs rounded p-2 font-mono ${
                      stitchMode ? 'bg-[#131313] border-pink-500/20 text-pink-300' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gemini AI Fine-Tuning variables card */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-sm ${
            stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <h4 className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b ${
              stitchMode ? 'border-pink-500/10 text-white' : 'border-slate-100 text-slate-900'
            }`}>
              <Sliders className="w-4 h-4 text-cyan-600" /> Parámetros del Motor de IA (Gemini 3.5 Flash)
            </h4>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-500 font-medium">Temperatura (Creatividad vs Reglas)</span>
                  <span className={`font-bold font-mono ${stitchMode ? 'text-white' : 'text-slate-800'}`}>{temperature}</span>
                </div>
                <input 
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600 bg-slate-100 h-1 rounded-lg outline-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Valores más bajos (0.3) garantizan respuestas corporativas súper sólidas; valores más altos (0.8) son ideales para Stitch u otros juegos lúdicos.
                </p>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">MIME Type de Respuesta GenAI</label>
                <select className={`w-full border text-xs rounded p-2 focus:ring-1 focus:ring-cyan-600 focus:outline-none ${
                  stitchMode ? 'bg-[#131313] border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <option>text/plain</option>
                  <option>application/json</option>
                </select>
              </div>
            </div>
          </div>

          {/* Real Sincronizacion & Live Workspace Database Clean mode card */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-sm ${
            stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <h4 className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b ${
              stitchMode ? 'border-pink-500/10 text-white' : 'border-slate-100 text-slate-900'
            }`}>
              <Database className="w-4 h-4 text-emerald-600" /> Sincronización Real y Base de Datos (Limpieza)
            </h4>

            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-slate-500">
                Para comenzar a recibir y responder chats reales vinculados desde sus cuentas activas de <strong>WhatsApp, Instagram y Facebook</strong> (vía webhooks en Render, Make, o n8n), se recomienda limpiar los clientes y mensajes de prueba simulados.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">Estado de la Bandeja</div>
                  <div className="text-[11px] text-slate-500">
                    {totalCustomers > 0 
                      ? `Mostrando ${totalCustomers} chat(s) de prueba` 
                      : 'Bandeja vacía en modo producción limpian'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  totalCustomers > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {totalCustomers > 0 ? 'Con Datos de Prueba' : 'Modo Limpio Activo'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("⚠️ ¿Está seguro que desea limpiar todos los chats de ejemplo?\nEsto vaciará por completo la bandeja para que solo aparezcan sus mensajes reales de WhatsApp, Instagram y Facebook.")) {
                      onClearMockData();
                    }
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors text-center shadow-sm"
                >
                  🧹 Limpiar Chats de Ejemplo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRestoreMockData();
                    alert("🔄 Se han restaurado los datos de prueba simulados en la base de datos local.");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-colors text-center border border-slate-200"
                >
                  Restaurar Datos de Prueba
                </button>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 leading-relaxed">
                ℹ️ Al limpiar los chats, la bandeja de entrada y el listado de contactos se vaciarán. La bandeja se irá poblando de forma dinámica a medida que ingresen nuevas peticiones webhook o utilices el simulador de la derecha.
              </div>
            </div>
          </div>

        </div>

        {/* Right pane: Webhook simulator console log */}
        <div className="space-y-6">
          
          {/* Test connection alert tool */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-full ${
            stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              stitchMode ? 'text-white' : 'text-slate-900'
            }`}>
              🚀 Simulador de Webhooks Meta
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pruebe su endpoint sin tener que realizar una solicitud física desde un dispositivo real. Esto simulará un ping entrante de chat en tiempo real.
            </p>

            <button 
              type="button"
              onClick={handleSimulateWebhook}
              disabled={testingWebhook}
              className={`w-full font-bold text-xs py-2 rounded-lg cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                stitchMode 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
              }`}
            >
              {testingWebhook ? 'Simulando...' : '📡 Simular Request'}
            </button>

            {/* Simulating logs scroll inside frame */}
            <div className={`flex-1 border text-[10px] font-mono p-3 rounded-lg overflow-y-auto max-h-[140px] leading-relaxed space-y-1 ${
              stitchMode 
                ? 'bg-[#131313] border-pink-500/20 text-emerald-400' 
                : 'bg-slate-950 border-slate-800 text-emerald-400'
            }`}>
              <div>// Meta Gateway Logger Ready</div>
              {simulatedLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
