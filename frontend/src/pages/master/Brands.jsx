import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MasterPage, { MasterModal, MField, MInput, DataTableStatus } from './MasterPage';

function BrandModal({ item, onClose, onSave }) {
  const [form,   setForm]   = useState({ brand_name: '', business_unit: '', business_unit_new: '', is_active: 1 });
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    setForm({
      brand_name:        item?.brand_name        || '',
      business_unit:     item?.business_unit     || '',
      business_unit_new: item?.business_unit_new || '',
      is_active:         item?.is_active !== undefined ? item.is_active : 1,
    });
  }, [item]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setForm(p => ({ ...p, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit
        ? await axios.put(`/api/master/brands/${item.id}`, form)
        : await axios.post('/api/master/brands', form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred.');
    } finally { setSaving(false); }
  };

  return (
    <MasterModal open title="Brand" isEdit={isEdit} onClose={onClose} onSubmit={handleSubmit} saving={saving} width={520}>
      <MField label="Brand Name" required>
        <MInput required value={form.brand_name} placeholder="e.g. GOTO" onChange={set('brand_name')} />
      </MField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <MField label="Business Unit">
          <MInput value={form.business_unit} placeholder="e.g. GOTO" onChange={set('business_unit')} />
        </MField>
        <MField label="Business Unit New">
          <MInput value={form.business_unit_new} placeholder="e.g. TRADE GOTO" onChange={set('business_unit_new')} />
        </MField>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#445674' }}>
        <input type="checkbox" checked={form.is_active === 1} onChange={set('is_active')} />
        <span>Active Brand</span>
      </label>
    </MasterModal>
  );
}

const columns = [
  { key: 'brand_name',        header: 'Brand Name',        render: r => <span style={{ fontWeight: 600 }}>{r.brand_name}</span> },
  { key: 'business_unit',     header: 'Business Unit',     render: r => r.business_unit     || '-' },
  { key: 'business_unit_new', header: 'Business Unit New', render: r => r.business_unit_new || '-' },
  {
    key: 'is_active',
    header: 'Status',
    headerStyle: { textAlign: 'center' },
    cellStyle:   { textAlign: 'center' },
    render: r => (
      <DataTableStatus variant={r.is_active ? 'active' : 'inactive'} inline>
        {r.is_active ? 'Active' : 'Inactive'}
      </DataTableStatus>
    ),
  },
];

export default function Brands() {
  const { isProductDivision } = useAuth();
  return (
    <MasterPage
      title="Brands"
      description="Manage brand master data"
      apiPath="/api/master/brands"
      columns={columns}
      ModalForm={BrandModal}
      deleteLabel={r => r.brand_name}
      canEdit={isProductDivision()}
    />
  );
}
