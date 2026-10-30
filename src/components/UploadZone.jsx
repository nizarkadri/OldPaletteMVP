import { useRef, useState } from 'react';

/**
 * UploadZone
 * ----------
 * Drag-and-drop / click-to-upload area for the screenshot.
 * Calls onFileSelected(file) when a valid image is chosen.
 */
export default function UploadZone({ onFileSelected, isProcessing, statusMessage }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelected(file);
    }
  }

  return (
    <div
      className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
      onClick={() => !isProcessing && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isProcessing) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!isProcessing) handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {isProcessing ? (
        <>
          <div className="spinner" />
          <p>{statusMessage || 'Analyzing your UI...'}</p>
        </>
      ) : (
        <>
          <i className="ti ti-photo-up" aria-hidden="true" />
          <p>Drop a screenshot here, or click to upload</p>
          <span className="hint">PNG or JPG — your app, website, or any UI</span>
        </>
      )}
    </div>
  );
}
