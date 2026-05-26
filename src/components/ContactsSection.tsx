import React, { useState } from 'react';
import { Customer, Platform } from '../types';
import { 
  Users, MessageSquare, Download, 
  Trash2, Mail, MapPin, Phone, CheckSquare, Plus, ChevronLeft, ChevronRight, Filter, Search
} from 'lucide-react';

interface ContactsSectionProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onSelectCustomerForChat: (id: string) => void;
  onClearCustomer: (id: string) => void;
  stitchMode: boolean;
}

export default function ContactsSection({
  customers,
  onAddCustomer,
  onSelectCustomerForChat,
  onClearCustomer,
  stitchMode
}: ContactsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<'all' | 'vip' | 'lead' | 'support'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Contact State Form Form
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('whatsapp');
  const [newNotes, setNewNotes] = useState('');

  // Stats Counters
  const calculatedTotal = customers.length + 12838;
  const calculatedWhatsApp = 8211 + customers.filter(c => c.platform === 'whatsapp').length;
  const calculatedInstagram = 3490 + customers.filter(c => c.platform === 'instagram').length;
  const calculatedFacebook = 1141 + customers.filter(c => c.platform === 'facebook').length;

  // Handles client-side CSV download simulation
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Nombre,Platform,Email,Ubicacion,Compañia,Tags\n';
    
    customers.forEach(c => {
      csvContent += `${c.id},"${c.name}",${c.platform},${c.email},"${c.location}","${c.company}","${c.tags.join('|')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'OmniCRM_Contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handles adding contact form submittals
  const handleSubmitNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const acronym = newName.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
    
    // Choose nice colored abstract avatar based on name length
    const colorSeed = newName.length % 5;
    const placeholderAvatars = [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCp7CDeIti_6nRRhveirew2GHQIhJx4p8U11nRGt4oji_gZ598qH8ynjKKPl-j-eNo3R_ewBUWEb0b3MJYm39aymXvfo0KhoSjFMNZB4UVcsUsn9x8axdNFJQzc797mXiQ92Ljx6lzHrMSyB5mWn9bKFNlpPfw_bVEZvuMBcLbtjTPf1SrSwlSnLTRd2hpN8uRg1WTjcGYoKjuIe6W7kzpa_bBNt9tymA31-kUYQXBJ21xZC2uk1j_3mXaVIPGNa9B50PCJx11iLxo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLl3TMRsp9fCQk1W-zufJUO1MmSHpgiAEzVAfMqq4eRv0WD4qUth3pjP_HaM16pjoFbiC1Xt_xiq6yNXxom-14U1WDyJ3oFGLEumOq1ox1sGS8N6PzUR74SnOKLVKt1xybdP8eWEAPTgAwFBoygimq8UHDAJ5SFipmg0YX9VBCAspBV6D9lzFwyA9JHxbjL9D7urCxCJ7VvuG93FX2qL07cU3cyfI5zevAi8kFv3KBj67q9DCWhv9RWuCfJDmDfq-UdVh7nFauL3s',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBUiAMDRTTacpK2SZBjSZB5ceFP93eobeh5ypjBNSYj-z12KgYEWcvAe71g5mr6gynHR3hEd0VSheRBwNHchzZ-Pb9ljwz2zJWsJj3EZXIuzvXOMcZzsLzlQet7HGFRGMFi1DrwT7enkQONZQ3fyzv4TZ8flw4upHZofT81zzJSECTUYNoCgvMbzMCN8iKar3mLRPt17ZdPZWbgN_BunB2Q3-zT62biLdLZVkJG_e3nLN9_dtnjeNU0HGpDM9XSJL9BanhHRUVriFM',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC1H9ZL-FferCwSVovfrGE1dnX2e_RZudbPE_FSzKhNnmcbamYyoXOIBGav0G6lIMal-nHmV2YisGL97Skij2BDnFUOshKtfPEx8Oqz_T8MrUD_OXH2QzCUhU_F5DG437ACorSjFlHdmHsZ5WL0yS5qb_CDYAxGO07BvxR9PnAji9lDhjmUxnZIRC2uw2-yDBYHbmufN0HQwhJVcVC9IsCwKjw80OdxkBVl18VsgffZP_oRn3_CJtnY0duJFkA2Xjg9WO9Kxxa2l-I',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2hCeHbWeJsTaAZHYboZmfJ1d94QEM2KVg83Yl6YJdW0QyNjIBN6jnBYouDlefP8mPQc-HO71XMgtfHCqu3Tyklh6rkh5SvGAMYqlUE72PMSs_5ee8iu8p1jSefchL4F6nb0lOsFocU7RSlXF008uFOOpLfNpOjFh2HPZb59pGyEIvbFLwFYJMf07iWe8ZoEEzZCFu_d-yVnmwUE1AqyV9uMyclc__z7eLVk9rKnTh6U-D_3M-r6iKav0vRAZnNgxXTfDiKP_0duc'
    ];

    const newCustomer: Customer = {
      id: `${newPlatform}_${Date.now()}`,
      name: newName,
      handle: newHandle ? (newHandle.startsWith('@') ? newHandle : `@${newHandle}`) : `@${newName.replaceAll(' ', '_').toLowerCase()}`,
      avatar: placeholderAvatars[colorSeed],
      platform: newPlatform,
      status: 'online',
      lastSeen: 'Online',
      lastMessage: 'Nuevo registro creado desde la base de datos.',
      lastInteractionTime: 'Just now',
      email: newEmail,
      phone: newPhone || '+1 (555) 000-0000',
      location: newLocation || 'San Francisco, CA',
      company: newCompany || 'Compañia Independiente',
      tags: stitchMode ? ['Ohana', 'Nuevo Prospecto'] : ['Nurturing', 'Nuevo Contacto'],
      notes: newNotes || 'Creado vía botón.',
      aiActive: true,
      messages: [
        {
          id: 'init-msg',
          sender: 'bot',
          text: stitchMode ? '¡Ih! Stitch saluda a nuevo miembro de nuestra Ohana. ¿Qué travesuras cósmicas planeamos hoy?' : 'Hola. Gracias por contactarnos, soy OmniBot. ¿En qué podemos ayudarte?',
          timestamp: 'Just now'
        }
      ]
    };

    onAddCustomer(newCustomer);

    // Reset Form Fields
    setNewName('');
    setNewHandle('');
    setNewPhone('');
    setNewEmail('');
    setNewLocation('');
    setNewCompany('');
    setNewNotes('');
    setIsModalOpen(false);
  };

  // Handles checkboxes toggle inside the main table
  const handleToggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (confirm(`¿Eliminar en bloque los ${selectedIds.length} contactos seleccionados?`)) {
      selectedIds.forEach(id => onClearCustomer(id));
      setSelectedIds([]);
    }
  };

  // Filters calculation
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.handle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
    
    let matchesSegment = true;
    if (activeSegment === 'vip') {
      matchesSegment = c.tags.some(t => t.toLowerCase().includes('vip') || t.toLowerCase().includes('high'));
    } else if (activeSegment === 'lead') {
      matchesSegment = c.tags.some(t => t.toLowerCase().includes('lead') || t.toLowerCase().includes('promo'));
    } else if (activeSegment === 'support') {
      matchesSegment = c.tags.some(t => t.toLowerCase().includes('support') || t.toLowerCase().includes('loyal'));
    }

    return matchesSearch && matchesPlatform && matchesSegment;
  });

  return (
    <div id="contacts-segment-wrapper" className="space-y-6">
      
      {/* Upper header action areas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            👤 {stitchMode ? 'Base de Datos de nuestra Ohana' : 'Directorio de Contactos y Segmentos'}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 font-sans">
            Administre, filtre por canales y agrupe las audiencias de su chatbot de forma simplificada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBatchDelete}
              className="bg-red-900/30 border border-red-500/30 text-rose-300 font-semibold px-4 py-2 rounded-lg text-xs hover:bg-red-500/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95 animate-pulse"
            >
              <Trash2 className="w-4 h-4" /> Eliminar ({selectedIds.length})
            </button>
          )}

          <button 
            type="button"
            onClick={handleExportCSV}
            className="bg-surface-container-high border border-outline-variant text-[#e5e2e1] px-4 py-2 rounded-lg text-xs font-semibold hover:border-primary flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 hover:bg-[#a1efff]"
          >
            <Plus className="w-4 h-4" /> Agregar Cliente
          </button>
        </div>
      </div>

      {/* Bento Stats Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1 bg-surface-container/60 border border-outline-variant/30">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Base Consolidada</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight text-[#44d8f1]">{calculatedTotal.toLocaleString()}</span>
            <span className="text-emerald-400 text-xs font-mono mb-1">+4.2%</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 bg-surface-container/60 border border-outline-variant/30">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">WhatsApp Sincronizado</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight text-white">{calculatedWhatsApp.toLocaleString()}</span>
            <span className="text-primary text-xs font-mono mb-1">64%</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 bg-surface-container/60 border border-outline-variant/30">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Instagram Sincronizado</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight text-white">{calculatedInstagram.toLocaleString()}</span>
            <span className="text-secondary text-xs font-mono mb-1">27%</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 bg-surface-container/60 border border-outline-variant/30">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Facebook Sincronizado</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight text-white">{calculatedFacebook.toLocaleString()}</span>
            <span className="text-on-surface-variant text-xs font-mono mb-1">9%</span>
          </div>
        </div>
      </div>

      {/* Main Filter and Contacts Table Container */}
      <div className="glass-panel rounded-xl overflow-hidden bg-surface-container/40 border border-outline-variant/30">
        
        {/* Filters Top Bar */}
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-1 lg:gap-2">
            <button 
              onClick={() => setActiveSegment('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold leading-none cursor-pointer ${
                activeSegment === 'all' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
              }`}
            >
              Todos los Contactos
            </button>
            <button 
              onClick={() => setActiveSegment('vip')}
              className={`px-3 py-1 rounded-full text-xs font-bold leading-none cursor-pointer ${
                activeSegment === 'vip' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
              }`}
            >
              VIP / Altos Leads
            </button>
            <button 
              onClick={() => setActiveSegment('lead')}
              className={`px-3 py-1 rounded-full text-xs font-bold leading-none cursor-pointer ${
                activeSegment === 'lead' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
              }`}
            >
              Nurturing
            </button>
            <button 
              onClick={() => setActiveSegment('support')}
              className={`px-3 py-1 rounded-full text-xs font-bold leading-none cursor-pointer ${
                activeSegment === 'support' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
              }`}
            >
              Soporte Completo
            </button>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Inline search box */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-on-surface-variant">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface border border-outline-variant text-xs text-white rounded-lg pl-8 pr-2 py-1.5 w-44 hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <span className="text-xs text-on-surface-variant">Filtrar por:</span>
            <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as any)}
              className="bg-surface border border-outline-variant text-xs text-white rounded-lg px-2 py-1.5 hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Sistemas</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

        </div>

        {/* Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-surface-container-high/40 border-b border-outline-variant/30">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === customers.length && customers.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-outline-variant bg-surface text-primary focus:ring-primary"
                  />
                </th>
                <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cliente / Cuenta</th>
                <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Canal</th>
                <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Último Mensaje</th>
                <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tags / Segmento</th>
                <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              
              {filteredCustomers.map(cust => {
                const idSelected = selectedIds.includes(cust.id);
                const acronym = cust.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
                
                return (
                  <tr 
                    key={cust.id} 
                    className={`hover:bg-surface-container-high/20 transition-colors ${idSelected ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox"
                        checked={idSelected}
                        onChange={() => handleToggleSelectOne(cust.id)}
                        className="rounded border-outline-variant bg-surface text-primary focus:ring-primary"
                      />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={cust.avatar} 
                          alt={cust.name} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-outline-variant/30 object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{cust.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{cust.handle}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {cust.platform === 'whatsapp' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#25D366]/10 text-[#25d366] border border-[#25D366]/20">
                          WhatsApp
                        </span>
                      )}
                      {cust.platform === 'instagram' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#E1306C]/10 text-pink-400 border border-[#E1306C]/20">
                          Instagram
                        </span>
                      )}
                      {cust.platform === 'facebook' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#1877F2]/10 text-blue-400 border border-[#1877F2]/20">
                          Facebook
                        </span>
                      )}
                    </td>

                    <td className="p-4 max-w-[200px]">
                      <p className="text-xs text-white truncate">{cust.lastMessage}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{cust.lastInteractionTime}</p>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {cust.tags.map(t => (
                          <span 
                            key={t}
                            className="px-1.5 py-0.5 bg-surface-container-highest border border-outline-variant text-on-surface-variant text-[10px] rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => onSelectCustomerForChat(cust.id)}
                        className="p-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary rounded transition-all cursor-pointer mr-1"
                        title="Iniciar Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-on-surface-variant">
                    Ningún lead calificado coincide con los filtros aplicados en el dashboard.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Dyn Pagination interface */}
        <div className="p-4 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/20">
          <p className="text-xs text-on-surface-variant font-mono">
            Mostrando 1 a {filteredCustomers.length} de {calculatedTotal.toLocaleString()} contactos
          </p>
          <div className="flex items-center gap-1.5">
            <button className="p-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-white cursor-pointer hover:border-primary">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-6 h-6 rounded bg-primary text-on-primary font-bold text-xs">1</button>
            <button className="w-6 h-6 rounded bg-surface-container text-xs text-white hover:bg-surface-container-high transition-colors">2</button>
            <button className="w-6 h-6 rounded bg-surface-container text-xs text-white hover:bg-surface-container-high transition-colors">3</button>
            <span className="text-xs text-on-surface-variant px-1 font-mono">...</span>
            <button className="w-6 h-6 rounded bg-surface-container text-xs text-white hover:bg-surface-container-high transition-colors">128</button>
            <button className="p-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-white cursor-pointer hover:border-primary">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Manual ADD CONTACT popup modal drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-surface-container border border-outline-variant/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-outline-variant/30 bg-[#131313] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">👤 Añadir Nuevo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmitNewContact} className="p-5 space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Sarah Jenkins"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Nombre de Usuario / Handle</label>
                  <input 
                    type="text" 
                    placeholder="@sarah_j"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Número de Teléfono</label>
                  <input 
                    type="text" 
                    placeholder="+34 600 000 000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    placeholder="sarah@corp.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Ubicación</label>
                  <input 
                    type="text" 
                    placeholder="Barcelona, España"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Empresa</label>
                  <input 
                    type="text" 
                    placeholder="Grayson Industries"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Canal Predeterminado</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-white">
                    <input 
                      type="radio" 
                      name="new_platform" 
                      value="whatsapp" 
                      checked={newPlatform === 'whatsapp'} 
                      onChange={() => setNewPlatform('whatsapp')}
                      className="border-outline-variant bg-surface text-primary focus:ring-primary"
                    />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-white">
                    <input 
                      type="radio" 
                      name="new_platform" 
                      value="instagram" 
                      checked={newPlatform === 'instagram'} 
                      onChange={() => setNewPlatform('instagram')}
                      className="border-outline-variant bg-surface text-primary focus:ring-primary"
                    />
                    Instagram
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-white">
                    <input 
                      type="radio" 
                      name="new_platform" 
                      value="facebook" 
                      checked={newPlatform === 'facebook'} 
                      onChange={() => setNewPlatform('facebook')}
                      className="border-outline-variant bg-surface text-primary focus:ring-primary"
                    />
                    Facebook
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Comentario Inicial</label>
                <textarea 
                  placeholder="Escribe notas iniciales referente al prospecto"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
                <button 
                  type="submit" 
                  className="flex-1 bg-primary text-on-primary font-bold text-xs py-2 rounded-lg active:scale-95 shadow-sm cursor-pointer"
                >
                  Registrar Contacto
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 bg-surface-container-high border border-outline-variant text-[#e5e2e1] text-xs py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
