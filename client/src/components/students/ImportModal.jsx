import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { importStudents } from '../../api/studentApi';
import toast from 'react-hot-toast';

const ImportModal = ({ isOpen, onClose, classes, onImported }) => {
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const classOptions = classes.map((cls) => ({
    value: cls._id,
    label: `${cls.className}${cls.departmentId?.name ? ` - ${cls.departmentId.name}` : ''}`,
  }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId) {
      toast.error('Select a class');
      return;
    }

    if (!file) {
      toast.error('Select a file');
      return;
    }

    setUploading(true);
    try {
      const res = await importStudents(classId, file);
      setResult(res);
      toast.success(`Import complete: ${res.created} created`);
      if (onImported) onImported();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setClassId('');
    setFile(null);
    setResult(null);
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csv = 'admission_number,full_name,phone\nADM001,John Doe,+254700000000\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Students">
      {result ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-green-800 mb-2">Import Complete</p>
            <div className="text-sm text-green-700 space-y-1">
              <p>Total rows: <strong>{result.total}</strong></p>
              <p>Created: <strong>{result.created}</strong></p>
              <p>Skipped: <strong>{result.skipped}</strong></p>
              <p>Errors: <strong>{result.errors}</strong></p>
            </div>
          </div>

          {result.skippedRows?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Skipped rows:</p>
              <div className="max-h-40 overflow-y-auto text-xs bg-yellow-50 border border-yellow-200 rounded p-2 space-y-1">
                {result.skippedRows.map((s, i) => (
                  <div key={i}>
                    <strong>{s.admissionNumber}</strong> - {s.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errorRows?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Error rows:</p>
              <div className="max-h-40 overflow-y-auto text-xs bg-red-50 border border-red-200 rounded p-2 space-y-1">
                {result.errorRows.map((s, i) => (
                  <div key={i}>
                    <strong>{s.row?.admissionNumber || '-'}</strong> - {s.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Button variant="secondary" onClick={() => {
              setResult(null);
              setFile(null);
            }}>
              Import More
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Import into Class"
            placeholder="Select class"
            options={classOptions}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File (.csv or .xlsx)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p className="font-medium mb-1">File Format:</p>
            <p>Columns required: <code>admission_number, full_name, phone</code></p>
            <p className="mt-1">First row must be the header row.</p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mt-2 text-blue-700 underline font-medium"
            >
              Download CSV template
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Button variant="secondary" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={uploading} disabled={!classId || !file}>
              Import
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ImportModal;
