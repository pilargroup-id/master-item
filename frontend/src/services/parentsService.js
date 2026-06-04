import axios from 'axios';

const BASE = '/api/parent-skus';
const MASTER_ITEMS_BASE = '/api/master-items';

const parentsService = {
  /** List dengan filter, sort, dan pagination server-side */
  list: (params = {}) => axios.get(BASE, { params }),

  /** Semua data dropdown form dalam 1 request */
  getFormOptions: () => axios.get(`${MASTER_ITEMS_BASE}/form-options`),

  /** Preview SKU berikutnya tanpa generate */
  previewSku: () => axios.get(`${MASTER_ITEMS_BASE}/preview-sku`),

  /** Deteksi sub-brand yang mirip */
  similarSubBrands: (q) => axios.get(`${BASE}/similar-sub-brands`, { params: { q } }),

  /** Detail satu parent beserta variannya */
  getById: (id) => axios.get(`${BASE}/${id}`),

  /** Buat parent baru */
  create: (data) => axios.post(BASE, data),

  /** Update parent */
  update: (id, data) => axios.put(`${BASE}/${id}`, data),

  /** Hapus parent */
  remove: (id) => axios.delete(`${BASE}/${id}`),
};

export default parentsService;
