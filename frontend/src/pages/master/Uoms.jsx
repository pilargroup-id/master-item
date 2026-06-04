import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MasterPage, { MasterModal, MField, MInput } from './MasterPage';

function UomModal({ item, onClose, onSave }) {
  const [form,   setForm]   = useState({ uom_name: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    setForm({ uom_name: item?.uom_name || '' });
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit
        ? await axios.put(`/api/master/uoms/${item.id}`, form)
        : await axios.post('/api/master/uoms', form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred.');
    } finally { setSaving(false); }
  };

  return (
    <MasterModal open title="UOM" isEdit={isEdit} onClose={onClose} onSubmit={handleSubmit} saving={saving}>
      <MField label="UOM Name" required>
        <MInput required value={form.uom_name} placeholder="e.g. PCS"
          onChange={e => setForm({ uom_name: e.target.value })} />
      </MField>
    </MasterModal>
  );
}

const columns = [
  { key: 'uom_name', header: 'UOM Name', render: r => <span style={{ fontWeight: 600 }}>{r.uom_name}</span> },
];

export default function Uoms() {
  const { isProductDivision } = useAuth();
  return (
    <MasterPage
      title="UOMs"
      description="Manage unit of measure master data"
      apiPath="/api/master/uoms"
      columns={columns}
      ModalForm={UomModal}
      deleteLabel={r => r.uom_name}
      canEdit={isProductDivision()}
    />
  );
}
