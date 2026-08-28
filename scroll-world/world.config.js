/* Copia de la pelicula. Este es el sitio donde se edita el texto de las escenas.
   La pagina que se despliega (scroll.html) se GENERA desde aqui + es.html:

       node scroll-world/compose.js

   Cambiar palabras aqui es gratis. Anadir una escena NO: cada escena nueva es un
   clip de vuelo + un conector que hay que renderizar (~$8 a 1080p).

   OJO con el CTA: nada de tel: en esta pagina. Los seis tel: de es.html apuntan al
   951 870 630, que sigue muerto y apagado por el bloque LINEA MUERTA; copiar aqui
   ese patron resucitaria un numero que no contesta. */
module.exports = {
  brand: { name: 'Prime AI', href: '#top' },
  /* Apuntaba a '#demo', que no existe: el motor no vuelca los `id` de las escenas
     en el DOM, asi que el boton llevaba muerto desde el despliegue. Al enlace real. */
  cta: { label: { es: 'Reservar una llamada', en: 'Book a call' },
         href: 'https://cal.eu/prime.ai/intro-wa' },
  hint: { es: 'baja para entrar', en: 'scroll to step inside' },
  skipLabel: { es: 'Saltar a la web', en: 'Skip to the site' },
  diveScroll: 1.3,
  connScroll: 0.9,
  sections: [
    {
      id: 'obra', label: { es: 'La obra', en: 'The job' },
      still: 'assets/scroll/still/obra.webp',
      clip:  'assets/scroll/vid/obra.mp4',
      accent: '#C2703D',
      scroll: 1.7, linger: 0.45,
      eyebrow: { es: 'Martes, 10:40', en: 'Tuesday, 10:40' },
      title: { es: 'El teléfono suena con las manos en el sifón.',
              en: 'The phone rings with your hands under the sink.' },
      body: { es: 'No es que no quieras cogerlo. Es que no puedes.',
             en: "It's not that you don't want to answer. You can't." },
      tags: [{ es: 'Manos ocupadas', en: 'Hands full' },
             { es: 'Suena cinco veces', en: 'Rings five times' }],
    },
    {
      id: 'cocina', label: { es: 'Al otro lado', en: 'The other end' },
      still: 'assets/scroll/still/cocina.webp',
      clip:  'assets/scroll/vid/cocina.mp4',
      accent: '#C2703D',
      eyebrow: { es: 'Al otro lado', en: 'The other end' },
      title: { es: 'No deja mensaje. Llama al siguiente.',
              en: 'They leave no message. They call the next one.' },
      body: { es: 'El trabajo se lo lleva quien cogió el teléfono, no quien mejor lo hace.',
             en: 'The job goes to whoever answered, not to whoever does it best.' },
      tags: [{ es: 'Sin mensaje', en: 'No voicemail' },
             { es: 'Siguiente de la lista', en: 'Next on the list' }],
    },
    {
      id: 'centralita', label: { es: 'Lo que cambia', en: 'What changes' },
      still: 'assets/scroll/still/centralita.webp',
      clip:  'assets/scroll/vid/centralita.mp4',
      accent: '#C2703D',
      scroll: 1.5, linger: 0.4,
      eyebrow: { es: 'Lo que cambia', en: 'What changes' },
      title: { es: 'Contesta en dos tonos. A las tres de la mañana también.',
              en: 'It answers in two rings. At three in the morning too.' },
      body: { es: 'Tu número sigue siendo tu número. No tocas nada.',
             en: 'Your number stays your number. You change nothing.' },
      tags: [{ es: 'Dos tonos', en: 'Two rings' },
             { es: '24 horas', en: '24 hours' },
             { es: 'Tu mismo número', en: 'Your own number' }],
    },
    {
      id: 'agenda', label: { es: 'La cita', en: 'The booking' },
      still: 'assets/scroll/still/agenda.webp',
      clip:  'assets/scroll/vid/agenda.mp4',
      accent: '#C2703D',
      eyebrow: { es: 'Mientras sigues debajo del fregadero', en: 'While you are still under the sink' },
      title: { es: 'La cita ya está puesta.', en: 'The appointment is already booked.' },
      body: { es: 'Nombre, dirección, qué le pasa y a qué hora. Te llega escrito.',
             en: 'Name, address, what is wrong and what time. It arrives in writing.' },
      tags: [{ es: 'Hora confirmada', en: 'Time confirmed' },
             { es: 'Dirección', en: 'Address' },
             { es: 'Motivo', en: 'Reason' }],
    },
    {
      id: 'furgoneta', label: { es: 'A la mañana siguiente', en: 'Next morning' },
      still: 'assets/scroll/still/furgoneta.webp',
      clip:  'assets/scroll/vid/furgoneta.mp4',
      accent: '#C2703D',
      eyebrow: { es: 'A la mañana siguiente', en: 'Next morning' },
      title: { es: 'A las nueve estás en su portal.', en: 'At nine you are at their door.' },
      body: { es: 'El mismo trabajo que ayer se habría ido a otro.',
             en: 'The same job that yesterday would have gone to someone else.' },
      tags: [{ es: 'Nueve en punto', en: 'Nine o’clock' }],
    },
    {
      id: 'demo-film', label: { es: 'Escúchala', en: 'Hear it' },
      still: 'assets/scroll/still/demo.webp',
      clip:  'assets/scroll/vid/demo.mp4',
      accent: '#2563EB',
      scroll: 1.8, linger: 0.5,
      eyebrow: { es: 'Compruébalo', en: 'See for yourself' },
      title: { es: 'Escúchala contestar.', en: 'Hear it answer.' },
      body: { es: 'Sigue bajando: debajo está todo — la calculadora, la demo en directo y el precio.',
             en: 'Keep scrolling: it is all below — the calculator, the live demo and the price.' },
      tags: [],
      cta: { primary: { label: { es: 'Reservar una llamada conmigo', en: 'Book a call with me' },
                        href: 'https://cal.eu/prime.ai/intro-wa' } },
    },
  ],
  connectors: [
    'assets/scroll/vid/conn_0.mp4',
    'assets/scroll/vid/conn_1.mp4',
    'assets/scroll/vid/conn_2.mp4',
    'assets/scroll/vid/conn_3.mp4',
    'assets/scroll/vid/conn_4.mp4',
  ],
};
