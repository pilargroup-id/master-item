import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MasterPage, { MasterModal, MField, MInput } from './MasterPage';

function PicModal({ item, onClose, onSave }) {
  const [form,   setForm]   = useState({ pic_name: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    setForm({ pic_name: item?.pic_name || '' });
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit
        ? await axios.put(`/api/master/pics/${item.id}`, form)
        : await axios.post('/api/master/pics', form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred.');
    } finally { setSaving(false); }
  };

  return (
    <MasterModal open title="PIC" isEdit={isEdit} onClose={onClose} onSubmit={handleSubmit} saving={saving}>
      <MField label="PIC Name" required>
        <MInput required value={form.pic_name} placeholder="e.g. KATHERINE"
          onChange={e => setForm({ pic_name: e.target.value })} />
      </MField>
    </MasterModal>
  );
}

const columns = [
  { key: 'pic_name', header: 'PIC Name', render: r => <span style={{ fontWeight: 600 }}>{r.pic_name}</span> },
];

export default function Pics() {
  const { isProductDivision } = useAuth();
  return (
    <MasterPage
      title="PICs"
      description="Manage Person in Charge master data"
      apiPath="/api/master/pics"
      columns={columns}
      ModalForm={PicModal}
      deleteLabel={r => r.pic_name}
      canEdit={isProductDivision()}
    />
  );
}
