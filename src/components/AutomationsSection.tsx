import React, { useState } from 'react';
import { FlowNode } from '../types';
import { INITIAL_NODES } from '../initialData';
import { 
  Bolt, MessageSquare, List, 
  Trash, Plus, Eye, Check, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Save, Undo, Redo, HelpCircle
} from 'lucide-react';

interface AutomationsSectionProps {
  stitchMode: boolean;
}

export default function AutomationsSection({ stitchMode }: AutomationsSectionProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'success'>('idle');
  const [nodeTitleInput, setNodeTitleInput] = useState('');
  const [nodeDescInput, setNodeDescInput] = useState('');
  const [autoSave, setAutoSave] = useState(true);

  // Quick state manipulation for node coordinates simulation
  const handleDragMock = (id: string, dir: 'up' | 'down' | 'left' | 'right') => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        let newX = n.x;
        let newY = n.y;
        if (dir === 'left') newX = Math.max(20, n.x - 40);
        if (dir === 'right') newX = n.x + 40;
        if (dir === 'up') newY = Math.max(50, n.y - 40);
        if (dir === 'down') newY = n.y + 40;
        return { ...n, x: newX, y: newY };
      }
      return n;
    }));
  };

  // Select node for edit panel inside builder
  const handleSelectNode = (n: FlowNode) => {
    setSelectedNodeId(n.id);
    setNodeTitleInput(n.title);
    setNodeDescInput(n.description);
  };

  // Persist edits of chosen node
  const handleSaveNodeEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, title: nodeTitleInput, description: nodeDescInput };
      }
      return n;
    }));
    setSelectedNodeId(null);
  };

  // Add block from library onto canvas
  const handleAddBlock = (type: 'trigger' | 'action' | 'logic', title: string, desc: string, icon: string) => {
    // Generate simple coordinates next to library or centered
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 80 : 300;
    const newY = lastNode ? Math.min(450, lastNode.y + 60) : 200;

    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      icon,
      title,
      description: desc,
      x: newX,
      y: newY
    };

    setNodes(prev => [...prev, newNode]);
  };

  // Delete node from canvas
  const handleDeleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Trigger visual Publish animation sequence
  const handlePublish = () => {
    setPublishState('publishing');
    setTimeout(() => {
      setPublishState('success');
      setTimeout(() => {
        setPublishState('idle');
      }, 2000);
    }, 1000);
  };

  // Reset nodes flow back to seed state
  const handleResetFlow = () => {
    if (confirm('¿Restablecer el plano del chatbot automatizado a los presets semilla?')) {
      setNodes(INITIAL_NODES);
      setSelectedNodeId(null);
    }
  };

  return (
    <div id="automations-pane-wrapper" className="flex-grow flex flex-col lg:flex-row h-full overflow-hidden select-none">
      
      {/* CANVAS MAIN BUILDER VIEW: Left & Center Grid */}
      <div className={`flex-grow relative h-[50vh] lg:h-full p-6 overflow-hidden ${
        stitchMode ? 'canvas-grid bg-[#131313]' : 'bg-slate-50 border-r border-slate-200'
      }`}>
        
        {/* SVG connection path layers */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="glowArrow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#44d8f1" />
              <stop offset="100%" stopColor="#ffd9de" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#44d8f1" />
            </marker>
          </defs>

          {/* Dynamically draw curves between sequential nodes to make flow live! */}
          {nodes.map((n, i) => {
            if (i === nodes.length - 1) return null;
            const nextNode = nodes[i + 1];
            
            // Generate nice cubic bezier curve anchors
            const startX = n.x + 256; // Right node edge
            const startY = n.y + 55;  // Middle node height
            const endX = nextNode.x;   // Left node edge
            const endY = nextNode.y + 55; // Middle node height

            const cp1X = startX + 120;
            const cp1Y = startY;
            const cp2X = endX - 120;
            const cp2Y = endY;

            return (
              <g key={`curv-${n.id}`}>
                <path 
                  d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`}
                  fill="none"
                  stroke="url(#glowArrow)"
                  strokeWidth="2.5"
                  strokeDasharray="4"
                  className="node-connector"
                />
                <circle cx={startX} cy={startY} r="4" fill="#44d8f1" />
                <circle cx={endX} cy={endY} r="4" fill="#ffb2be" />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Nodes Floating Board */}
        <div id="canvas-interactive-board" className="relative w-full h-full overflow-auto p-4">
          
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            
            let accentColor = 'border-l-4 border-primary';
            let tagLabel = 'TRIGGER';
            let tagBg = 'text-primary bg-primary/10';

            if (node.type === 'action') {
              accentColor = 'border-l-4 border-secondary';
              tagLabel = 'ACTION';
              tagBg = 'text-secondary bg-secondary/10';
            } else if (node.type === 'logic') {
              accentColor = 'border-l-4 border-amber-400';
              tagLabel = 'LOGIC STEP';
              tagBg = 'text-amber-400 bg-amber-400/10';
            }

            return (
              <div 
                key={node.id}
                onClick={() => handleSelectNode(node)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute w-64 bg-surface-container-high rounded-xl p-4 shadow-lg active:cursor-grabbing border ${
                  isSelected ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/30'
                } ${accentColor} hover:shadow-cyan transition-all cursor-pointer`}
              >
                {/* Node Tags and Delete button */}
                <div className="flex justify-between items-center mb-2.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-widest font-extrabold ${tagBg}`}>
                    {tagLabel}
                  </span>
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {/* Micro drag helper buttons since real html5 canvas dragging is tricky inside iframe */}
                    <div className="flex gap-0.5 bg-background p-0.5 rounded border border-outline-variant/20">
                      <button onClick={() => handleDragMock(node.id, 'left')} className="text-[9px] px-1 hover:text-primary">←</button>
                      <button onClick={() => handleDragMock(node.id, 'up')} className="text-[9px] px-1 hover:text-primary">↑</button>
                      <button onClick={() => handleDragMock(node.id, 'down')} className="text-[9px] px-1 hover:text-primary">↓</button>
                      <button onClick={() => handleDragMock(node.id, 'right')} className="text-[9px] px-1 hover:text-primary">→</button>
                    </div>

                    <button 
                      onClick={(e) => handleDeleteNode(node.id, e)}
                      className="text-on-surface-variant hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Quitar Bloque"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1">
                  {node.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  {node.description}
                </p>

              </div>
            );
          })}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className={`p-8 border border-dashed rounded-xl max-w-sm ${
                stitchMode ? 'bg-surface border-pink-500/20 text-white' : 'bg-white border-slate-300 shadow-sm text-slate-700'
              }`}>
                <Bolt className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                <p className={`text-sm font-semibold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>Lienzo vacío</p>
                <p className={`text-xs mt-1 ${stitchMode ? 'text-pink-200' : 'text-slate-500'}`}>
                  Arrastra o haz clic en los bloques de la Biblioteca derecha para reconstruir el flujo de automatización.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Floating overlays: Lower controls */}
        <div className={`absolute bottom-4 left-4 flex gap-1.5 p-1 rounded-lg shadow-xl border z-30 ${
          stitchMode ? 'bg-surface-container border-pink-500/20' : 'bg-white border-slate-200'
        }`}>
          <button 
            type="button" 
            onClick={() => alert("🔍 Zoom incrementado al 105%")}
            className="p-1.5 rounded hover:text-cyan-600 transition-all cursor-pointer text-slate-400 hover:bg-slate-50"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            type="button" 
            onClick={() => alert("🔍 Zoom disminuido al 95%")}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-600 transition-all cursor-pointer hover:bg-slate-50"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] bg-slate-200 mx-1 self-stretch"></div>
          <button 
            type="button" 
            onClick={handleResetFlow}
            title="Restablecer Nodos"
            className="p-1.5 rounded text-slate-400 hover:text-cyan-600 transition-all cursor-pointer hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating overlays: Publish headers buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-30">
          <button 
            type="button" 
            onClick={() => alert("💾 Borrador respaldado en caché local.")}
            className={`border px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              stitchMode ? 'bg-surface-container border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Borrador
          </button>
          <button 
            type="button" 
            onClick={handlePublish}
            disabled={publishState !== 'idle'}
            className={`cursor-pointer text-xs font-semibold px-4 py-1.5 rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-1.5 ${
              publishState === 'success' 
                ? 'bg-green-600 text-white' 
                : publishState === 'publishing' 
                  ? 'bg-amber-400 text-black' 
                  : 'bg-cyan-600 text-white shadow-cyan-500/10 hover:bg-cyan-700'
            }`}
          >
            {publishState === 'publishing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {publishState === 'success' && <Check className="w-3.5 h-3.5" />}
            {publishState === 'publishing' ? 'Publicando...' : publishState === 'success' ? '¡Éxito total!' : 'Publicar Flujo'}
          </button>
        </div>

      </div>

      {/* RIGHT SIDEBAR PANEL: Block Library & Config Edit Panel */}
      <aside className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col h-auto lg:h-full select-none ${
        stitchMode ? 'bg-[#131313] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
      }`}>
        
        {/* Node Editing Form Panel */}
        {selectedNodeId ? (
          <div className={`p-4 border-b animate-fade-in ${
            stitchMode ? 'border-pink-500 bg-pink-500/5' : 'border-cyan-500 bg-cyan-500/5'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-extrabold font-mono uppercase tracking-wider ${stitchMode ? 'text-pink-400' : 'text-cyan-700'}`}>Editar Bloque</span>
              <button onClick={() => setSelectedNodeId(null)} className="text-xs text-slate-400 font-mono hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveNodeEdits} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Título del Bloque</label>
                <input 
                  type="text"
                  value={nodeTitleInput}
                  onChange={(e) => setNodeTitleInput(e.target.value)}
                  className={`w-full text-xs rounded p-2 focus:ring-1 focus:ring-cyan-600 border ${
                    stitchMode ? 'bg-surface border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parámetro / Descripción</label>
                <textarea 
                  value={nodeDescInput}
                  onChange={(e) => setNodeDescInput(e.target.value)}
                  rows={2}
                  className={`w-full text-xs rounded p-2 focus:ring-1 focus:ring-cyan-600 resize-none border ${
                    stitchMode ? 'bg-surface border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
              <div className="flex gap-2 pt-1.5">
                <button type="submit" className="flex-1 bg-cyan-600 text-white font-bold text-xs py-1.5 rounded-lg active:scale-95 shadow-sm">
                  Guardar
                </button>
                <button type="button" onClick={() => setSelectedNodeId(null)} className="flex-1 bg-slate-100 border border-slate-200 text-[11px] py-1.5 rounded-lg text-slate-700 hover:bg-slate-200">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={`p-4 border-b ${stitchMode ? 'border-pink-500/20' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>Biblioteca de Automatizaciones</h3>
            <p className={`text-[11px] ${stitchMode ? 'text-pink-300' : 'text-slate-500'}`}>Arriba las conexiones que Gemini responderá nativamente de acuerdo al trigger de entrada.</p>
          </div>
        )}

        {/* Core Block Library Scroll */}
        <div className="p-4 space-y-6 flex-grow overflow-y-auto chat-scrollbar">
          
          {/* Triggers Category */}
          <div>
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 opacity-60">Triggers (Desencadenantes)</h4>
            <div className="space-y-2">
              <div 
                onClick={() => handleAddBlock('trigger', 'Keyword Match', 'Sms coincidente filtrado en el webhook', 'bolt')}
                className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer hover:border-cyan-600 transition-all group ${
                  stitchMode ? 'bg-surface-container-low border-pink-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 group-hover:bg-cyan-200">
                  <Bolt className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold group-hover:text-cyan-600 transition-colors ${stitchMode ? 'text-white' : 'text-slate-800'}`}>Keyword Match</p>
                  <p className="text-[9px] text-slate-400">Sms rápido coincidente</p>
                </div>
              </div>

              <div 
                onClick={() => handleAddBlock('trigger', 'New Subscriber', 'Primer contacto del cliente vía DM', 'bolt')}
                className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer hover:border-cyan-600 transition-all group ${
                  stitchMode ? 'bg-surface-container-low border-pink-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 group-hover:bg-cyan-200">
                  <Bolt className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold group-hover:text-cyan-600 transition-colors ${stitchMode ? 'text-white' : 'text-slate-800'}`}>New Subscriber</p>
                  <p className="text-[9px] text-slate-400">Disparador de bienvenida</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Category */}
          <div>
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 opacity-60">Acciones (Respuestas)</h4>
            <div className="space-y-2">
              <div 
                onClick={() => handleAddBlock('action', 'Welcome Message', 'Envía respuesta estática de bienvenida', 'chat_bubble')}
                className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer hover:border-indigo-600 transition-all group ${
                  stitchMode ? 'bg-surface-container-low border-pink-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-200">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold group-hover:text-indigo-600 transition-colors ${stitchMode ? 'text-white' : 'text-slate-800'}`}>Welcome Message</p>
                  <p className="text-[9px] text-slate-400">Texto plano o multimedia</p>
                </div>
              </div>

              <div 
                onClick={() => handleAddBlock('action', 'Quick Reply Menu', 'Muestra botones interactivos de decisión', 'list')}
                className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer hover:border-indigo-600 transition-all group ${
                  stitchMode ? 'bg-surface-container-low border-pink-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-200">
                  <List className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold group-hover:text-indigo-600 transition-colors ${stitchMode ? 'text-white' : 'text-slate-800'}`}>Quick Reply</p>
                  <p className="text-[9px] text-slate-400">Menú interactivo de opciones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logic & Routing Category */}
          <div>
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 opacity-60">Lógica de Flujo</h4>
            <div className="space-y-2">
              <div 
                onClick={() => handleAddBlock('logic', 'Transfer to Agent', 'Detiene la IA y pasa control a un humano', 'support_agent')}
                className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer hover:border-amber-500 transition-all group ${
                  stitchMode ? 'bg-surface-container-low border-pink-500/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-200">
                  <Bolt className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold group-hover:text-amber-500 transition-colors ${stitchMode ? 'text-white' : 'text-slate-800'}`}>Transfer to Agent</p>
                  <p className="text-[9px] text-slate-400">Pase humano o asignador de colas</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Area with AutoSave Option */}
        <div className={`mt-auto p-4 border-t shrink-0 ${
          stitchMode ? 'bg-surface-container border-pink-500/25 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-medium">Guardado automático en la nube</span>
            <div 
              onClick={() => setAutoSave(!autoSave)}
              className="w-9 h-5 bg-slate-200 rounded-full relative cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-full absolute top-[2px] transition-all ${
                autoSave ? 'bg-cyan-600 right-[2px]' : 'bg-gray-400 left-[2px]'
              }`}></div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => alert("⚙️ Configuraciones avanzadas del Webhook y WebSockets para Render / Render API.")}
            className={`w-full text-xs py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
              stitchMode ? 'bg-surface-container hover:bg-surface-container-high border-pink-500/20 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            Configuración Global de Flujos
          </button>
        </div>

      </aside>

    </div>
  );
}
