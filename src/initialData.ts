import { Customer, FlowNode } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
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
      {
        id: '1',
        sender: 'bot',
        text: "Hello Sarah! I'm the OmniCRM assistant. How can I help you today regarding our business plans?",
        timestamp: '10:45 AM'
      },
      {
        id: '2',
        sender: 'user',
        text: 'Hi! I saw your recent post about the Scale-Up tier. Does it include automated WhatsApp sequences for leads?',
        timestamp: '10:46 AM'
      },
      {
        id: '3',
        sender: 'agent',
        text: 'Hi Sarah, Marcus here from the success team. Yes, the Scale-Up tier includes full WhatsApp automation! Would you like a quick demo of how the builder works?',
        timestamp: '11:02 AM'
      }
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
      {
        id: 'x1',
        sender: 'user',
        text: 'Hey! Are you guys available for integrations?',
        timestamp: '9:15 AM'
      },
      {
        id: 'x2',
        sender: 'agent',
        text: 'Hello Alex! Absolutely, we offer native integrations with multiple CRMs and social tools.',
        timestamp: '9:30 AM'
      },
      {
        id: 'x3',
        sender: 'user',
        text: 'Did you see the story I tagged you in?',
        timestamp: '15m ago'
      }
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
      {
        id: 'e1',
        sender: 'user',
        text: 'Hello, I have a doubt regarding my monthly transaction.',
        timestamp: '11:00 AM'
      },
      {
        id: 'e2',
        sender: 'bot',
        text: 'Hello Emily. I can help route your request. Let me check the billing records.',
        timestamp: '11:01 AM'
      },
      {
        id: 'e3',
        sender: 'agent',
        text: 'Resolved! I have reverted a small pending balance card surcharge.',
        timestamp: '11:15 AM'
      },
      {
        id: 'e4',
        sender: 'user',
        text: 'Thanks for the quick response earlier!',
        timestamp: '1h ago'
      }
    ]
  },
  {
    id: 'whatsapp_elena',
    name: 'Elena Miller',
    handle: 'elena_m',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLl3TMRsp9fCQk1W-zufJUO1MmSHpgiAEzVAfMqq4eRv0WD4qUth3pjP_HaM16pjoFbiC1Xt_xiq6yNXxom-14U1WDyJ3oFGLEumOq1ox1sGS8N6PzUR74SnOKLVKt1xybdP8eWEAPTgAwFBoygimq8UHDAJ5SFipmg0YX9VBCAspBV6D9lzFwyA9JHxbjL9D7urCxCJ7VvuG93FX2qL07cU3cyfI5zevAi8kFv3KBj67q9DCWhv9RWuCfJDmDfq-UdVh7nFauL3s',
    platform: 'whatsapp',
    status: 'online',
    lastSeen: 'Online',
    lastMessage: 'Excellent, I will apply that coupon.',
    lastInteractionTime: 'Yesterday',
    email: 'elena_m@gmail.com',
    phone: '+34 612 112 233',
    location: 'Madrid, Spain',
    company: 'Marketing Directo',
    tags: ['Promo Active'],
    notes: 'Interesada en la promoción de primavera de automatizaciones.',
    aiActive: false,
    messages: [
      {
        id: 'el1',
        sender: 'user',
        text: 'Hola, ¿sigue activo el código promo de WhatsApp?',
        timestamp: 'Yesterday'
      },
      {
        id: 'el2',
        sender: 'agent',
        text: '¡Hola Elena! Sí, está activo con un 20% de descuento.',
        timestamp: 'Yesterday'
      },
      {
        id: 'el3',
        sender: 'user',
        text: 'Excellent, I will apply that coupon.',
        timestamp: 'Yesterday'
      }
    ]
  }
];

export const INITIAL_NODES: FlowNode[] = [
  {
    id: 'node-trigger',
    type: 'trigger',
    icon: 'bolt',
    title: 'Keyword: "Start"',
    description: 'When user sends "Start" or "Hello" on WhatsApp.',
    x: 100,
    y: 200
  },
  {
    id: 'node-action1',
    type: 'action',
    icon: 'chat_bubble',
    title: 'Welcome Msg',
    description: '"Hi there! Welcome to our automated support."',
    x: 600,
    y: 50
  },
  {
    id: 'node-action2',
    type: 'action',
    icon: 'list',
    title: 'Quick Reply',
    description: 'Show buttons: [Support], [Sales], [Pricing]',
    x: 600,
    y: 350
  },
  {
    id: 'node-logic3',
    type: 'logic',
    icon: 'support_agent',
    title: 'Transfer to Agent',
    description: 'Route conversation to the "Sales" department queue.',
    x: 1050,
    y: 350
  }
];

export const STITCH_QUOTES = [
  "¡Ohana significa familia, y familia nunca se abandona ni se olvida!",
  "¡Meega nala k queens! (O sea, ¡Hola hola!)",
  "¡Ih! Stitch listo para hacer ruidos y automatizar chats.",
  "¡Stitch estar en el espacio cibernético ayudando a tu Ohana!",
  "¡Pudge controla el clima! Y Stitch controla tus WhatsApps.",
  "¡Taka aki! Stitch tener 4 brazos para chatear más rápido."
];
