import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MasterPage, { MasterModal, MField, MInput } from './MasterPage';

function ItemTypeModal({ item, onClose, onSave }) {
  const [form,   setForm]   = useState({ type_name: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    setForm({ type_name: item?.type_name || '' });
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit
        ? await axios.put(`/api/master/item-types/${item.id}`, form)
        : await axios.post('/api/master/item-types', form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred.');
    } finally { setSaving(false); }
  };

  return (
    <MasterModal open title="Item Type" isEdit={isEdit} onClose={onClose} onSubmit={handleSubmit} saving={saving}>
      <MField label="Item Type Name" required>
        <MInput required value={form.type_name} placeholder="e.g. BUNDLE"
          onChange={e => setForm({ type_name: e.target.value })} />
      </MField>
    </MasterModal>
  );
}

const columns = [
  { key: 'type_name', header: 'Item Type Name', render: r => <span style={{ fontWeight: 600 }}>{r.type_name}</span> },
];

export default function ItemTypes() {
  const { isProductDivision } = useAuth();
  return (
    <MasterPage
      title="Item Types"
      description="Manage item type master data"
      apiPath="/api/master/item-types"
      columns={columns}
      ModalForm={ItemTypeModal}
      deleteLabel={r => r.type_name}
      canEdit={isProductDivision()}
    />
  );
}
