import { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 8;

export default function ImageUploader({ 
  images = [], 
  onImagesChange, 
  maxFiles = MAX_FILES,
  required = false,
  error = '',
  label = 'Project Images',
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = error || localError;

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" — only JPG, PNG, WEBP, GIF allowed.`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}" exceeds 5MB limit.`;
    }
    return null;
  };

  const addFiles = (fileList) => {
    setLocalError('');
    const newFiles = Array.from(fileList);
    const remaining = maxFiles - images.length;

    if (remaining <= 0) {
      setLocalError(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    const validFiles = [];
    for (const file of newFiles.slice(0, remaining)) {
      const err = validateFile(file);
      if (err) {
        setLocalError(err);
        return;
      }
      // Create preview URL
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
    }

    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
    }
  };

  const removeImage = (id) => {
    const img = images.find(i => i.id === id);
    if (img?.preview && img.file) URL.revokeObjectURL(img.preview);
    onImagesChange(images.filter(i => i.id !== id));
    setLocalError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="img-uploader">
      <label className="img-uploader-label">
        {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
      </label>

      {/* Drop zone */}
      <div
        className={`img-uploader-zone ${dragActive ? 'img-uploader-zone--active' : ''} ${displayError ? 'img-uploader-zone--error' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
        <FiUploadCloud className="img-uploader-icon" />
        <p className="img-uploader-text">
          <span className="img-uploader-link">Click to upload</span> or drag & drop
        </p>
        <p className="img-uploader-hint">
          JPG, PNG, WEBP or GIF · Max 5MB · Up to {maxFiles} images
        </p>
      </div>

      {/* Error */}
      {displayError && (
        <p className="img-uploader-error">
          <FiAlertCircle size={13} /> {displayError}
        </p>
      )}

      {/* Previews */}
      {images.length > 0 && (
        <div className="img-uploader-previews">
          {images.map((img, idx) => (
            <div key={img.id} className="img-uploader-preview">
              <img 
                src={img.preview || img.url} 
                alt={`Preview ${idx + 1}`} 
                className="img-uploader-thumb" 
              />
              <button
                type="button"
                className="img-uploader-remove"
                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                title="Remove image"
              >
                <FiX size={12} />
              </button>
              {idx === 0 && (
                <span className="img-uploader-primary-badge">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="img-uploader-count">
        <FiImage size={12} /> {images.length} / {maxFiles} images
      </p>
    </div>
  );
}
