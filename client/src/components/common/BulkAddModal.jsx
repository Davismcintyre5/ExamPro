import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const BulkAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Bulk Add',
  formatHint = 'One per line',
  placeholder = '',
  submitLabel = 'Add'
}) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError('Paste at least one row');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(lines);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const lineCount = text.split('\n').filter((l) => l.trim()).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paste rows
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows="10"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">{formatHint}</p>
          <p className="text-xs text-blue-600 mt-1">{lineCount} row(s) detected</p>
        </div>

        <div className="flex justify-end space-x-3 pt-2 border-t">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving} disabled={lineCount === 0}>
            {submitLabel} {lineCount > 0 ? `(${lineCount})` : ''}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkAddModal;