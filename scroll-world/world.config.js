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
  cta: { label: 'Reservar una llamada', href: 'https://cal.eu/prime.ai/intro-wa' },
  hint: 'baja para entrar',
  diveScroll: 1.3,
  connScroll: 0.9,
  sections: [
    {
      id: 'obra', label: 'La obra',
      still: 'assets/scroll/still/obra.webp',
      clip:  'assets/scroll/vid/obra.mp4',
      accent: '#C2703D',
      scroll: 1.7, linger: 0.45,
      eyebrow: 'Martes, 10:40',
      title: 'El teléfono suena con las manos en el sifón.',
      body: 'No es que no quieras cogerlo. Es que no puedes.',
      tags: ['Manos ocupadas', 'Suena cinco veces'],
    },
    {
      id: 'cocina', label: 'Al otro lado',
      still: 'assets/scroll/still/cocina.webp',
      clip:  'assets/scroll/vid/cocina.mp4',
      accent: '#C2703D',
      eyebrow: 'Al otro lado',
      title: 'No deja mensaje. Llama al siguiente.',
      body: 'El trabajo se lo lleva quien cogió el teléfono, no quien mejor lo hace.',
      tags: ['Sin mensaje', 'Siguiente de la lista'],
    },
    {
      id: 'centralita', label: 'Lo que cambia',
      still: 'assets/scroll/still/centralita.webp',
      clip:  'assets/scroll/vid/centralita.mp4',
      accent: '#C2703D',
      scroll: 1.5, linger: 0.4,
      eyebrow: 'Lo que cambia',
      title: 'Contesta en dos tonos. A las tres de la mañana también.',
      body: 'Tu número sigue siendo tu número. No tocas nada.',
      tags: ['Dos tonos', '24 horas', 'Tu mismo número'],
    },
    {
      id: 'agenda', label: 'La cita',
      still: 'assets/scroll/still/agenda.webp',
      clip:  'assets/scroll/vid/agenda.mp4',
      accent: '#C2703D',
      eyebrow: 'Mientras sigues debajo del fregadero',
      title: 'La cita ya está puesta.',
      body: 'Nombre, dirección, qué le pasa y a qué hora. Te llega escrito.',
      tags: ['Hora confirmada', 'Dirección', 'Motivo'],
    },
    {
      id: 'furgoneta', label: 'A la mañana siguiente',
      still: 'assets/scroll/still/furgoneta.webp',
      clip:  'assets/scroll/vid/furgoneta.mp4',
      accent: '#C2703D',
      eyebrow: 'A la mañana siguiente',
      title: 'A las nueve estás en su portal.',
      body: 'El mismo trabajo que ayer se habría ido a otro.',
      tags: ['Nueve en punto'],
    },
    {
      id: 'demo-film', label: 'Escúchala',
      still: 'assets/scroll/still/demo.webp',
      clip:  'assets/scroll/vid/demo.mp4',
      accent: '#2563EB',
      scroll: 1.8, linger: 0.5,
      eyebrow: 'Compruébalo',
      title: 'Escúchala contestar.',
      body: 'Sigue bajando: debajo está todo — la calculadora, la demo en directo y el precio.',
      tags: [],
      cta: { primary: { label: 'Reservar una llamada conmigo',
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
