import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

const AddUnitModal = ({ isOpen, onClose, onSubmit, existingUnits = [] }) => {
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', code: '' });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Unit name is required');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        code: formData.code.trim(),
      });
      setFormData({ name: '', code: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add unit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Unit">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <Input
          label="Unit Name"
          placeholder="e.g., Algebra"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          autoFocus
        />

        <Input
          label="Unit Code (optional)"
          placeholder="e.g., MATH101-U1"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        />

        {existingUnits.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">
              Existing Units ({existingUnits.length})
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {existingUnits.map((unit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="text-gray-700 font-medium">{unit.name}</span>
                    {unit.code && (
                      <span className="text-xs text-gray-400 ml-2">{unit.code}</span>
                    )}
                  </div>
                  <Badge variant="primary">Unit {index + 1}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2 border-t">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {existingUnits.length > 0 ? 'Done' : 'Cancel'}
          </Button>
          <Button type="submit" isLoading={saving}>
            Add Unit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUnitModal;
