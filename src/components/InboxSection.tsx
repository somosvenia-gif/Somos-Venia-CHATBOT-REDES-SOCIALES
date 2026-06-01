import React, { useState, useRef, useEffect } from 'react';
import { Customer, Message, Platform } from '../types';
import { 
  Search, MessageSquare, Phone, MapPin, Mail, 
  Video, MoreVertical, Send, Mic, Smile, Plus,
  Sparkles, PlusCircle, CheckCircle2, Bot, AlertTriangle, Trash2
} from 'lucide-react';

interface InboxSectionProps {
  customers: Customer[];
  activeCustomerId: string;
  setActiveCustomerId: (id: string) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  stitchMode: boolean;
  webhookUrl?: string;
}

export default function InboxSection({
  customers,
  activeCustomerId,
  setActiveCustomerId,
  onUpdateCustomer,
  onDeleteCustomer,
  stitchMode,
  webhookUrl
}: InboxSectionProps) {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<'all' | Platform>('all');
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  
  // Multimodal states
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; name: string; preview: string } | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];

  useEffect(() => {
    if (activeCustomer) {
      setTempNotes(activeCustomer.notes);
      setAiSuggestion(null);
      setSelectedImage(null);
      setSelectedAudio(null);
    }
  }, [activeCustomerId]);

  // Recording timer effect
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Start real browser voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          setSelectedAudio({
            base64: base64data,
            mimeType: 'audio/ogg',
            name: `Nota-de-voz-${new Date().toLocaleTimeString().replace(/\s/g, '')}.ogg`
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error("No se pudo iniciar el grabador de audio:", err);
      alert("🎙️ [Simulador de micrófono]: No se pudo acceder a tu micrófono real (por permisos o soporte). Generando una nota de voz simulada de alta calidad sobre consultoría de automatización...");
      setSelectedAudio({
        base64: "T2dnUwACAAAAAAAAAAA=", // placeholder small base64 chunk
        mimeType: 'audio/ogg',
        name: 'Nota_de_voz_Consultoria.ogg'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      setSelectedImage({
        base64: base64data,
        mimeType: file.type,
        name: file.name,
        preview: reader.result as string
      });
    };
  };

  // Scroll to bottom of message thread
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeCustomer?.messages, aiLoading]);

  if (!activeCustomer) {
    return (
      <div className={`flex-grow flex items-center justify-center p-8 text-center rounded-2xl border ${
        stitchMode ? 'bg-[#181818] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <div className="max-w-md">
          <Bot className={`w-12 h-12 mx-auto mb-4 animate-bounce ${stitchMode ? 'text-pink-400' : 'text-cyan-600'}`} />
          <p className={`font-semibold text-lg ${stitchMode ? 'text-white' : 'text-slate-900'}`}>No hay chats activos en la bandeja</p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Tu bandeja de entrada está en modo producción lista para sincronizarse. Utiliza la sección de <strong>Contacto</strong> para agregar un lead, simula peticiones con el modulo de <strong>Configuración</strong>, o conecta tus webhooks reales para que entren mensajes.
          </p>
        </div>
      </div>
    );
  }

  // Handle manual note update
  const handleSaveNotes = () => {
    onUpdateCustomer({
      ...activeCustomer,
      notes: tempNotes
    });
  };

  // Toggle AI bot state
  const handleToggleAi = () => {
    onUpdateCustomer({
      ...activeCustomer,
      aiActive: !activeCustomer.aiActive
    });
  };

  // Suggest quick reply using Express backend /api/suggest-reply
  const handleSuggestReply = async () => {
    if (activeCustomer.messages.length === 0) return;
    setSuggesting(true);
    setAiSuggestion(null);

    const clientMsgs = activeCustomer.messages.filter(m => m.sender === 'user');
    const lastUserMsg = clientMsgs[clientMsgs.length - 1]?.text || '';
    const lastAgentMsg = activeCustomer.messages.filter(m => m.sender !== 'user').slice(-1)[0]?.text || '';

    try {
      const response = await fetch('/api/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMessage: lastUserMsg,
          lastAgentMessage: lastAgentMsg
        })
      });

      const data = await response.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (e) {
      console.error('Failed to query suggested reply:', e);
      setAiSuggestion('Sugerencia: Estimado cliente, con gusto agendamos una llamada de consultoría técnica.');
    } finally {
      setSuggesting(false);
    }
  };

  // Send message manual or trigger AI autoresponse
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage && !selectedAudio) return;

    let mediaUrl: string | undefined = undefined;
    let mediaType: 'image' | 'audio' | undefined = undefined;
    let textToSend = inputText;

    if (selectedImage) {
      mediaUrl = selectedImage.preview;
      mediaType = 'image';
      if (!textToSend.trim()) {
        textToSend = `📷 Imagen: ${selectedImage.name}`;
      }
    } else if (selectedAudio) {
      mediaUrl = `data:audio/ogg;base64,${selectedAudio.base64}`;
      mediaType = 'audio';
      textToSend = `🎙️ Nota de voz: ${selectedAudio.name}`;
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      text: textToSend,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaUrl,
      mediaType
    };

    const updatedCustomer = {
      ...activeCustomer,
      lastMessage: textToSend,
      lastInteractionTime: 'Just now',
      messages: [...activeCustomer.messages, userMsg]
    };

    onUpdateCustomer(updatedCustomer);
    setInputText('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setAiSuggestion(null);

    // Forward manual agent message to custom webhook proxy (CORS safe)
    if (webhookUrl) {
      fetch('/api/webhook/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          message: userMsg,
          customer: activeCustomer
        })
      }).catch(err => console.error('Error forwarding agent msg to webhook:', err));
    }

    // If AI (Bot) is active on this contact, prompt an answer automatically
    if (activeCustomer.aiActive) {
      setAiLoading(true);
      try {
        const response = await fetch('/api/chat/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            history: activeCustomer.messages,
            platform: activeCustomer.platform,
            stitchMode,
            imageBase64: selectedImage?.base64,
            imageMimeType: selectedImage?.mimeType,
            audioBase64: selectedAudio?.base64,
            audioMimeType: selectedAudio?.mimeType
          })
        });

        const data = await response.json();
        
        const botMsg: Message = {
          id: Math.random().toString(),
          text: data.text,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Re-get customers state
        onUpdateCustomer({
          ...updatedCustomer,
          messages: [...updatedCustomer.messages, userMsg, botMsg],
          lastMessage: data.text
        });

        // Forward automatic bot response to custom webhook proxy
        if (webhookUrl) {
          fetch('/api/webhook/forward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhookUrl,
              message: botMsg,
              customer: activeCustomer
            })
          }).catch(err => console.error('Error forwarding bot msg to webhook:', err));
        }

      } catch (err) {
        console.error('Error contacting Gemini:', err);
      } finally {
        setAiLoading(false);
      }
    }
  };

  // Attach a pre-fabricated template message to simulation path
  const handleAttachTemplate = () => {
    const defaultTemplate = stitchMode 
      ? '¡Aloha! Ohana significa familia, y la familia nunca abandona a los clientes de la galaxia. ¿Quieres ver un demo hoy?'
      : 'Estimado cliente, gracias por elegir SomosVenia. El Builder de automatizaciones está listo para implementarse.';
    setInputText(defaultTemplate);
  };

  // Add tag dynamically
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    if (!activeCustomer.tags.includes(newTagInput.trim())) {
      onUpdateCustomer({
        ...activeCustomer,
        tags: [...activeCustomer.tags, newTagInput.trim()]
      });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  // Delete tag dynamically
  const handleDeleteTag = (tagToDelete: string) => {
    onUpdateCustomer({
      ...activeCustomer,
      tags: activeCustomer.tags.filter(t => t !== tagToDelete)
    });
  };

  // Create simulated pipeline deal pop up alert
  const handleCreateDeal = () => {
    const currencySym = stitchMode ? '🥥 Cocos Cósmicos' : 'USD';
    const amountVal = stitchMode ? '5,000' : '2,500';
    alert(`💼 ¡Trato creado en SomosVenia Pipeline!\nLead: ${activeCustomer.name}\nMódulo de Oportunidad comercial valorada en: $${amountVal} ${currencySym}\nFase: Negociación Inicial.`);
  };

  // Filter & Search chats
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || c.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div id="inbox-pane-wrapper" className="flex flex-col lg:flex-row h-full overflow-hidden select-none">
      
      {/* COLUMN 1: Chat/Messages List Sidebar */}
      <section className={`w-full lg:w-80 border-r flex flex-col h-[35vh] lg:h-full ${
        stitchMode ? 'bg-[#131313] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <div className={`p-4 flex items-center justify-between border-b ${stitchMode ? 'border-pink-500/20' : 'border-slate-200'}`}>
          <h2 className={`text-lg font-bold flex items-center gap-1.5 ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
            Mensajes
            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-mono">
              {filteredCustomers.length}
            </span>
          </h2>
          <select 
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value as any)}
            className={`text-[11px] rounded-lg px-2 py-1 focus:ring-1 focus:ring-cyan-600 focus:outline-none ${
              stitchMode ? 'bg-surface border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="all">Sistemas</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>

        {/* Search inside the contacts */}
        <div className={`p-3 border-b ${stitchMode ? 'border-pink-500/10' : 'border-slate-100'}`}>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`border rounded-lg pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-600 w-full ${
                stitchMode 
                  ? 'bg-surface border-pink-500/20 text-white placeholder-pink-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Dynamic chat thread items */}
        <div className={`flex-1 overflow-y-auto chat-scrollbar divide-y ${stitchMode ? 'divide-pink-500/10' : 'divide-slate-100'}`}>
          {filteredCustomers.map(cust => {
            const isActive = cust.id === activeCustomerId;
            const isOnline = cust.status === 'online';
            
            return (
              <div 
                key={cust.id}
                onClick={() => setActiveCustomerId(cust.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isActive 
                    ? (stitchMode ? 'bg-pink-950/20 border-l-4 border-pink-500' : 'bg-slate-100 border-l-4 border-cyan-600') 
                    : (stitchMode ? 'hover:bg-neutral-900 border-l-4 border-transparent' : 'hover:bg-slate-50 border-l-4 border-transparent')
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <div className="relative shrink-0">
                    <img 
                      src={cust.avatar} 
                      alt={cust.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                      isOnline ? 'bg-green-500' : cust.status === 'away' ? 'bg-amber-400' : 'bg-gray-400'
                    } ${stitchMode ? 'border-[#131313]' : 'border-white'}`}></span>
                  </div>

                  <div className="flex-1 min-w-0 ml-2.5">
                    <p className={`text-xs font-bold truncate ${stitchMode ? 'text-white' : 'text-slate-900'}`}>{cust.name}</p>
                    <span className="text-[9px] uppercase font-mono tracking-wider font-semibold block mt-0.5" style={{
                      color: cust.platform === 'whatsapp' ? '#16a34a' : cust.platform === 'instagram' ? '#db2777' : '#2563eb'
                    }}>
                      {cust.platform} {cust.aiActive && '• AI Active'}
                    </span>
                    <p className={`text-xs truncate mt-1 ${stitchMode ? 'text-pink-200' : 'text-slate-500'}`}>{cust.lastMessage}</p>
                  </div>

                  <span className={`text-[10px] font-mono whitespace-nowrap ${stitchMode ? 'text-pink-300' : 'text-slate-400'}`}>
                    {cust.lastInteractionTime}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No se encontraron hilos
            </div>
          )}
        </div>
      </section>

      {/* COLUMN 2: Active Conversation Main Area */}
      <section className={`flex-1 flex flex-col h-[45vh] lg:h-full relative border-r ${
        stitchMode ? 'bg-neutral-900 border-pink-500/20 text-white' : 'bg-slate-50/70 border-slate-200'
      }`}>
        
        {/* Chat Header */}
        <div className={`p-4 border-b backdrop-blur-md flex items-center justify-between z-10 ${
          stitchMode ? 'border-pink-500/20 bg-surface/80' : 'bg-white/95 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <img 
              src={activeCustomer.avatar} 
              alt={activeCustomer.name} 
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full border-2 border-cyan-600 object-cover"
            />
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${stitchMode ? 'text-white' : 'text-slate-900'}`}>
                {activeCustomer.name}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activeCustomer.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className={`text-[11px] ${stitchMode ? 'text-pink-200' : 'text-slate-500'}`}>
                  {stitchMode ? 'Ih! Ohana conectada vía ' : 'Conectado a '} <span className="capitalize font-semibold text-cyan-600">{activeCustomer.platform}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className={`transition-colors cursor-pointer ${stitchMode ? 'text-pink-300 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`} title="Videollamada simulada">
              <Video className="w-5 h-5" />
            </button>
            <button className={`transition-colors cursor-pointer ${stitchMode ? 'text-pink-300 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`} title="Llamada simulada">
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (confirm('¿Eliminar permanentemente este chat de la base de datos simulada?')) {
                  onDeleteCustomer(activeCustomer.id);
                }
              }}
              className={`transition-colors cursor-pointer ${stitchMode ? 'text-pink-300 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`} 
              title="Borrar Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI suggest quick reply widget */}
        <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 ${
          stitchMode ? 'bg-[#181818] border-pink-500/10' : 'bg-slate-100/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
            <span className={`font-medium ${stitchMode ? 'text-pink-300' : 'text-slate-600'}`}>Asistente Gemini sugerirá una respuesta ágil:</span>
          </div>
          <button 
            onClick={handleSuggestReply}
            disabled={suggesting}
            className={`rounded px-3 py-1 text-xs hover:bg-cyan-500/20 transition-all font-mono border ${
              stitchMode ? 'bg-primary/10 border-primary/30 text-[#44d8f1]' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}
          >
            {suggesting ? 'Escribiendo...' : '⚡ Obtener sugerencia'}
          </button>
        </div>

        {/* Suggestions Box */}
        {aiSuggestion && (
          <div className={`mx-4 mt-3 p-3 rounded-lg flex items-start gap-2.5 animate-fade-in relative z-20 border ${
            stitchMode ? 'bg-surface border-pink-500/30' : 'bg-cyan-50 border-cyan-200 shadow-sm'
          }`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
              stitchMode ? 'bg-primary/20 text-primary' : 'bg-cyan-100 text-cyan-700'
            }`}>
              👽
            </div>
            <div className="flex-1 mr-8">
              <p className="text-[11px] text-cyan-700 font-mono select-none">SUGERENCIA GEMINI CO-PILOT:</p>
              <p className={`text-xs italic mt-1 font-sans ${stitchMode ? 'text-white' : 'text-slate-800'}`}>"{aiSuggestion}"</p>
            </div>
            <button 
              onClick={() => setInputText(aiSuggestion)}
              className="absolute right-2 top-2 bg-cyan-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-cyan-700"
            >
              Usar
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 chat-scrollbar flex flex-col gap-3">
          {activeCustomer.messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isBot = msg.sender === 'bot';
            const isAgent = msg.sender === 'agent';

            let bubbleColor = '';
            let alignClass = 'items-start';
            let labelIcon = '👤 Cliente';
            let glowClass = '';

            if (isAgent) {
              bubbleColor = stitchMode 
                ? 'bg-[#201f1f] border border-pink-500/20 text-white' 
                : 'bg-white border border-slate-200 text-slate-800 shadow-sm';
              alignClass = 'items-end self-end';
              labelIcon = '👔 SomosVenia Marcus';
              glowClass = '';
            } else if (isBot) {
              bubbleColor = stitchMode 
                ? 'bg-cyan-800 text-white' 
                : 'bg-indigo-50 border border-indigo-100 text-slate-800';
              alignClass = 'items-start';
              labelIcon = stitchMode ? '👽 Stitch Bot (Auto-IA)' : '🤖 VeniaBot (Auto-IA)';
              glowClass = '';
            } else if (isUser) {
              bubbleColor = stitchMode 
                ? 'bg-indigo-950/40 text-white' 
                : 'bg-cyan-100 border border-cyan-200/50 text-slate-900';
              alignClass = 'items-start self-start';
              labelIcon = `👤 ${activeCustomer.name}`;
              glowClass = '';
            }

            return (
              <div key={msg.id} className={`flex flex-col max-w-[75%] ${alignClass}`}>
                <span className={`text-[10px] font-mono mb-1 mx-1 flex items-center gap-1 leading-none ${
                  stitchMode ? 'text-pink-300' : 'text-slate-400'
                }`}>
                  {labelIcon} • {msg.timestamp}
                </span>
                <div className={`${bubbleColor} p-3 rounded-2xl ${
                  isAgent ? 'rounded-tr-none' : 'rounded-tl-none'
                } ${glowClass} shadow-sm`}>
                  {msg.mediaType === 'image' && msg.mediaUrl && (
                    <div className="mb-2 max-w-full">
                      <img 
                        src={msg.mediaUrl} 
                        className="max-w-full max-h-60 rounded-xl object-contain border border-slate-200 shadow-sm cursor-zoom-in" 
                        alt="Adjunto" 
                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                      />
                    </div>
                  )}
                  {msg.mediaType === 'audio' && msg.mediaUrl && (
                    <div className="mb-2 py-1">
                      <audio src={msg.mediaUrl} controls className="w-full max-w-[240px] h-9 focus:outline-none" />
                    </div>
                  )}
                  <p className="text-xs font-sans leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Gemini is typing loading visual */}
          {aiLoading && (
            <div className="flex flex-col items-start max-w-[70%] animate-pulse">
              <span className={`text-[10px] font-mono mb-1 ${stitchMode ? 'text-pink-300' : 'text-slate-400'}`}>
                🤖 Respondiendo usando Gemini 3.5 Flash...
              </span>
              <div className={`p-3 rounded-lg flex items-center gap-2 border ${
                stitchMode ? 'bg-[#201f1f] border-pink-500/20' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping"></span>
                <span className="text-xs text-slate-500 font-mono">Generando respuesta...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Footer Area */}
        <div className={`p-4 border-t ${stitchMode ? 'bg-[#1c1b1b] border-pink-500/20' : 'bg-white border-slate-200'}`}>
          {/* Media Previews and Recording overlays */}
          {selectedImage && (
            <div className="mb-3.5 p-2 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm max-w-xs animate-fade-in relative">
              <div className="flex items-center gap-2">
                <img src={selectedImage.preview} className="w-10 h-10 rounded-lg object-cover border border-slate-350" alt="Vista previa" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{selectedImage.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Imagen lista para analizar</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedImage(null)} 
                className="text-slate-400 hover:text-rose-600 font-black text-sm p-1 ml-2 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {selectedAudio && (
            <div className="mb-3.5 p-2 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm max-w-xs animate-fade-in relative">
              <div className="flex items-center gap-2 flex-grow min-w-0">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-base shrink-0">
                  🎙️
                </div>
                <div className="min-w-0 flex-1 ml-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{selectedAudio.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Nota de voz lista para analizar</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedAudio(null)} 
                className="text-slate-400 hover:text-rose-600 font-black text-sm p-1 ml-2 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {isRecording && (
            <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between shadow-sm max-w-xs animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                <div>
                  <p className="text-xs font-bold text-rose-800">Grabando nota de voz...</p>
                  <p className="text-[10px] text-rose-600 font-mono">{recordingSeconds}s transcurridos</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={stopRecording} 
                className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Detener
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className={`flex items-end gap-3 rounded-xl p-2.5 border focus-within:ring-1 focus-within:ring-cyan-600 transition-all ${
            stitchMode ? 'bg-[#201f1f] border-pink-500/20' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 mb-1 shrink-0">
              <button 
                type="button"
                onClick={handleAttachTemplate}
                title="Simular plantilla rápida"
                className={`transition-colors cursor-pointer ${stitchMode ? 'text-pink-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <PlusCircle className="w-5 h-5" />
              </button>

              <button 
                type="button"
                onClick={() => document.getElementById('image-upload')?.click()}
                title="Adjuntar Imagen"
                className={`transition-colors cursor-pointer ${stitchMode ? 'text-pink-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Plus className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                id="image-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
              />
            </div>
 
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className={`flex-grow bg-transparent border-none focus:ring-0 text-xs resize-none max-h-24 p-1 focus:outline-none ${
                stitchMode ? 'text-white placeholder-pink-300/40' : 'text-slate-800 placeholder-slate-400'
              }`}
            />
 
            <div className="flex items-center gap-2 mb-1 shrink-0">
              <button 
                type="button"
                title={isRecording ? "Detener grabación" : "Grabar nota de voz"}
                onClick={isRecording ? stopRecording : startRecording}
                className={`transition-colors cursor-pointer ${isRecording ? 'text-rose-600 animate-bounce' : stitchMode ? 'text-pink-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                type="submit"
                className="w-8 h-8 bg-cyan-600 text-white rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:bg-cyan-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Replies Quick Bars */}
          <div className="flex gap-4 mt-2.5 px-1 justify-between text-[11px] font-mono text-slate-400">
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={handleSuggestReply}
                className="hover:text-cyan-600 transition-colors font-bold uppercase tracking-tighter"
              >
                ⚡ Sugerencia Inteligente
              </button>
              <button 
                type="button"
                onClick={handleAttachTemplate}
                className="hover:text-cyan-600 transition-colors font-bold uppercase tracking-tighter"
              >
                📝 Insertar Plantilla
              </button>
            </div>
            
            {/* Auto Bot switch toggle indicator inside footer */}
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleToggleAi}>
              <span className="text-[10px]">Autopiloto IA:</span>
              <div className={`w-8 h-4 rounded-full relative transition-all ${activeCustomer.aiActive ? 'bg-cyan-600' : 'bg-slate-200'}`}>
                <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${activeCustomer.aiActive ? 'right-[2px]' : 'left-[2px]'}`}></div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* COLUMN 3: Contact details and action bar */}
      <section className={`w-full lg:w-80 border-t lg:border-t-0 flex flex-col h-auto lg:h-full overflow-y-auto chat-scrollbar ${
        stitchMode ? 'bg-[#131313] border-pink-500/20 text-white' : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <div className={`p-4 text-center border-b ${stitchMode ? 'border-pink-500/10' : 'border-slate-100'}`}>
          <div className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-slate-100 shadow-md overflow-hidden relative">
            <img 
              src={activeCustomer.avatar} 
              alt={activeCustomer.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h4 className={`text-sm font-bold ${stitchMode ? 'text-white' : 'text-slate-900'}`}>{activeCustomer.name}</h4>
          <p className="text-xs text-slate-500 font-sans mt-0.5">{activeCustomer.company}</p>
        </div>

        <div className="p-4 space-y-5 flex-1 select-none">
          {/* CRM Tags section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tags del Portal CRM</h5>
              <button 
                onClick={() => setIsAddingTag(!isAddingTag)}
                className="text-cyan-600 hover:text-cyan-700 transition-colors text-xs font-mono font-bold"
              >
                {isAddingTag ? 'Cerrar' : '+ Agregar'}
              </button>
            </div>

            {/* Tag Addition Form input inline */}
            {isAddingTag && (
              <form onSubmit={handleAddTag} className="flex gap-1.5 mb-3">
                <input 
                  type="text" 
                  placeholder="Nuevo Tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className={`text-xs rounded px-2 py-1 max-w-[130px] shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 ${
                    stitchMode ? 'bg-surface border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <button type="submit" className="bg-cyan-600 text-white font-bold text-xs px-2.5 py-1 rounded">Ok</button>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5">
              {activeCustomer.tags.map(t => (
                <span 
                  key={t}
                  className="px-2 py-0.5 bg-cyan-50/50 border border-cyan-200 text-cyan-700 text-[10px] font-bold rounded flex items-center gap-1 group"
                >
                  {t}
                  <button 
                    onClick={() => handleDeleteTag(t)}
                    type="button"
                    className="text-rose-400 hover:text-rose-600 font-black text-[9px] hover:scale-110 ml-0.5 leading-none transition-transform"
                    title="Eliminar Tag"
                  >
                    ×
                  </button>
                </span>
              ))}
              {activeCustomer.tags.length === 0 && (
                <span className="text-[10px] text-slate-400">Sin tags activos actualmente</span>
              )}
            </div>
          </div>

          {/* Contact info details */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
            <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Info de Contacto</h5>
            
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Email</p>
                <p className={`text-xs font-mono truncate mt-0.5 ${stitchMode ? 'text-white' : 'text-slate-800'}`}>{activeCustomer.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Contacto</p>
                <p className={`text-xs font-mono truncate mt-0.5 ${stitchMode ? 'text-white' : 'text-slate-800'}`}>{activeCustomer.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Ubicacion</p>
                <p className={`text-xs font-sans mt-0.5 ${stitchMode ? 'text-white' : 'text-slate-800'}`}>{activeCustomer.location}</p>
              </div>
            </div>
          </div>

          {/* Notes module */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Notas del Agente</h5>
            <textarea 
              value={tempNotes}
              onBlur={handleSaveNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Escribe notas de este prospecto..."
              rows={3}
              className={`w-full text-xs p-2 rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-cyan-600 ${
                stitchMode ? 'bg-[#201f1f] border-pink-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
            <p className="text-[9px] text-slate-400 text-right italic font-mono">Guardado automático en foco</p>
          </div>
        </div>

        {/* Create pipeline deal action button */}
        <div className={`p-4 border-t shrink-0 ${stitchMode ? 'border-pink-500/15' : 'border-slate-150'}`}>
          <button 
            type="button"
            onClick={handleCreateDeal}
            className="w-full bg-[#f87171] hover:bg-[#ef4444] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95 text-xs shadow-md"
          >
            Create Deal (💼 Registrar Negocio)
          </button>
        </div>
      </section>

    </div>
  );
}
