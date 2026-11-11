import { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const ImportModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Import',
  formatHint = 'CSV or XLSX file',
  templateDownload,
  submitLabel = 'Import'
}) => {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    setSaving(true);
    try {
      const res = await onSubmit(file);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  };

  const handleDownloadTemplate = () => {
    if (templateDownload) {
      templateDownload();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      {result ? (
        <div className="space-y-4">
          <Alert
            type="success"
            title="Import complete"
            message={`Total: ${result.total || 0} | Created: ${result.created || 0} | Skipped: ${result.skipped || 0} | Errors: ${result.errors || 0}`}
          />

          {result.skippedRows?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Skipped:</p>
              <div className="max-h-40 overflow-y-auto text-xs bg-yellow-50 border border-yellow-200 rounded p-2 space-y-1">
                {result.skippedRows.map((s, i) => (
                  <div key={i}>
                    <strong>{s.name || s.className || s.admissionNumber || '-'}</strong> - {s.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errorRows?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
              <div className="max-h-40 overflow-y-auto text-xs bg-red-50 border border-red-200 rounded p-2 space-y-1">
                {result.errorRows.map((s, i) => (
                  <div key={i}>
                    <strong>{s.name || s.admissionNumber || '-'}</strong> - {s.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setResult(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Import More
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select file
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p className="font-medium mb-1">Format:</p>
            <p>{formatHint}</p>
            {templateDownload && (
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-2 text-blue-700 underline font-medium"
              >
                Download CSV template
              </button>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} disabled={!file}>
              {submitLabel}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ImportModal;