import { useEffect } from "react";

export default function ImageModal({ image, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  return (
    <div className="image-modal-backdrop" onClick={onClose} role="presentation">
      <div className="image-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="image-modal-header">
          <h3>{image.title}</h3>
          <button type="button" className="image-modal-close" onClick={onClose} aria-label="Zavřít obrázek">
            ×
          </button>
        </div>

        <div className="image-modal-body">
          <img src={image.src} alt={image.title} />
        </div>
      </div>
    </div>
  );
}
