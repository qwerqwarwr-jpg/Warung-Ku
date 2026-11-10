import { MenuItem, StockItem } from '../types';

export const OUTLET_CONFIG = {
  id: 'outlet_demo_01',
  name: 'Warung Demo',
  businessDate: '2026-11-10',
  tz: 'Asia/Jakarta (WIB)',
  kitchenFlag: false, // flag nonaktif: tiket tampil di /kasir
  reservationTtlMinutes: 10,
  ownerPin: '8888',
};

export const INITIAL_TABLES = ['M01', 'M02', 'M03', 'M04', 'M05'];

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  { id: 'SI-01', name: 'Ayam Goreng', unit: 'porsi', type: 'portion' },
  { id: 'SI-02', name: 'Rawon', unit: 'porsi', type: 'portion' },
  { id: 'SI-03', name: 'Soto Ayam', unit: 'porsi', type: 'portion' },
  { id: 'SI-04', name: 'Nasi Pecel', unit: 'porsi', type: 'portion' },
  { id: 'SI-05', name: 'Telur Dadar', unit: 'porsi', type: 'portion' },
  { id: 'SI-06', name: 'Gado-gado', unit: 'porsi', type: 'portion' },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'MN-01',
    name: 'Nasi Ayam Goreng',
    price: 18000,
    stockItemId: 'SI-01',
    category: 'Makanan',
    description: 'Ayam goreng rempah khas Jawa Timur gurih dengan sambal terasi segar dan lalapan.',
  },
  {
    id: 'MN-02',
    name: 'Nasi Rawon',
    price: 20000,
    stockItemId: 'SI-02',
    category: 'Makanan',
    description: 'Rawon daging sapi kuah kluwek pekat gurih lengkap dengan tauge pendek dan sambal.',
  },
  {
    id: 'MN-03',
    name: 'Soto Ayam',
    price: 16000,
    stockItemId: 'SI-03',
    category: 'Makanan',
    description: 'Soto kuah kuning bening segar dengan suwiran ayam, koya gurih, dan seledri.',
  },
  {
    id: 'MN-04',
    name: 'Nasi Pecel',
    price: 12000,
    stockItemId: 'SI-04',
    category: 'Makanan',
    description: 'Sayuran rebus segar disiram bumbu pecel kacang pedas manis wangi daun jeruk.',
  },
  {
    id: 'MN-05',
    name: 'Telur Dadar',
    price: 6000,
    stockItemId: 'SI-05',
    category: 'Makanan',
    description: 'Telur dadar tebal renyah bumbu daun bawang gurih nikmat.',
  },
  {
    id: 'MN-06',
    name: 'Gado-gado',
    price: 14000,
    stockItemId: 'SI-06',
    category: 'Makanan',
    description: 'Sayuran segar, lontong, tahu, tempe dengan siraman bumbu kacang medok istimewa.',
  },
  {
    id: 'MN-07',
    name: 'Tahu Tempe Goreng',
    price: 5000,
    stockItemId: null,
    category: 'Camilan',
    description: 'Tahu dan tempe goreng renyah hangat berbumbu ketumbar bawang putih.',
  },
  {
    id: 'MN-08',
    name: 'Es Teh Manis',
    price: 4000,
    stockItemId: null,
    category: 'Minuman',
    description: 'Teh melati seduh wangi segar disajikan dingin manis alami.',
  },
  {
    id: 'MN-09',
    name: 'Es Jeruk',
    price: 6000,
    stockItemId: null,
    category: 'Minuman',
    description: 'Perasan jeruk asli manis asam segar dingin pelepas dahaga.',
  },
  {
    id: 'MN-10',
    name: 'Kopi Hitam',
    price: 5000,
    stockItemId: null,
    category: 'Minuman',
    description: 'Kopi tubruk robusta mantap dengan aroma harum khas nusantara.',
  },
];

export const MORNING_OPENING_STOCK: Record<string, number> = {
  'SI-01': 20, // Nasi Ayam Goreng
  'SI-02': 15, // Nasi Rawon
  'SI-03': 12, // Soto Ayam
  'SI-04': 15, // Nasi Pecel
  'SI-05': 10, // Telur Dadar
  'SI-06': 8,  // Gado-gado
};
