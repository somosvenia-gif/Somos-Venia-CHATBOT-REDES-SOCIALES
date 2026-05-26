import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (aiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: aiApiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
    console.log('Gemini GenAI initialized successfully.');
  } catch (error) {
    console.error('Error initializing Gemini GenAI:', error);
  }
} else {
  console.warn('GEMINI_API_KEY is not defined. Using smart local simulations for AI responses.');
}

// -------------------------------------------------------------
// SERVER-SIDE DATABASE DEFINITIONS & MEMORY ENGINE
// -------------------------------------------------------------
interface Message {
  id: string;
  sender: 'user' | 'agent' | 'bot';
  text: string;
  timestamp: string;
}

interface Customer {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  platform: 'whatsapp' | 'instagram' | 'facebook';
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  lastMessage: string;
  lastInteractionTime: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  tags: string[];
  notes: string;
  aiActive: boolean;
  messages: Message[];
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'whatsapp_sarah',
    name: 'Sarah Jenkins',
    handle: 'sarah.j_99',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2hCeHbWeJsTaAZHYboZmfJ1d94QEM2KVg83Yl6YJdW0QyNjIBN6jnBYouDlefP8mPQc-HO71XMgtfHCqu3Tyklh6rkh5SvGAMYqlUE72PMSs_5ee8iu8p1jSefchL4F6nb0lOsFocU7RSlXF008uFOOpLfNpOjFh2HPZb59pGyEIvbFLwFYJMf07iWe8ZoEEzZCFu_d-yVnmwUE1AqyV9uMyclc__z7eLVk9rKnTh6U-D_3M-r6iKav0vRAZnNgxXTfDiKP_0duc',
    platform: 'whatsapp',
    status: 'online',
    lastSeen: 'Online',
    lastMessage: 'I saw your recent post about the Scale-Up tier. Does it include automated WhatsApp sequences?',
    lastInteractionTime: '2m ago',
    email: 'sarah.j@lumina.io',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    company: 'Lumina Corp',
    tags: ['High Value', 'Scale-Up Lead', 'WhatsApp'],
    notes: 'Buscando herramientas de expansión para el Q4. Lead prioritario.',
    aiActive: true,
    messages: [
      { id: '1', sender: 'bot', text: "Hello Sarah! I'm the OmniCRM assistant. How can I help you today regarding our business plans?", timestamp: '10:45 AM' },
      { id: '2', sender: 'user', text: 'Hi! I saw your recent post about the Scale-Up tier. Does it include automated WhatsApp sequences for leads?', timestamp: '10:46 AM' },
      { id: '3', sender: 'agent', text: 'Hi Sarah, Marcus here from the success team. Yes, the Scale-Up tier includes full WhatsApp automation! Would you like a quick demo of how the builder works?', timestamp: '11:02 AM' }
    ]
  },
  {
    id: 'instagram_alex',
    name: 'Alex Rivera',
    handle: '@alex_lopez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUiAMDRTTacpK2SZBjSZB5ceFP93eobeh5ypjBNSYj-z12KgYEWcvAe71g5mr6gynHR3hEd0VSheRBwNHchzZ-Pb9ljwz2zJWsJj3EZXIuzvXOMcZzsLzlQet7HGFRGMFi1DrwT7enkQONZQ3fyzv4TZ8flw4upHZofT81zzJSECTUYNoCgvMbzMCN8iKar3mLRPt17ZdPZWbgN_BunB2Q3-zT62biLdLZVkJG_e3nLN9_dtnjeNU0HGpDM9XSJL9BanhHRUVriFM',
    platform: 'instagram',
    status: 'away',
    lastSeen: 'Away',
    lastMessage: 'Did you see the story I tagged you in?',
    lastInteractionTime: '15m ago',
    email: 'alex.rivera@designstudio.com',
    phone: '+1 (415) 321-9988',
    location: 'New York, NY',
    company: 'Design Studio LLC',
    tags: ['VIP', 'High Intent'],
    notes: 'Interesado en colaboración premium para campañas de Instagram.',
    aiActive: false,
    messages: [
      { id: 'x1', sender: 'user', text: 'Hey! Are you guys available for integrations?', timestamp: '9:15 AM' },
      { id: 'x2', sender: 'agent', text: 'Hello Alex! Absolutely, we offer native integrations with multiple CRMs and social tools.', timestamp: '9:30 AM' },
      { id: 'x3', sender: 'user', text: 'Did you see the story I tagged you in?', timestamp: '15m ago' }
    ]
  },
  {
    id: 'facebook_emily',
    name: 'Emily Thorne',
    handle: 'emily.thorne.official',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1H9ZL-FferCwSVovfrGE1dnX2e_RZudbPE_FSzKhNnmcbamYyoXOIBGav0G6lIMal-nHmV2YisGL97Skij2BDnFUOshKtfPEx8Oqz_T8MrUD_OXH2QzCUhU_F5DG437ACorSjFlHdmHsZ5WL0yS5qb_CDYAxGO07BvxR9PnAji9lDhjmUxnZIRC2uw2-yDBYHbmufN0HQwhJVcVC9IsCwKjw80OdxkBVl18VsgffZP_oRn3_CJtnY0duJFkA2Xjg9WO9Kxxa2l-I',
    platform: 'facebook',
    status: 'offline',
    lastSeen: 'Resolved',
    lastMessage: 'Thanks for the quick response earlier!',
    lastInteractionTime: '1h ago',
    email: 'emily@graysoncorp.org',
    phone: '+1 (310) 555-7000',
    location: 'The Hamptons, NY',
    company: 'Grayson Industries',
    tags: ['Tech Support', 'Loyal'],
    notes: 'Caso resuelto satisfactoriamente referente a facturación duplicada.',
    aiActive: true,
    messages: [
      { id: 'e1', sender: 'user', text: 'Hello, I have a doubt regarding my monthly transaction.', timestamp: '11:00 AM' },
      { id: 'e2', sender: 'bot', text: 'Hello Emily. I can help route your request. Let me check the billing records.', timestamp: '11:01 AM' },
      { id: 'e3', sender: 'agent', text: 'Resolved! I have reverted a small pending balance card surcharge.', timestamp: '11:15 AM' },
      { id: 'e4', sender: 'user', text: 'Thanks for the quick response earlier!', timestamp: '1h ago' }
    ]
  }
];

// Firebase Integration
async function leerDB(): Promise<Record<string, Customer>> {
    if (!process.env.FIREBASE_DB_URL) return {};
    try {
        const url = `${process.env.FIREBASE_DB_URL}customers.json`;
        const response = await axios.get(url);
        return response.data || {};
    } catch (error: any) {
        console.error('Error leyendo desde Firebase:', error.message);
        return {};
    }
}

async function guardarDB(data: Record<string, Customer>) {
    if (!process.env.FIREBASE_DB_URL) return;
    try {
        const url = `${process.env.FIREBASE_DB_URL}customers.json`;
        await axios.put(url, data);
    } catch (error: any) {
        console.error('Error guardando en Firebase:', error.message);
    }
}

async function getOrCreateCustomer(senderId: string, name: string, plataforma: 'whatsapp' | 'messenger' | 'instagram', db: Record<string, Customer>): Promise<Customer> {
    const key = `${plataforma}_${senderId}`;
    if (!db[key]) {
        db[key] = {
            id: key,
            name: name,
            handle: `@${senderId}`,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLl3TMRsp9fCQk1W-zufJUO1MmSHpgiAEzVAfMqq4eRv0WD4qUth3pjP_HaM16pjoFbiC1Xt_xiq6yNXxom-14U1WDyJ3oFGLEumOq1ox1sGS8N6PzUR74SnOKLVKt1xybdP8eWEAPTgAwFBoygimq8UHDAJ5SFipmg0YX9VBCAspBV6D9lzFwyA9JHxbjL9D7urCxCJ7VvuG93FX2qL07cU3cyfI5zevAi8kFv3KBj67q9DCWhv9RWuCfJDmDfq-UdVh7nFauL3s',
            platform: plataforma === 'messenger' ? 'facebook' : plataforma,
            status: 'online',
            lastSeen: 'Online',
            lastMessage: '',
            lastInteractionTime: 'Just now',
            email: `${senderId}@meta-channels.com`,
            phone: senderId,
            location: 'Active Webhook Hub',
            company: 'Sincronización Live',
            tags: ['WebHook', 'Real Time', plataforma.toUpperCase()],
            notes: 'Conversación ingresada por Webhook activo.',
            aiActive: true,
            messages: []
        };
    }
    return db[key];
}

async function descargarAudioDesdeMeta(mediaId: string): Promise<Buffer | null> {
    try {
        const urlMetadata = `https://graph.facebook.com/v20.0/${mediaId}`;
        const responseMetadata = await axios.get(urlMetadata, {
            headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` }
        });
        const downloadUrl = responseMetadata.data.url;

        const responseAudio = await axios.get(downloadUrl, {
            headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` },
            responseType: 'arraybuffer'
        });
        return Buffer.from(responseAudio.data);
    } catch (error: any) {
        console.error('Error descargando audio de Meta:', error.response?.data || error.message);
        return null;
    }
}

async function enviarMensajeWhatsApp(to: string, text: string) {
    if(!process.env.WHATSAPP_TOKEN) return;
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    try {
        await axios.post(url, {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: text }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        console.error('Error con WhatsApp API:', error.response?.data || error.message);
    }
}

async function enviarMensajeMessengerEInstagram(recipientId: string, text: string, plataforma: string) {
    if(!process.env.FACEBOOK_PAGE_TOKEN) return;
    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${process.env.FACEBOOK_PAGE_TOKEN}`;
    try {
        await axios.post(url, {
            recipient: { id: recipientId },
            message: { text: text }
        });
        console.log(`[${plataforma.toUpperCase()}] Mensaje enviado de vuelta.`);
    } catch (error: any) {
        console.error(`Error enviando a ${plataforma}:`, error.response?.data || error.message);
    }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.use(express.json());

  // Init DB
  let db = await leerDB();
  if (Object.keys(db).length === 0) {
    const initDb: Record<string, Customer> = {};
    INITIAL_CUSTOMERS.forEach(c => { initDb[c.id] = c; });
    await guardarDB(initDb);
  }

  // -------------------------------------------------------------
  // REST API PARA EL FRONTEND DE REACT
  // -------------------------------------------------------------
  app.get('/api/customers', async (req, res) => {
    const db = await leerDB();
    res.json(Object.values(db));
  });

  app.post('/api/customers/clear', async (req, res) => {
    await guardarDB({});
    res.json({ success: true, count: 0 });
  });

  app.post('/api/customers/restore', async (req, res) => {
    const initDb: Record<string, Customer> = {};
    INITIAL_CUSTOMERS.forEach(c => { initDb[c.id] = c; });
    await guardarDB(initDb);
    res.json(Object.values(initDb));
  });

  app.post('/api/customers/add', async (req, res) => {
    const { customer } = req.body;
    if (customer) {
      const db = await leerDB();
      db[customer.id] = customer;
      await guardarDB(db);
    }
    res.json({ success: true });
  });

  app.post('/api/customers/delete', async (req, res) => {
    const { id } = req.body;
    if (id) {
      const db = await leerDB();
      delete db[id];
      await guardarDB(db);
    }
    res.json({ success: true });
  });

  app.post('/api/customers/update', async (req, res) => {
    const { customer } = req.body;
    if (customer) {
      const db = await leerDB();
      const oldCustomer = db[customer.id];
      db[customer.id] = customer;

      // Detect if the frontend agent manually replied and send it to Meta!
      if (oldCustomer && customer.messages.length > oldCustomer.messages.length) {
          const newMsg = customer.messages[customer.messages.length - 1];
          if (newMsg.sender === 'agent' || newMsg.sender === 'bot') {
              if (customer.platform === 'whatsapp') {
                  await enviarMensajeWhatsApp(customer.phone, newMsg.text);
              } else {
                  await enviarMensajeMessengerEInstagram(customer.phone, newMsg.text, customer.platform);
              }
          }
      }
      await guardarDB(db);
      io.emit('customers_updated'); // Si tenemos clientes socket conectados
    }
    res.json({ success: true });
  });

  app.post('/api/webhook/forward', async (req, res) => {
    // Mantener esto si la UI lo llama (no hace falta si se envía directo arriba, pero por compatibilidad lo dejamos)
    res.json({ success: true, status: 200 });
  });

  // -------------------------------------------------------------
  // META WEBHOOK HANDSHAKE & INBOUND
  // -------------------------------------------------------------
  app.get(['/webhook', '/api/webhook'], (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
        console.log('Webhook de Meta verificado.');
        return res.status(200).send(challenge);
    } else if (mode === 'subscribe') {
        return res.status(200).send(challenge); // fallback testing
    }
    return res.status(200).send('Meta Webhook Active');
  });

  async function procesarMensaje(senderId: string, name: string, text: string, plataforma: 'whatsapp' | 'messenger' | 'instagram', isAudio: boolean = false, audioBuffer: Buffer | null = null) {
      const db = await leerDB();
      const customer = await getOrCreateCustomer(senderId, name, plataforma, db);
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const displayText = isAudio ? "🎙️ Nota de voz (Escuchando...)" : text;
      customer.messages.push({ id: Math.random().toString(), sender: 'user', text: displayText, timestamp: timestampStr });
      customer.lastMessage = displayText;
      customer.lastInteractionTime = 'Just now';
      
      await guardarDB(db);
      io.emit('new_message', customer);

      if (customer.aiActive && ai) {
          try {
              const systemInstruction = `Eres STITCH (Experimento 626) de Disney en este CRM de soporte omnicanal.
              - Hablas español divertido, dulce y alienígena.
              - Usa '¡Meega nala k queens!', '¡Ih!', 'Aloha', '¡Taka aki!'.
              - Resuelve dudas y da amor a la Ohana (familia).`;

              let aiResponseText = "¡Aloha! He recibido tu mensaje pero tengo problemas de comunicación galáctica.";

              if (isAudio && audioBuffer) {
                  const audioBase64 = audioBuffer.toString('base64');
                  const response = await ai.models.generateContent({
                      model: 'gemini-3.5-flash',
                      contents: [{ inlineData: { data: audioBase64, mimeType: 'audio/ogg' } }, "Escucha atentamente esta nota de voz y responde de forma amigable y concisa."],
                      config: { systemInstruction, temperature: 0.8 }
                  });
                  aiResponseText = response.text || aiResponseText;
              } else {
                  const response = await ai.models.generateContent({
                      model: 'gemini-3.5-flash',
                      contents: text,
                      config: { systemInstruction, temperature: 0.8 }
                  });
                  aiResponseText = response.text || aiResponseText;
              }

              customer.messages.push({ id: Math.random().toString(), sender: 'bot', text: aiResponseText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
              customer.lastMessage = aiResponseText;
              await guardarDB(db);

              if (plataforma === 'whatsapp') {
                  await enviarMensajeWhatsApp(customer.phone, aiResponseText);
              } else {
                  await enviarMensajeMessengerEInstagram(customer.phone, aiResponseText, plataforma);
              }
              io.emit('new_message', customer);
          } catch (e) {
              console.error('Error AI:', e);
          }
      }
  }

  app.post(['/webhook', '/api/webhook'], async (req, res) => {
    const body = req.body;
    
    // WHATSAPP
    if (body.object === 'whatsapp_business_account') {
        try {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0]?.value;
            const message = change?.messages?.[0];
            const senderName = change?.contacts?.[0]?.profile?.name || 'Cliente de WhatsApp';

            if (message) {
                const senderId = message.from;
                if (message.type === 'text') {
                    await procesarMensaje(senderId, senderName, message.text.body, 'whatsapp');
                } else if (message.type === 'audio') {
                    const audioBuffer = await descargarAudioDesdeMeta(message.audio.id);
                    await procesarMensaje(senderId, senderName, '', 'whatsapp', true, audioBuffer);
                }
            }
        } catch (e) { console.error(e); }
        return res.sendStatus(200);
    }

    // FACEBOOK MESSENGER
    if (body.object === 'page') {
        try {
            const entry = body.entry?.[0];
            const message = entry?.messaging?.[0]?.message;
            const senderId = entry?.messaging?.[0]?.sender?.id;
            if (message && !message.is_echo && message.text) {
                await procesarMensaje(senderId, `Cliente FB (${senderId.substring(0,5)})`, message.text, 'messenger');
            }
        } catch (e) { console.error(e); }
        return res.sendStatus(200);
    }

    // INSTAGRAM
    if (body.object === 'instagram') {
        try {
            const entry = body.entry?.[0];
            const message = entry?.messaging?.[0]?.message;
            const senderId = entry?.messaging?.[0]?.sender?.id;
            if (message && !message.is_echo && message.text) {
                await procesarMensaje(senderId, `Cliente IG (${senderId.substring(0,5)})`, message.text, 'instagram');
            }
        } catch (e) { console.error(e); }
        return res.sendStatus(200);
    }

    res.sendStatus(404);
  });

  // REST endpoints for AI generated response inside UI
  app.post('/api/chat/respond', async (req, res) => {
    const { prompt, history, stitchMode } = req.body;
    // ... Genera mock (el bot de arriba ya responde autom. pero esto es para el panel de sugerencias manual)
    res.json({ text: 'Sugerencia de AI procesada.', isMock: true });
  });

  app.post('/api/suggest-reply', async (req, res) => {
      res.json({ suggestion: 'Sugerencia predeterminada de respuesta rápida.' });
  });

  // Socket.io for Realtime Panel (if needed by external client)
  io.on('connection', async (socket) => {
      const db = await leerDB();
      socket.emit('init_chats', db);
  });

  // Vite development middleware or production static build server
  if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_HMR !== 'true') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Omnicanal Unificado activo en puerto ${PORT}`);
  });
}

startServer();
