export type Producto = {
  id: string;
  slug: string;
  nombre: string;
  descripcionCorta: string;
  descripcion: string;
  categoria: 'Bizcocho' | 'Hojarasca' | 'Porciones'  | 'Kuchenes' | 'Cheese Cake' | 'Galletas' | 'Pan Tradicional o Especial' | 'Empanadas' | 'Facturas' | 'Pre Pizzas' | 'Pie y Tartas'| 'Alfajores';
  precio: number;              // precio base si no hay tamaños
  rindePersonas?: number;
  diametroCm?: number;
  imagen: string;
  disponible: boolean;
  tamanos?: Array<{ id: string; nombre: string; precio: number }>;
  addons?: Array<{ id: string; nombre: string; precio: number }>;
};

export const productos: Producto[] = [
  {
    id: 't1',
    slug: 'torta-alpina',
    nombre: 'Torta Alpina',
    descripcionCorta: 'Bizcocho de chocolate con dulce de leche y crema diplomatica.',
    descripcion: 'Bizcocho de chocolate con aros de dulce de leche relleno de crema diplomática (Crema de leche, pastelera y chantilly). Cubierta sutil de ganache de chocolate y crema chantilly.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaAlpina2.webp',
    disponible: true,
    tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 14–16p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 20–20p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
  {
    id: 't2',
    slug: 'torta-chocolate',
    nombre: 'Torta de Chocolate',
    descripcionCorta: 'Bizcocho de Brownie con mousse de chocolate y crema.',
    descripcion: 'Bizcocho tipo brownie relleno de suave mousse de chocolate, Bañada con ganache de chocolate, decorada con crema chantilly y maní crocante de chocolate.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaChocolate2.webp',
    disponible: true,
    tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20-25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
 {
    id: 't3',
    slug: 'torta-dulceLeche',
    nombre: 'Torta Dulce de Leche',
    descripcionCorta: 'Bizcocho de vainilla con dulce de leche y crema',
    descripcion: 'Bizcocho esponjoso de vainilla con dulce de leche y una crema especial de dulce de leche, decorada con crema chantilly y una sutil cubierta de dulce de leche.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaDulceLeche2.webp',
    disponible: true,
    tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't4',
    slug: 'torta-frambuesa',
    nombre: 'Torta Frambuesa',
    descripcionCorta: 'Clásica con relleno de frambuesas y mermelada.',
    descripcion: 'Bizcocho de vainilla esponjoso con suave crema chantilly, Rellena de mermelada de frambuesa, con frambuesas naturales.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaFrambuesa2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't5',
    slug: 'torta-durazno',
    nombre: 'Torta Frutal Durazno',
    descripcionCorta: 'Bizcocho de vainilla con dulce de leche, durazno y crema.',
    descripcion: 'Bizcocho de vainilla con dulce de leche, crema chantilly y delicados trozos de durazno, decorado con cobertura de crema chantilly y una capa de trozos de durazno.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaDurazno3.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't6',
    slug: 'torta-mani',
    nombre: 'Torta Maní',
    descripcionCorta: 'Bizcocho de brownie cubierta de ganache.',
    descripcion: 'Bizcocho de chocolate tipo brownie, relleno con suave crema de maní, cubierta de ganache de chocolate y trozos de maní crocante',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaMani2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't7',
    slug: 'torta-manjar-nuez',
    nombre: 'Torta Manjar Nuez',
    descripcionCorta: 'Clásica con manjar casero y nueces.',
    descripcion: 'Bizcocho de vainilla relleno con dulce de leche y nueces, cubierta con una delicada capa de dulce de leche, decorada con nueces y crema chantilly.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaManjarNuez2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't8',
    slug: 'torta-maracuya',
    nombre: 'Torta Maracuyá',
    descripcionCorta: 'Bizcocho de vainilla con maracuyá natural.',
    descripcion: 'Bizcocho de vainilla con maracuyá natural, crema mixta con crema de maracuyá, manjar y mermelada de frambuesa.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaMaracuya2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't9',
    slug: 'torta-menta',
    nombre: 'Torta de Menta',
    descripcionCorta: 'Clásica con bizcocho de chocolate y mousse de menta.',
    descripcion: 'Bizcocho de chocolate aireado con ganache de chocolate, mousse de menta, licor de menta y crema chantilly, decorada con crema de menta y ganache de chocolate.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaMenta2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't10',
    slug: 'torta-moka',
    nombre: 'Torta Moka',
    descripcionCorta: 'Bizcocho de vainilla relleno de crema moka.',
    descripcion: 'Bizcocho de vainilla esponjoso con relleno de crema moka: (Chantilly, manjar y café). Bañada con ganache de chocolate.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaMoka2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't11',
    slug: 'torta-red-velvet',
    nombre: 'Torta Red Velvet',
    descripcionCorta: 'Bizcocho de vainilla con color rojo y frosting clásico.',
    descripcion: 'Delicado bizcocho de vainilla con sofisticado color rojo, suave relleno de crema frosting (Azúcar flor, queso Philadelfia, Mantequilla y un toque de ralladura de limón y naranja). Cubierta con pulpa de frutilla.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaRedVelvet2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't12',
    slug: 'torta-rose',
    nombre: 'Torta Rosé',
    descripcionCorta: 'Bizcocho de vainilla con mousse de frambuesa.',
    descripcion: 'Bizcocho aireado de vainilla relleno con mousse de frambuesa, aros de dulce de leche y mousse de chocolate, cubierta de ganache de chocolate.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaRose3.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't13',
    slug: 'torta-selva-negra',
    nombre: 'Torta Selva Negra',
    descripcionCorta: 'Clásica con mermelada casera y ganache de chocolate.',
    descripcion: 'Bizcocho de chocolate relleno de mermelada de frambuesa, frambuesa natural, bañada con delicado ganache de chocolate.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaSelvaNegra3.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't14',
    slug: 'torta-tresLeches',
    nombre: 'Torta Tres Leches',
    descripcionCorta: 'Clásica con aros de dulce de leche y crema diplomatica.',
    descripcion: 'Bizcocho de vainilla esponjoso y aros de dulce de leche, crema diplomática, cubierta con merengue italiano, decorado con un sutil flambeado.',
    categoria: 'Bizcocho',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaTresLeches2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 18500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 27500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 32500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't15',
    slug: 'torta-Trufa',
    nombre: 'Torta Trufa',
    descripcionCorta: 'Bizcocho de chocolate relleno con crema trufa.',
    descripcion: 'Bizcocho de chocolate aireado relleno con intensa crema de trufa, cubierta de ganache de chocolate, decorado con dulce de leche.',
    categoria: 'Bizcocho',
    precio: 20500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/bizcocho/tortaTrufa2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 20500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 29500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 34500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't16',
    slug: 'torta-Amor',
    nombre: 'Torta Amor',
    descripcionCorta: 'Discos de hojarasca con dulce de leche y crema diplomitica.',
    descripcion: 'Discos de hojarasca con aros de dulce de leche, crema diplomática (Crema de leche, pastelera y chantilly). Frambuesa natural y mermelada de frambuesa.',
    categoria: 'Hojarasca',
    precio: 20500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/hojarasca/tortaAmor2.png',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 20500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 29500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 34500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't17',
    slug: 'torta-Celestial',
    nombre: 'Torta Celestial',
    descripcionCorta: 'Discos de hojaldre crocante con bizcocho, merengue, dulce de leche y chantily.',
    descripcion: 'Disco de hojaldre crocante con bizcocho de vainilla y delicados discos de merengue, relleno de frambuesas, dulce de leche y crema chantilly.',
    categoria: 'Hojarasca',
    precio: 20500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/hojarasca/tortaCelestial2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 20500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 29500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 34500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 't18',
    slug: 'torta-MilHojas',
    nombre: 'Torta Mil Hojas',
    descripcionCorta: 'Discos de hojaldre relleno con dulce de leche.',
    descripcion: 'Discos de hojaldre crujientes rellenos con dulce de leche, decorado con delicado ganache de chocolate, hojuelos de hojaldre y exquisito dulce de leche.',
    categoria: 'Hojarasca',
    precio: 18500,
    rindePersonas: 15,
    diametroCm: 20,
    imagen: 'tortas/hojarasca/tortaMilHojas2.webp',
    disponible: true,
     tamanos: [
      { id: 'ch', nombre: 'Chico (Ø 20 cm / 10-15p)', precio: 20500 },
      { id: 'md', nombre: 'Mediano (Ø 22 cm / 20–25p)', precio: 29500 },
      { id: 'gr', nombre: 'Grande (Ø 24 cm / 25-30p)', precio: 34500 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
  {
    id: 'k1',
    slug: 'kuchen-nuez',
    nombre: 'Kuchen de Nuez',
    descripcionCorta: 'Clásico del sur con nueces seleccionadas y leche condensada.',
    descripcion: 'Masa murbe suave y crujiente, rellena con una generosa mezcla de nueces, caramelo y leche condensada. Una tradición sureña imperdible.',
    categoria: 'Kuchenes', 
    precio: 16500,
    rindePersonas: 10,
    diametroCm: 22,
    imagen: 'latienda/kuchenes/foto (46).webp', 
    disponible: true,
    tamanos: [
        { id: 'entero', nombre: 'Entero (Ø 22 cm)', precio: 12000 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
  {
    id: 'k2',
    slug: 'kuchen-manzana',
    nombre: 'Kuchen de Manazana',
    descripcionCorta: 'Clásico del sur con nueces seleccionadas y leche condensada.',
    descripcion: 'Masa murbe suave y crujiente, rellena con una generosa mezcla de nueces, caramelo y leche condensada. Una tradición sureña imperdible.',
    categoria: 'Kuchenes', 
    precio: 16500,
    rindePersonas: 10,
    diametroCm: 22,
    imagen: 'latienda/kuchenes/foto (39).webp', 
    disponible: true,
    tamanos: [
        { id: 'entero', nombre: 'Entero (Ø 22 cm)', precio: 14000 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
  {
    id: 'k3',
    slug: 'kuchen-sureño',
    nombre: 'Kuchen de Mix de berries y fruto secos',
    descripcionCorta: 'Clásico del sur con nueces seleccionadas y Mix de Berries.',
    descripcion: 'Masa murbe suave y crujiente, rellena con una generosa mezcla de nueces, mermelada de frambueza y arandanos frescos. Una tradición sureña imperdible.',
    categoria: 'Kuchenes', 
    precio: 16500,
    rindePersonas: 10,
    diametroCm: 22,
    imagen: 'latienda/kuchenes/foto (36).webp', 
    disponible: true,
    tamanos: [
        { id: 'entero', nombre: 'Entero (Ø 22 cm)', precio: 12000 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
  {
    id: 'k4',
    slug: 'kuchen-miga',
    nombre: 'Kuchen de Miga',
    descripcionCorta: 'Clásico del sur con .',
    descripcion: 'Masa murbe suave y crujiente, rellena con una generosa mezcla de nueces, mermelada de frambueza y arandanos frescos. Una tradición sureña imperdible.',
    categoria: 'Kuchenes', 
    precio: 12000,
    rindePersonas: 10,
    diametroCm: 22,
    imagen: 'latienda/kuchenes/IMG_0101.webp', 
    disponible: true,
    tamanos: [
        { id: 'entero', nombre: 'Entero (Ø 22 cm)', precio: 12000 }
    ],
    addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
 // --- NUEVA SECCIÓN: Facturas ---
 
  {
    id: 'e1',
    slug: 'empanada-napolitana',
    nombre: 'Empanada Napolitana',
    descripcionCorta: 'Queso derretido, jamón, tomate y orégano.',
    descripcion: 'Nuestra masa casera rellena con abundante queso, jamón pierna, tomate fresco picado y un toque de orégano. Horneada a la perfección.',
    categoria: 'Empanadas', 
    precio: 2500, 
    rindePersonas: 1,
    imagen: 'latienda/emp/IMG_0089.webp', 
    disponible: true,
    
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2500 }
    ]
  },
  {
    id: 'e2',
    slug: 'empanada-queso',
    nombre: 'Empanada de Queso, Champiñon Choclo',
    descripcionCorta: 'Masa crujiente y mucho queso mantecoso, champiñon y choclo.',
    descripcion: 'La favorita de siempre. Masa dorada y crujiente rellena con una generosa porción de queso mantecoso que se estira al morder con champiñones frescos y choclo.',
    categoria: 'Empanadas',
    precio: 2500,
    rindePersonas: 1,
    imagen: 'latienda/emp/IMG_0087.webp', // Imagen del banner de queso
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2500 }
    ]
  },
  {
    id: 'e4',
    slug: 'empanada-pino',
    nombre: 'Empanada de Carne picada',
    descripcionCorta: 'Carne picada, cebolla, huevo y aceituna.',
    descripcion: 'El sabor tradicional chileno. Pino jugoso de carne picada, cebolla suave, huevo duro, pasas y aceituna en nuestra masa horneada.',
    categoria: 'Empanadas',
    precio: 2500,
    rindePersonas: 1,
    imagen: 'latienda/emp/IMG_0088.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2500 }
    ]
  },
   {
    id: 'f1',
    slug: 'factura1',
    nombre: 'Factura trenza',
    descripcionCorta: 'Factura con pastelera y mermelada.',
    descripcion: 'El sabor tradicional Argentino. Nuestra masa de manteca horneada acompañada de crema pastelera y un toque de mermelada.',
    categoria: 'Facturas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/facturas/factura24.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 900 }
    ]
  },
   {
    id: 'f2',
    slug: 'factura2',
    nombre: 'Factura palmera',
    descripcionCorta: 'Tradicional palmera chilena en una version porteña.',
    descripcion: 'El sabor tradicional chileno. En nuestra masa horneada.',
    categoria: 'Facturas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/facturas/IMG_0095.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 900 }
    ]
  },
   {
    id: 'f3',
    slug: 'factura3',
    nombre: 'Factura torcida',
    descripcionCorta: 'Tradicional masa porteña con crema pastelera.',
    descripcion: 'El sabor tradicional porteño. Crema pastelera y nuestra masa horneada.',
    categoria: 'Facturas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/facturas/IMG_0110.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 900 }
    ]
  },
   {
    id: 'f4',
    slug: 'factura4',
    nombre: 'Factura de berlín',
    descripcionCorta: 'Como una berlin pero de masa de factura.',
    descripcion: 'El sabor tradicional de un berlín. crema pastelera o dulce de lecje y nuestra masa horneada.',
    categoria: 'Facturas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/facturas/IMG_0111.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 900 }
    ]
  },
   {
    id: 'f5',
    slug: 'factura5',
    nombre: 'Factura Dona',
    descripcionCorta: 'Crujiente masa porteña con crema pastelera y un toque de mermelada.',
    descripcion: 'El sabor tradicional porteño. crema pastelera en nuestra masa horneada.',
    categoria: 'Facturas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/facturas/IMG_0112.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 900 }
    ]
  },
   {
    id: 'f6',
    slug: 'factura6',
    nombre: 'Factura Buñuelo',
    descripcionCorta: 'La favorita; delicado rol de masa porteña rellena de crema pastelera.',
    descripcion: 'El sabor tradicional francés. pero en nuestra masa horneada rellena de crema pastelera.',
    categoria: 'Facturas',
    precio: 1200,
    rindePersonas: 1,
    imagen: 'latienda/facturas/IMG_0110.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 1200 }
    ]
  },
   {
    id: 'f7',
    slug: 'factura7',
    nombre: 'Factura Media Luna',
    descripcionCorta: 'La clasica factura porteña.',
    descripcion: 'El sabor tradicional porteño. una medialuna en nuestra masa horneada.',
    categoria: 'Facturas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/facturas/IMG_0128.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 900 }
    ]
  },
   {
    id: 'p1',
    slug: 'porcion1',
    nombre: 'Porcion de Cheese Cake de Frutos Rojos ',
    descripcionCorta: 'Trozo de Cheese Cake de Frutos rojos.',
    descripcion: 'Delicado Cheese cake tradicional acompañado de frutos rojos de la zona.',
    categoria: 'Porciones',
    precio: 3500,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0103.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 3500 }
    ]
  },
   {
    id: 'p2',
    slug: 'porcion2',
    nombre: 'Porcion de Kuchen de Frambuesa ',
    descripcionCorta: 'Un clasico kuchen de frambuesa',
    descripcion: 'El sabor tradicional de un kuchen en su version frambuesa',
    categoria: 'Porciones',
    precio: 1500,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0104.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 1500 }
    ]
  },
   {
    id: 'p3',
    slug: 'porcion3',
    nombre: 'Porcion de Torta de Yoghurt ',
    descripcionCorta: 'Delicada torta de Yoghurt.',
    descripcion: 'Una torta fresca de yoghurt de frambuesa.',
    categoria: 'Porciones',
    precio: 2000,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0105.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2000 }
    ]
  },
   {
    id: 'p4',
    slug: 'porcion4',
    nombre: 'Porcion de Kuchen de durazno ',
    descripcionCorta: 'Clasico Kuchen de Durazno.',
    descripcion: 'El sabor tradicional del kuchen en su version Durazno.',
    categoria: 'Porciones',
    precio: 1500,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0106.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 1500 }
    ]
  },
   {
    id: 'p5',
    slug: 'porcion5',
    nombre: 'Porcion de 3 Trufas ',
    descripcionCorta: 'Las clasicas Trufas.',
    descripcion: 'El sabor tradicional de una trufa de chocolate con un toque de licor.',
    categoria: 'Porciones',
    precio: 2000,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0107.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2000 }
    ]
  },
   {
    id: 'p6',
    slug: 'porcion6',
    nombre: 'Porcion de Kuchen de Nuez ',
    descripcionCorta: 'Kuchen de nuez y crema.',
    descripcion: 'El sabor tradicional del kuchen en su version nuez y crema.',
    categoria: 'Porciones',
    precio: 1500,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0108.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 1500 }
    ]
  },
   {
    id: 'p7',
    slug: 'porcion7',
    nombre: 'Porcion de Galletas de Navidad 1/4   ',
    descripcionCorta: 'Mix de Galletas.',
    descripcion: 'Nuestra masa horneada de galletas, una delicia!.',
    categoria: 'Porciones',
    precio: 4000,
    rindePersonas: 1,
    imagen: 'latienda/porciones/IMG_0092.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 4000 }
    ]
  }, 
   {
    id: 'pr1',
    slug: 'pre1',
    nombre: 'Pre Pizza ',
    descripcionCorta: 'Masa de Pizza tradicional.',
    descripcion: 'Masa de Pizza tradicional porteña.',
    categoria: 'Pre Pizzas',
    precio: 2500,
    rindePersonas: 1,
    imagen: 'latienda/prePizzas/prePizza.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2500 }
    ]
  },
   {
    id: 'pr2',
    slug: 'pre2',
    nombre: 'Pre Pizza tradicional Cebolla ',
    descripcionCorta: 'Masa de pizza con cebolla.',
    descripcion: 'Masa de pizza tradicional y cebolla.',
    categoria: 'Pre Pizzas',
    precio: 2500,
    rindePersonas: 1,
    imagen: 'latienda/prePizzas/prePizzaCebolla.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 2500 }
    ]
  },
   {
    id: 'tar1',
    slug: 'tarta1',
    nombre: 'Tarta de Frutillas ',
    descripcionCorta: 'Tarta fresca de fruta Frutilla',
    descripcion: 'Tarta de crema pastelera y Frutillas frescas',
    categoria: 'Pie y Tartas',
    precio: 900,
    rindePersonas: 1,
    imagen: 'latienda/tartas/tartaFrutilla.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 15000 }
    ]
  },
   {
    id: 'tar2',
    slug: 'tarta2',
    nombre: 'Tarta de Lima ',
    descripcionCorta: 'Tarta de Lima.',
    descripcion: 'Tradicional Pie de crema de Limón natural.',
    categoria: 'Pie y Tartas',
    precio: 15000,
    rindePersonas: 1,
    imagen: 'latienda/tartas/IMG_0099.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 15000 }
    ]
  },
   {
    id: 'tar3',
    slug: 'tarta3',
    nombre: 'Tarta Frola ',
    descripcionCorta: 'Tarta de dulce de membrillo con coco  .',
    descripcion: 'Tarta de dulce de membrillo con coco rallado.',
    categoria: 'Pie y Tartas',
    precio: 10000,
    rindePersonas: 1,
    imagen: 'latienda/tartas/IMG_0100.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'uni', nombre: 'Unidad', precio: 10000 }
    ]
  },
  {
    id: 'pn6',
    slug: 'pan6',
    nombre: 'Pan Marraqueta ',
    descripcionCorta: 'Pan Tradicional.',
    descripcion: 'Marraqueta fresca. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 2400,
    rindePersonas: 4,
    imagen: 'latienda/pan/IMG_0086.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1200 },
        { id: '1kg', nombre: '1 Kilo', precio: 2400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 4800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 9600 }
    ],
  },
   {
    id: 'pn3',
    slug: 'pan3',
    nombre: 'Pan Hallulla ',
    descripcionCorta: 'Pan Tradicional.',
    descripcion: 'Hallulla fresca. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 2400,
    rindePersonas: 4,
    imagen: 'latienda/pan/IMG_0085.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1200 },
        { id: '1kg', nombre: '1 Kilo', precio: 2400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 4800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 9600 }
    ],
  },
   {
    id: 'pn2',
    slug: 'pan2',
    nombre: 'Pan Dobladita ',
    descripcionCorta: 'Pan Especial.',
    descripcion: 'Dobladita fresca. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 3400,
    rindePersonas: 4,
    imagen: 'latienda/pan/especial/IMG_0084.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1700 },
        { id: '1kg', nombre: '1 Kilo', precio: 3400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 6800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 13600 }
    ],
  },
  {
    id: 'pn4',
    slug: 'pan4',
    nombre: 'Pan Toscano ',
    descripcionCorta: 'Pan Especial.',
    descripcion: 'Toscano fresco; Pan con aceitunas. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 3400,
    rindePersonas: 4,
    imagen: 'latienda/pan/especial/IMG_0080.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1700 },
        { id: '1kg', nombre: '1 Kilo', precio: 3400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 6800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 13600 }
    ],
  },
  {
    id: 'pn5',
    slug: 'pan5',
    nombre: 'Pan Colisa ',
    descripcionCorta: 'Pan Especial.',
    descripcion: 'Pan Colisa. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 3400,
    rindePersonas: 4,
    imagen: 'latienda/pan/especial/IMG_0079.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1700 },
        { id: '1kg', nombre: '1 Kilo', precio: 3400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 6800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 13600 }
    ],
  },
  {
    id: 'pn1',
    slug: 'pan1',
    nombre: 'Pan Integral ',
    descripcionCorta: 'Pan Especial.',
    descripcion: 'Tortilla fresca integral. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 3400,
    rindePersonas: 4,
    imagen: 'latienda/pan/especial/IMG_0078.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1700 },
        { id: '1kg', nombre: '1 Kilo', precio: 3400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 6800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 13600 }
    ],
  },
  {
    id: 'pn7',
    slug: 'pan7',
    nombre: 'Pan Ciabatta ',
    descripcionCorta: 'Pan Especial.',
    descripcion: 'Pan Ciabatta o pan italiano. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 3400,
    rindePersonas: 4,
    imagen: 'latienda/pan/especial/IMG_0082.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1700 },
        { id: '1kg', nombre: '1 Kilo', precio: 3400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 6800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 13600 }
    ],
  },
  {
    id: 'pn8',
    slug: 'pan8',
    nombre: 'Pan Bocado de dama ',
    descripcionCorta: 'Pan Especial.',
    descripcion: 'Pan Bocado de dama. Precios por Kilo (aprox)',
    categoria: 'Pan Tradicional o Especial',
    precio: 3400,
    rindePersonas: 4,
    imagen: 'latienda/pan/especial/IMG_0083.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: '500g', nombre: '1/2 Kilo', precio: 1700 },
        { id: '1kg', nombre: '1 Kilo', precio: 3400 },
        { id: '2kg', nombre: 'Bolsa 2 Kilos', precio: 6800 },
        { id: '4kg', nombre: 'Bolsa 4 Kilos', precio: 13600 }
    ],
  },
  {
    id: 'a1',
    slug: 'alf1',
    nombre: 'Alfajores Porteños',
    descripcionCorta: 'Clasicos Alfajores porteños bañados de chocolate negro o blanco.',
    descripcion: 'Clasicos Alfajores porteños bañados de chocolate negro o blanco',
    categoria: 'Alfajores',
    precio: 1500,
    rindePersonas: 1,
    imagen: 'latienda/alfajores/alfajores.webp', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'und', nombre: 'Pequeños', precio: 500 },
        { id: 'und', nombre: 'Grandes', precio: 1500 }
      
    ],
  },
  {
    id: 'ch1',
    slug: 'che1',
    nombre: 'Cheese Cake de Frutos rojos',
    descripcionCorta: 'Cheese Cake de Frutos rojos.',
    descripcion: 'Clasico Cheese Cake porteño acompañado de frutos rojos frescos',
    categoria: 'Cheese Cake',
    precio: 24000,
    rindePersonas: 10,
    imagen: 'latienda/cheese/chesseFrutos.jpg', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'und', nombre: 'Pequeño (Ø 20 cm / 10-15p)', precio: 24000 },
              
    ],
     addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  },
   {
    id: 'ch2',
    slug: 'che2',
    nombre: 'Cheese Cake Tradicional',
    descripcionCorta: 'Cheese Cake.',
    descripcion: 'Clasico Cheese Cake porteño',
    categoria: 'Cheese Cake',
    precio: 24000,
    rindePersonas: 10,
    imagen: 'latienda/cheese/chesseTradicional.png', // Imagen del banner de pino
    disponible: true,
    tamanos: [
        { id: 'und', nombre: 'Pequeño (Ø 20 cm / 10-15p)', precio: 24000 },
              
    ],
     addons: [
      { id: 'card', nombre: 'Tarjeta de saludo', precio: 1500 },
      { id: 'velas', nombre: 'Velas', precio: 1000 }
    ]
  }

];


