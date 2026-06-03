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
// AI API RETRY WRAPPER
// -------------------------------------------------------------
async function generateContentWithRetry(aiClient: GoogleGenAI, params: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (error: any) {
      if (error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand')) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`[AI API] 503 Service Unavailable. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// -------------------------------------------------------------
// SERVER-SIDE DATABASE DEFINITIONS & MEMORY ENGINE
// -------------------------------------------------------------
interface Message {
  id: string;
  sender: 'user' | 'agent' | 'bot';
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio';
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

// Sin datos de demostración — la bandeja inicia vacía y se puebla con mensajes reales de Meta
const INITIAL_CUSTOMERS: Customer[] = [];

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

async function descargarMediaDesdeMeta(mediaId: string): Promise<Buffer | null> {
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
        console.error('Error descargando media de Meta:', error.response?.data || error.message);
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
  const PORT = Number(process.env.PORT) || 3000;
  
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

  async function procesarMensaje(
      senderId: string, 
      name: string, 
      text: string, 
      plataforma: 'whatsapp' | 'messenger' | 'instagram', 
      isAudio: boolean = false, 
      audioBuffer: Buffer | null = null,
      isImage: boolean = false,
      imageBuffer: Buffer | null = null,
      imageMimeType: string = 'image/jpeg'
  ) {
      const db = await leerDB();
      const customer = await getOrCreateCustomer(senderId, name, plataforma, db);
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let displayText = text;
      let mediaUrl: string | undefined = undefined;
      let mediaType: 'image' | 'audio' | undefined = undefined;

      if (isAudio) {
          displayText = "🎙️ Nota de voz (Escuchando...)";
          mediaType = 'audio';
          if (audioBuffer) {
              const base64 = audioBuffer.toString('base64');
              mediaUrl = `data:audio/ogg;base64,${base64}`;
          }
      } else if (isImage) {
          displayText = text || "📷 Imagen recibida";
          mediaType = 'image';
          if (imageBuffer) {
              const base64 = imageBuffer.toString('base64');
              mediaUrl = `data:${imageMimeType};base64,${base64}`;
          }
      }

      customer.messages.push({ 
          id: Math.random().toString(), 
          sender: 'user', 
          text: displayText, 
          timestamp: timestampStr,
          mediaUrl,
          mediaType
      });
      customer.lastMessage = displayText;
      customer.lastInteractionTime = 'Just now';
      
      await guardarDB(db);
      io.emit('new_message', customer);

      if (customer.aiActive && ai) {
          try {
              const systemInstruction = `Eres el Asistente Virtual de Atención al Cliente de SomosVenia, una agencia especializada en automatización con Inteligencia Artificial, desarrollo de flujos de trabajo (n8n/Make) y diseño y desarrollo de páginas web y soluciones digitales estratégicas para negocios. 

Tu objetivo principal es brindar una atención de primer nivel: profesional, empática, eficiente y muy amigable. Debes hacer que el usuario se sienta escuchado y comprendido desde el primer mensaje.

### 1. TONO Y PERSONALIDAD
- **Profesional pero cercano:** Usa un lenguaje claro y corporativo, pero evita ser acartonado o excesivamente robótico. Háblale al cliente con calidez (puedes usar el "tú" de forma respetuosa).
- **Resolutivo y proactivo:** No te limites a responder con evasivas; busca siempre guiar al cliente hacia la mejor solución o el servicio que realmente necesita.
- **Identidad:** Eres un asistente IA, no pretendas ser un humano, pero demuestra que tienes toda la capacidad para ayudarle en el proceso.

### 2. PROTOCOLO DE DERIVACIÓN A UN HUMANO (CRÍTICO)
Si detectas cualquiera de las siguientes situaciones, debes preparar la transferencia a un miembro del equipo de manera inmediata y natural:
1. El usuario pide explícitamente "hablar con una persona", "un asesor", "un humano" o "un agente".
2. El usuario presenta un problema técnico complejo o un reclamo que requiere supervisión manual.
3. La consulta sale por completo del alcance de los servicios de SomosVenia.

**Cómo actuar para la derivación:**
- Mantén la calma y la amabilidad.
- Confirma que transferirás la conversación.
- *Ejemplo de respuesta:* "¡Por supuesto! Para darte la atención detallada que necesitas, voy a pasarte con uno de nuestros especialistas del equipo humano de SomosVenia. En un momento se pondrán en contacto contigo por este medio. ¡Gracias por tu paciencia!"
- [NUNCA inventes nombres de asesores a menos que se te configuren previamente; usa "nuestro equipo" o "un especialista"].
- Cuando derives al usuario, añade el texto "[DERIVAR_HUMANO]" discretamente o al final del mensaje para que la plataforma sepa que debe pausar la IA y asignar un humano.

### 3. DIRECTRICES DE RESPUESTA Y ALCANCE
- **Brevedad y claridad:** Evita bloques de texto gigantescos. Usa viñetas o saltos de línea para que la lectura sea ágil en canales de chat (WhatsApp/Web).
- **Contexto de servicios:** Estás aquí para guiar a los interesados en:
  * Automatización de procesos y flujos de trabajo con n8n/Make.
  * Diseño y desarrollo de páginas web, landing pages y plataformas digitales estratégicas.
  * Consultoría tecnológica e implementación de IA en negocios.
- **Límites de información:** Si preguntan detalles ultra específicos de precios, cotizaciones a medida o contratos que no tienes en tu base de conocimientos, ofrece de inmediato la transferencia al equipo comercial o humano.
- **Idioma:** Responde siempre en español, adaptando sutilmente el entusiasmo al tono del cliente.
- **Multimodalidad:** Tienes capacidad para escuchar notas de voz y analizar imágenes. Si el cliente te envía una imagen o audio, agradece el material e incorpóralo en tu respuesta con total naturalidad.`;

              let aiResponseText = "Hola, he recibido tu mensaje pero tengo un inconveniente de comunicación. En un momento te responderé.";

              const contents: any[] = [];
              if (customer.messages && customer.messages.length > 1) {
                  const recentHistory = customer.messages.slice(-7, -1);
                  recentHistory.forEach((msg) => {
                      contents.push({
                          role: msg.sender === 'user' ? 'user' : 'model',
                          parts: [{ text: msg.text }]
                      });
                  });
              }

              const currentParts: any[] = [];
              if (isAudio && audioBuffer) {
                  const audioBase64 = audioBuffer.toString('base64');
                  currentParts.push({ inlineData: { data: audioBase64, mimeType: 'audio/ogg' } });
                  currentParts.push({ text: "Escucha atentamente esta nota de voz y responde amablemente." });
              } else if (isImage && imageBuffer) {
                  const imageBase64 = imageBuffer.toString('base64');
                  currentParts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
                  currentParts.push({ text: text || "Analiza detalladamente esta imagen para guiar al cliente." });
              } else {
                  currentParts.push({ text: text });
              }

              if (contents.length > 0) {
                  contents.push({ role: 'user', parts: currentParts });
              } else {
                  contents.push(...currentParts);
              }

              const response = await generateContentWithRetry(ai, {
                  model: 'gemini-3.5-flash',
                  contents: contents,
                  config: { systemInstruction, temperature: 0.7 }
              });
              aiResponseText = response?.text || aiResponseText;

              customer.messages.push({ 
                  id: Math.random().toString(), 
                  sender: 'bot', 
                  text: aiResponseText, 
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              });
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
                    const audioBuffer = await descargarMediaDesdeMeta(message.audio.id);
                    await procesarMensaje(senderId, senderName, '', 'whatsapp', true, audioBuffer);
                } else if (message.type === 'image') {
                    const imageBuffer = await descargarMediaDesdeMeta(message.image.id);
                    const caption = message.image.caption || '';
                    const mimeType = message.image.mime_type || 'image/jpeg';
                    await procesarMensaje(senderId, senderName, caption, 'whatsapp', false, null, true, imageBuffer, mimeType);
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
    const { prompt, history, platform, stitchMode, imageBase64, imageMimeType, audioBase64, audioMimeType } = req.body;
    
    if (!ai) {
      let reply = "Hola, soy el asistente virtual de SomosVenia. Estoy operando en modo simulación local sin API Key.";
      if (prompt && prompt.toLowerCase().includes("hola")) {
        reply = "¡Hola! Bienvenido a SomosVenia. ¿En qué te puedo colaborar hoy? Podemos automatizar tus flujos con n8n/Make o diseñar tu web ideal.";
      } else if (prompt && (prompt.toLowerCase().includes("humano") || prompt.toLowerCase().includes("asesor"))) {
        reply = "¡Por supuesto! Para darte la atención detallada que necesitas, voy a pasarte con uno de nuestros especialistas del equipo humano de SomosVenia. En un momento se pondrán en contacto contigo por este medio. [DERIVAR_HUMANO]";
      }
      return res.json({ text: reply });
    }

    try {
      const systemInstruction = `Eres el Asistente Virtual de Atención al Cliente de SomosVenia, una agencia especializada en automatización con Inteligencia Artificial, desarrollo de flujos de trabajo (n8n/Make) y diseño y desarrollo de páginas web y soluciones digitales estratégicas para negocios. 

Tu objetivo principal es brindar una atención de primer nivel: profesional, empática, eficiente y muy amigable. Debes hacer que el usuario se sienta escuchado y comprendido desde el primer mensaje.

### 1. TONO Y PERSONALIDAD
- **Profesional pero cercano:** Usa un lenguaje claro y corporativo, pero evita ser acartonado o excesivamente robótico. Háblale al cliente con calidez (puedes usar el "tú" de forma respetuosa).
- **Resolutivo y proactivo:** No te limites a responder con evasivas; busca siempre guiar al cliente hacia la mejor solución o el servicio que realmente necesita.
- **Identidad:** Eres un asistente IA, no pretendas ser un humano, pero demuestra que tienes toda la capacidad para ayudarle en el proceso.

### 2. PROTOCOLO DE DERIVACIÓN A UN HUMANO (CRÍTICO)
Si detectas cualquiera de las siguientes situaciones, debes preparar la transferencia a un miembro del equipo de manera inmediata y natural:
1. El usuario pide explícitamente "hablar con una persona", "un asesor", "un humano" o "un agente".
2. El usuario presenta un problema técnico complejo o un reclamo que requiere supervisión manual.
3. La consulta sale por completo del alcance de los servicios de SomosVenia.

**Cómo actuar para la derivación:**
- Mantén la calma y la amabilidad.
- Confirma que transferirás la conversación.
- *Ejemplo de respuesta:* "¡Por supuesto! Para darte la atención detallada que necesitas, voy a pasarte con uno de nuestros especialistas del equipo humano de SomosVenia. En un momento se pondrán en contacto contigo por este medio. ¡Gracias por tu paciencia!"
- [NUNCA inventes nombres de asesores a menos que se te configuren previamente; usa "nuestro equipo" o "un especialista"].
- Cuando derives al usuario, añade el texto "[DERIVAR_HUMANO]" discretamente o al final del mensaje para que la plataforma sepa que debe pausar la IA y asignar un humano.

### 3. DIRECTRICES DE RESPUESTA Y ALCANCE
- **Brevedad y claridad:** Evita bloques de texto gigantescos. Usa viñetas o saltos de línea para que la lectura sea ágil en canales de chat (WhatsApp/Web).
- **Contexto de servicios:** Estás aquí para guiar a los interesados en:
  * Automatización de procesos y flujos de trabajo con n8n/Make.
  * Diseño y desarrollo de páginas web, landing pages y plataformas digitales estratégicas.
  * Consultoría tecnológica e implementación de IA en negocios.
- **Límites de información:** Si preguntan detalles ultra específicos de precios, cotizaciones a medida o contratos que no tienes en tu base de conocimientos, ofrece de inmediato la transferencia al equipo comercial o humano.
- **Idioma:** Responde siempre en español, adaptando sutilmente el entusiasmo al tono del cliente.
- **Multimodalidad:** Tienes capacidad para escuchar notas de voz y analizar imágenes. Si el cliente te envía una imagen o audio, agradece el material e incorpóralo en tu respuesta con total naturalidad.`;

      const contents: any[] = [];
      
      if (history && Array.isArray(history)) {
        const recentHistory = history.slice(-6);
        recentHistory.forEach((msg: any) => {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }

      const currentParts: any[] = [];
      if (imageBase64) {
        currentParts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType || 'image/jpeg' } });
      }
      if (audioBase64) {
        currentParts.push({ inlineData: { data: audioBase64, mimeType: audioMimeType || 'audio/ogg' } });
      }
      currentParts.push({ text: prompt || process.env.PROMPT_DEFAULT });

      if (contents.length > 0) {
        contents.push({
          role: 'user',
          parts: currentParts
        });
      } else {
        contents.push(...currentParts);
      }

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: contents,
        config: { systemInstruction, temperature: 0.7 }
      });

      res.json({ text: response?.text || "No pude generar una respuesta." });
    } catch (e: any) {
      console.error('Error in /api/chat/respond:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/suggest-reply', async (req, res) => {
      const { clientMessage, lastAgentMessage } = req.body;
      if (!ai) {
          return res.json({ suggestion: 'Sugerencia local: ¡Claro! ¿En qué te puedo ayudar hoy con nuestros servicios de automatización?' });
      }
      try {
          const systemInstruction = `Eres el Asistente Virtual de Atención al Cliente de SomosVenia. Tu rol aquí es actuar como un "Co-Pilot" y sugerirle a un agente humano del CRM una respuesta rápida, elegante, profesional y súper amigable para responderle al cliente.
          El cliente envió: "${clientMessage}".
          La sugerencia debe ser muy breve, directa y amigable.`;
          
          const response = await generateContentWithRetry(ai, {
              model: 'gemini-3.5-flash',
              contents: `Genera una única sugerencia corta de respuesta rápida en base a esto: ${clientMessage}`,
              config: { systemInstruction, temperature: 0.7 }
          });
          res.json({ suggestion: response?.text?.trim() || 'Sugerencia predeterminada.' });
      } catch (e: any) {
          console.error(e);
          res.json({ suggestion: 'Sugerencia de contingencia: Hola, con gusto te ayudamos con tu requerimiento.' });
      }
  });

  // Socket.io for Realtime Panel (if needed by external client)
  io.on('connection', async (socket) => {
      const db = await leerDB();
      socket.emit('init_chats', db);
  });

  // New configuration endpoints for prompt editing
  app.get('/api/config/prompt', (req, res) => {
    res.json({ prompt: process.env.PROMPT_DEFAULT || '' });
  });
  app.post('/api/config/prompt', async (req, res) => {
    const { prompt } = req.body;
    const fs = await import('fs');
    const envPath = path.join(process.cwd(), '.env');
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      const regex = /^PROMPT_DEFAULT=.*$/m;
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `PROMPT_DEFAULT=${prompt}`);
      } else {
        envContent += `\nPROMPT_DEFAULT=${prompt}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
      
      // Git commit and push changes
      const { execSync } = await import('child_process');
      try {
        // Configure temporary git identity if none exists
        try {
          execSync('git config --global user.email || git config user.email');
        } catch (e) {
          execSync('git config user.name "SomosVenia Bot"');
          execSync('git config user.email "bot@somosvenia.com"');
        }
        
        execSync('git add .env');
        const status = execSync('git status --porcelain').toString();
        if (status.includes('.env')) {
          execSync('git commit -m "Update AI prompt"');
          const githubToken = process.env.GITHUB_TOKEN;
          const remoteUrl = githubToken 
            ? `https://${githubToken}@github.com/somosvenia-gif/Somos-Venia-CHATBOT-REDES-SOCIALES.git` 
            : 'origin';
          execSync(`git push ${remoteUrl} main`);
        }
      } catch (gitErr: any) {
        console.error('Git push failed:', gitErr);
        return res.status(500).json({ error: `Prompt guardado en .env localmente, pero falló el push: ${gitErr.message}` });
      }
      
      res.json({ success: true });
    } catch (e: any) {
      console.error('Error updating prompt:', e);
      res.status(500).json({ error: `Error al guardar el prompt: ${e.message}` });
    }
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
