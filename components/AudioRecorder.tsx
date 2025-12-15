import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface AudioRecorderProps {
  onAudioReady: (base64Audio: string, mimeType: string) => void;
  isProcessing: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          onAudioReady(base64Data, mimeType);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dictado de Intervención</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-50 ring-4 ring-red-100' : 'bg-gray-50'}`}>
          {isRecording ? (
             <div className="flex gap-1 items-end h-8">
               <span className="w-1.5 h-4 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></span>
               <span className="w-1.5 h-8 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_0.2s_infinite]"></span>
               <span className="w-1.5 h-5 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_0.4s_infinite]"></span>
             </div>
          ) : (
            <Mic size={32} className="text-gray-400" />
          )}
        </div>

        <div className="text-2xl font-mono font-medium text-gray-700">
          {formatTime(recordingTime)}
        </div>

        <div className="flex gap-3">
          {!isRecording ? (
            <Button 
              onClick={startRecording} 
              disabled={isProcessing}
              variant={isProcessing ? "secondary" : "primary"}
              icon={isProcessing ? <Loader2 className="animate-spin" /> : <Mic />}
            >
              {isProcessing ? 'Procesando...' : 'Iniciar Dictado'}
            </Button>
          ) : (
            <Button 
              onClick={stopRecording} 
              variant="danger"
              icon={<Square />}
            >
              Detener y Procesar
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Describe la cirugía detalladamente. La IA clasificará automáticamente la región (ej. Rodilla, Hombro) y detectará si es Artroscopia o LCA.
        </p>
      </div>
    </div>
  );
};