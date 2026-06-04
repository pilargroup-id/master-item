import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MasterPage, { MasterModal, MField, MInput } from './MasterPage';

function PortModal({ item, onClose, onSave }) {
  const [form,   setForm]   = useState({ port_name: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    setForm({ port_name: item?.port_name || '' });
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit
        ? await axios.put(`/api/master/ports/${item.id}`, form)
        : await axios.post('/api/master/ports', form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred.');
    } finally { setSaving(false); }
  };

  return (
    <MasterModal open title="Port" isEdit={isEdit} onClose={onClose} onSubmit={handleSubmit} saving={saving}>
      <MField label="Port Name" required>
        <MInput required value={form.port_name} placeholder="e.g. JAKARTA"
          onChange={e => setForm({ port_name: e.target.value })} />
      </MField>
    </MasterModal>
  );
}

const columns = [
  { key: 'port_name', header: 'Port Name', render: r => <span style={{ fontWeight: 600 }}>{r.port_name}</span> },
];

export default function Ports() {
  const { isProductDivision } = useAuth();
  return (
    <MasterPage
      title="Ports"
      description="Manage port master data"
      apiPath="/api/master/ports"
      columns={columns}
      ModalForm={PortModal}
      deleteLabel={r => r.port_name}
      canEdit={isProductDivision()}
    />
  );
}
