import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Camera } from 'lucide-react';
import { Button } from './Button';

interface ImageUploadProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  onClear: () => void;
  previewUrl: string | null;
  isProcessing: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, onClear, previewUrl, isProcessing }) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix for API
      const base64Data = base64String.split(',')[1];
      onImageSelected(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  if (previewUrl) {
    return (
      <div className="relative group rounded-xl overflow-hidden shadow-md border border-gray-200">
        <img 
          src={`data:image/jpeg;base64,${previewUrl}`} 
          alt="Documento escaneado" 
          className="w-full h-64 object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <Button variant="danger" onClick={onClear} icon={<X />}>
             Eliminar Imagen
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
        dragActive 
          ? 'border-medical-500 bg-medical-50 scale-[1.01]' 
          : 'border-gray-300 hover:border-medical-400 hover:bg-gray-50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Input para Galería */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={isProcessing}
      />
      
      {/* Input para Cámara (usa capture="environment" para la cámara trasera) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-medical-100 text-medical-600 rounded-full flex items-center justify-center">
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sube o Captura la Ficha</h3>
          <p className="text-sm text-gray-500 mt-1">Selecciona de la galería o toma una foto instantánea</p>
        </div>
        
        {isProcessing ? (
          <Button disabled className="w-full">
            Procesando...
          </Button>
        ) : (
          <div className="flex gap-3 w-full justify-center">
            <Button 
              onClick={() => galleryInputRef.current?.click()} 
              variant="secondary"
              className="flex-1"
              icon={<ImageIcon size={18} />}
            >
              Galería
            </Button>
            <Button 
              onClick={() => cameraInputRef.current?.click()} 
              variant="primary"
              className="flex-1"
              icon={<Camera size={18} />}
            >
              Cámara
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};