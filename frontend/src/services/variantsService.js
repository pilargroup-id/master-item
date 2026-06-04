import axios from 'axios';

const BASE = '/api/variants';

const variantsService = {
  list:               (params = {}) => axios.get(BASE, { params }),
  previewSku:         ()            => axios.get(`${BASE}/preview-sku`),
  getById:            (id)          => axios.get(`${BASE}/${id}`),
  create:             (data)        => axios.post(BASE, data),
  update:             (id, data)    => axios.put(`${BASE}/${id}`, data),
  remove:             (id)          => axios.delete(`${BASE}/${id}`),
  bulkUpdateStatus:   (ids, status) => axios.put(`${BASE}/bulk-status/update`,  { ids, status }),
  bulkUpdateChannel:  (ids, channel)=> axios.put(`${BASE}/bulk-channel/update`, { ids, channel }),
};

export default variantsService;
