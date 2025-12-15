import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface BiometricAuthProps {
  onAuthenticated: () => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onAuthenticated }) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBiometricScan = async () => {
    setIsProcessing(true);
    setError(null);

    // Check if browser supports WebAuthn
    if (!window.PublicKeyCredential) {
      setError("Tu dispositivo no soporta autenticación biométrica o no es segura.");
      setIsProcessing(false);
      return;
    }

    try {
      // We generate a random challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // We use credentials.create to force a platform authentication (TouchID/FaceID/Fingerprint)
      // This acts as a local gatekeeper without needing a backend server for this specific demo
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "SurgiLog AI",
            id: window.location.hostname // Must match current domain
          },
          user: {
            id: new Uint8Array(16),
            name: "doctor@surgilog.ai",
            displayName: "Personal Médico Autorizado"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Forces local hardware (Fingerprint reader)
            userVerification: "required"         // Requires the biometrics to be verified
          },
          attestation: "direct"
        }
      });

      // If promise resolves, biometrics were successful
      onAuthenticated();

    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        setError("Acceso denegado o tiempo de espera agotado.");
      } else if (err.name === 'InvalidStateError') {
         setError("Error en el sensor biométrico.");
      } else {
        setError("No se pudo verificar la huella digital.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-md w-full text-center space-y-6">
        
        <div className="mx-auto bg-medical-50 w-24 h-24 rounded-full flex items-center justify-center mb-4 ring-8 ring-medical-50/50">
          <Lock size={40} className="text-medical-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">SurgiLog AI</h1>
          <p className="text-gray-500 mt-2">Acceso Seguro a Registros Médicos</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 text-left">
            <ShieldAlert size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="pt-4 pb-2">
          <Button 
            onClick={handleBiometricScan} 
            className="w-full py-4 text-lg shadow-lg shadow-medical-500/20"
            disabled={isProcessing}
            variant="primary"
          >
            <div className="flex items-center gap-3">
              <Fingerprint size={24} />
              {isProcessing ? 'Verificando...' : 'Acceder con Huella'}
            </div>
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            Requiere un dispositivo con sensor de huella o biometría activada.
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Confidencialidad Garantizada • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};