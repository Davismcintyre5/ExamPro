import { useRef, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { uploadImage, deleteImage, extractPublicId } from '../../api/uploadApi';
import toast from 'react-hot-toast';

const ImageUpload = ({
  label,
  value,
  onChange,
  type = 'misc',
  accept = 'image/*',
  recommended = 'PNG, JPG, WebP, or SVG - max 5MB',
  previewHeight = 'h-24',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, type);
      onChange(result.url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (newUrl) => {
    onChange(newUrl);
  };

  const handleClear = async () => {
    const publicId = extractPublicId(value);
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error.message);
      }
    }
    onChange('');
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="space-y-3">
        <div
          className={`border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-center ${previewHeight}`}
        >
          {value ? (
            <img
              src={value}
              alt={label || 'Preview'}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-gray-500 mt-1">No image</p>
            </div>
          )}
        </div>

        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploading}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {value ? 'Replace' : 'Upload'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              {showUrlInput ? 'Hide URL' : 'Enter URL'}
            </Button>

            {value && (
              <Button variant="danger" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {(showUrlInput || value) && (
          <Input
            label="Image URL"
            placeholder="https://example.com/image.png"
            value={value || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={disabled}
          />
        )}

        {recommended && (
          <p className="text-xs text-gray-500">{recommended}</p>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
