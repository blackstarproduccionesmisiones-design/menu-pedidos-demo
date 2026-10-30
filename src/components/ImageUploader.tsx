import React, { useRef, useState } from 'react';
import { Upload, LoaderCircle, Image as ImageIcon } from 'lucide-react';
import { firebaseAuth } from '../firebase';

type ImageKind = 'cover' | 'logo' | 'product';

interface ImageUploaderProps {
  commerceId: string;
  kind: ImageKind;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  commerceId,
  kind,
  currentUrl,
  onUploaded,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setError('Elegí una imagen JPG, PNG, WebP o AVIF.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('La imagen no puede superar los 8 MB.');
      return;
    }
    if (!firebaseAuth?.currentUser) {
      setError('Tu sesión venció. Volvé a ingresar al panel.');
      return;
    }

    setUploading(true);
    try {
      const token = await firebaseAuth.currentUser.getIdToken();
      const signatureResponse = await fetch('/api/cloudinary/sign-upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commerceId, kind }),
      });
      const signatureData = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signatureData.error || 'No se pudo preparar la carga.');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.apiKey);
      formData.append('timestamp', String(signatureData.timestamp));
      formData.append('folder', signatureData.folder);
      formData.append('public_id', signatureData.publicId);
      formData.append('signature', signatureData.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        { method: 'POST', body: formData },
      );
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error?.message || 'Cloudinary no pudo subir la imagen.');
      if (typeof uploadData.secure_url !== 'string') throw new Error('Cloudinary no devolvió la URL de la imagen.');

      onUploaded(uploadData.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {currentUrl ? (
        <img src={currentUrl} alt="Vista previa" className="h-24 max-w-full rounded-xl border border-stone-200 object-cover" />
      ) : (
        <div className="flex h-16 items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 text-xs text-stone-500">
          <ImageIcon size={18} /> Todavía no hay una imagen seleccionada.
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        capture={false}
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {uploading ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'Subiendo imagen…' : 'Elegir foto y subir'}
      </button>
      <p className="text-[11px] text-stone-500">JPG, PNG, WebP o AVIF · máximo 8 MB. La imagen se guarda al guardar los cambios.</p>
      {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
};
