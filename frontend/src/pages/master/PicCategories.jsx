import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MasterPage, { MasterModal, MField, MInput, SearchableSelect } from './MasterPage';

function PicCategoryModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    detail_category: '', sub_category: '', main_category: '',
    brand_category: '', pic_name: '', pic_change_name: '',
  });
  const [saving,   setSaving]   = useState(false);
  const [picsList, setPicsList] = useState([]);
  const isEdit = !!item;

  useEffect(() => {
    axios.get('/api/master/pics', { params: { limit: 999 } }).then(r => { if (r.data.success) setPicsList(r.data.data); }).catch(() => {});
    setForm({
      detail_category:  item?.detail_category  || '',
      sub_category:     item?.sub_category     || '',
      main_category:    item?.main_category    || '',
      brand_category:   item?.brand_category   || '',
      pic_name:         item?.pic_name         || '',
      pic_change_name:  item?.pic_change_name  || '',
    });
  }, [item]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit
        ? await axios.put(`/api/master/pic-categories/${item.id}`, form)
        : await axios.post('/api/master/pic-categories', form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred.');
    } finally { setSaving(false); }
  };

  return (
    <MasterModal open title="PIC Category" isEdit={isEdit} onClose={onClose} onSubmit={handleSubmit} saving={saving} width={580}>
      <MField label="Detail Category" required>
        <MInput required value={form.detail_category} placeholder="e.g. KITCHEN APPLIANCE & ACCESSORIES"
          onChange={set('detail_category')} />
      </MField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <MField label="Sub Category">
          <MInput value={form.sub_category} placeholder="e.g. ELECTRONIC" onChange={set('sub_category')} />
        </MField>
        <MField label="Main Category">
          <MInput value={form.main_category} placeholder="e.g. HOME LIVING" onChange={set('main_category')} />
        </MField>
      </div>
      <MField label="Brand Category">
        <MInput value={form.brand_category} placeholder="e.g. PRIVATE BRAND" onChange={set('brand_category')} />
      </MField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', borderRadius: 12, background: 'rgba(42,157,143,0.04)', border: '1px solid rgba(42,157,143,0.12)' }}>
        <MField label="PIC">
          <SearchableSelect
            value={form.pic_name}
            onChange={(v) => setForm(p => ({ ...p, pic_name: v }))}
            options={picsList.map(p => ({ id: p.pic_name, label: p.pic_name }))}
            placeholder="Select PIC"
          />
        </MField>
        <MField label="PIC Change">
          <SearchableSelect
            value={form.pic_change_name}
            onChange={(v) => setForm(p => ({ ...p, pic_change_name: v }))}
            options={picsList.map(p => ({ id: p.pic_name, label: p.pic_name }))}
            placeholder="Select PIC Change"
          />
        </MField>
      </div>
    </MasterModal>
  );
}

const columns = [
  { key: 'detail_category', header: 'Detail Category', render: r => <span style={{ fontWeight: 600 }}>{r.detail_category}</span> },
  { key: 'sub_category',    header: 'Sub Category',    render: r => r.sub_category   || '-' },
  { key: 'main_category',   header: 'Main Category',   render: r => r.main_category  || '-' },
  { key: 'brand_category',  header: 'Brand Category',  render: r => r.brand_category || '-' },
  { key: 'pic_name',        header: 'PIC',             render: r => r.pic_name       ? <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{r.pic_name}</span> : '-' },
];

export default function PicCategories() {
  const { isProductDivision } = useAuth();
  return (
    <MasterPage
      title="PIC Categories"
      description="Manage category and PIC mapping"
      apiPath="/api/master/pic-categories"
      columns={columns}
      ModalForm={PicCategoryModal}
      deleteLabel={r => r.detail_category}
      canEdit={isProductDivision()}
    />
  );
}
