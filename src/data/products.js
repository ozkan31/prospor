export const categories = [
  { slug: "erkek-ayakkabi", name: "Erkek Ayakkabı", key: "men" },
  { slug: "kadin-ayakkabi", name: "Kadın Ayakkabı", key: "women" },
  { slug: "cocuk-ayakkabi", name: "Çocuk Ayakkabı", key: "kids" },
  { slug: "spor-ayakkabi", name: "Spor Ayakkabı", key: "sport" },
  { slug: "gunluk-ayakkabi", name: "Günlük Ayakkabı", key: "casual" },
  { slug: "kosu-ayakkabisi", name: "Koşu Ayakkabısı", key: "running" },
  { slug: "indirimdekiler", name: "İndirimdekiler", key: "sale" },
  { slug: "yeni-gelenler", name: "Yeni Gelenler", key: "new" }
];

export const products = [
  {
    id: "nike-air-zoom-pegasus-41",
    name: "Nike Air Zoom Pegasus 41",
    brand: "Nike",
    price: 6799,
    oldPrice: 7999,
    rating: 4.8,
    reviews: 142,
    gender: "Erkek",
    category: ["men", "running", "sport", "new"],
    colors: ["Siyah", "Kırmızı", "Beyaz"],
    sizes: [40, 41, 42, 43, 44, 45.5],
    stock: 26,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Uzun mesafe koşular için geliştirilmiş, yüksek geri itişli ve nefes alabilen premium koşu ayakkabısı.",
    specs: ["ReactX köpük taban", "Zoom Air yastıklama", "Nefes alabilen file üst yüzey"],
    usage: "Koşu, günlük antrenman ve şehir içi tempolu kullanım",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "adidas-campus-pro",
    name: "Adidas Campus Pro Street",
    brand: "Adidas",
    price: 4999,
    oldPrice: 5799,
    rating: 4.6,
    reviews: 91,
    gender: "Kadın",
    category: ["women", "casual", "new"],
    colors: ["Beyaz", "Antrasit", "Mavi"],
    sizes: [36, 37, 38, 39, 40],
    stock: 34,
    image: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Retro çizgileri modern taban teknolojisiyle birleştiren günlük premium sneaker.",
    specs: ["Süet üst yüzey", "Kaymaz kauçuk dış taban", "Destekli bilek yapısı"],
    usage: "Günlük şehir stili ve hafif yürüyüş",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "puma-velocity-nitro-elite",
    name: "Puma Velocity Nitro Elite",
    brand: "Puma",
    price: 5999,
    oldPrice: 7299,
    rating: 4.7,
    reviews: 120,
    gender: "Erkek",
    category: ["men", "running", "sport", "sale"],
    colors: ["Elektrik Mavi", "Siyah"],
    sizes: [40, 41, 42, 43, 44, 45, 45.5],
    stock: 19,
    image: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Nitro köpük teknolojisiyle yarış seviyesinde hız ve hafiflik sunar.",
    specs: ["Nitro Elite köpük", "Hafif karbon plaka", "Yüksek enerji dönüşü"],
    usage: "Hız antrenmanları ve uzun mesafe koşu",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "new-balance-9060-v2",
    name: "New Balance 9060 V2",
    brand: "New Balance",
    price: 6299,
    oldPrice: 6999,
    rating: 4.9,
    reviews: 177,
    gender: "Kadın",
    category: ["women", "casual", "sport", "best"],
    colors: ["Gri", "Beyaz", "Siyah"],
    sizes: [36, 37, 38, 39, 40, 41],
    stock: 41,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516478177764-9fe5bd9f18ed?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Chunky tasarım estetiğiyle premium konforu birleştiren ikonik sneaker.",
    specs: ["ABZORB orta taban", "Geniş konfor kalıbı", "Yüksek dayanım dış taban"],
    usage: "Günlük premium stil ve uzun kullanım",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "nike-junior-sprint",
    name: "Nike Junior Sprint Kids",
    brand: "Nike",
    price: 2899,
    oldPrice: 3299,
    rating: 4.5,
    reviews: 65,
    gender: "Çocuk",
    category: ["kids", "sport", "new"],
    colors: ["Kırmızı", "Siyah", "Beyaz"],
    sizes: [31, 32, 33, 34, 35],
    stock: 56,
    image: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600181516490-3e6e2d8d3baf?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Çocuklar için esnek tabanlı, hafif ve destekli spor ayakkabı.",
    specs: ["Esnek taban", "Kolay giyme tasarımı", "Yumuşak iç astar"],
    usage: "Okul, oyun ve günlük kullanım",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "adidas-terrex-trail",
    name: "Adidas Terrex Trail Pro",
    brand: "Adidas",
    price: 7199,
    oldPrice: 7999,
    rating: 4.8,
    reviews: 98,
    gender: "Erkek",
    category: ["men", "sport", "best"],
    colors: ["Antrasit", "Mavi"],
    sizes: [40, 41, 42, 43, 44, 45, 45.5],
    stock: 17,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600181516102-2c7d9f49c3ad?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1477506350614-44cafe8d8c91?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Zorlu zeminlerde maksimum tutuş sağlayan profesyonel outdoor model.",
    specs: ["Traxion dış taban", "Su itici yüzey", "Güçlendirilmiş burun"],
    usage: "Doğa yürüyüşü ve spor",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "puma-evo-lite-women",
    name: "Puma Evo Lite Women",
    brand: "Puma",
    price: 4599,
    oldPrice: 5399,
    rating: 4.4,
    reviews: 75,
    gender: "Kadın",
    category: ["women", "sport", "sale"],
    colors: ["Beyaz", "Elektrik Mavi", "Gri"],
    sizes: [36, 37, 38, 39, 40],
    stock: 28,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Yumuşak taban yapısı ve hafif üst yüzey ile gün boyu konfor.",
    specs: ["SoftFoam iç taban", "Hafif file", "Esnek dış taban"],
    usage: "Günlük kullanım ve fitness",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  },
  {
    id: "nb-kids-cloud-jr",
    name: "New Balance Cloud Jr",
    brand: "New Balance",
    price: 2599,
    oldPrice: 3099,
    rating: 4.3,
    reviews: 54,
    gender: "Çocuk",
    category: ["kids", "casual", "sale"],
    colors: ["Gri", "Mavi", "Beyaz"],
    sizes: [30, 31, 32, 33, 34],
    stock: 37,
    image: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600185365523-26d7a4cc7519?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop"
    ],
    description: "Enerjik çocuklar için dayanıklı, hafif ve konforlu sneaker modeli.",
    specs: ["Darbe emici orta taban", "Kolay kapanış", "Kaymaz taban"],
    usage: "Okul ve günlük kullanım",
    shipping: "Aynı gün kargo, 1-3 iş günü teslimat",
    returns: "14 gün koşulsuz iade ve değişim"
  }
];

export const brands = ["Nike", "Adidas", "Puma", "New Balance", "Asics", "Skechers"];

export const testimonials = [
  { name: "Ayşe K.", text: "Ürünler orijinal ve teslimat çok hızlıydı.", score: 5 },
  { name: "Mehmet T.", text: "Fiyat/performans açısından en iyi spor mağazası.", score: 5 },
  { name: "Ece D.", text: "İade süreci çok kolay, müşteri hizmetleri çok ilgili.", score: 4 }
];

export const faqs = [
  {
    q: "Siparişim ne zaman kargoya verilir?",
    a: "Hafta içi saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilir."
  },
  {
    q: "Numara değişimi yapabilir miyim?",
    a: "Evet, teslimattan itibaren 14 gün içinde ücretsiz değişim talebi oluşturabilirsiniz."
  },
  {
    q: "Ürünler orijinal mi?",
    a: "Tüm ürünler resmi tedarikçilerden gelir ve %100 orijinal ürün garantisi taşır."
  }
];

export const demoOrders = [
  {
    id: "PS-2026-10042",
    date: "2026-03-02",
    total: 7298,
    status: "Kargoda",
    items: ["Nike Air Zoom Pegasus 41", "Nike Junior Sprint Kids"]
  },
  {
    id: "PS-2026-10011",
    date: "2026-02-18",
    total: 4999,
    status: "Teslim Edildi",
    items: ["Adidas Campus Pro Street"]
  }
];

export const coupons = [
  { code: "PRO10", discount: 10, desc: "%10 indirim" },
  { code: "KOSU15", discount: 15, desc: "Koşu kategorisinde %15" }
];
