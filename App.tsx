import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  FileText, 
  Save, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Activity, 
  Calendar,
  User,
  Hash,
  Stethoscope,
  Phone,
  Check,
  Trash2
} from 'lucide-react';

import { ImageUpload } from './components/ImageUpload';
import { AudioRecorder } from './components/AudioRecorder';
import { Button } from './components/Button';
import { extractPatientDataFromImage, processInterventionAudio } from './services/geminiService';
import { PatientRecord, BodyRegion, SurgicalIntervention } from './types';

function App() {
  // Initialize with current date as per requirements
  const [currentRecord, setCurrentRecord] = useState<Partial<PatientRecord>>({
    date: new Date().toISOString().split('T')[0]
  });
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [savedRecords, setSavedRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<{ image: boolean; audio: boolean }>({ image: false, audio: false });
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load records from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('surgilog_db');
    if (saved) {
      try {
        setSavedRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local database", e);
      }
    }
  }, []);

  // Save records to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('surgilog_db', JSON.stringify(savedRecords));
  }, [savedRecords]);

  const handleImageSelected = async (base64: string, mimeType: string) => {
    setImageBase64(base64);
    setLoading(prev => ({ ...prev, image: true }));
    setError(null);
    try {
      const data = await extractPatientDataFromImage(base64, mimeType);
      setCurrentRecord(prev => ({
        ...prev,
        patientName: data.patientName,
        clinicalHistoryId: data.clinicalHistoryId,
        phoneNumber: data.phoneNumber,
        // We keep the current date (today) as default, but if you want to use the document date, 
        // you could uncomment the next line. Requirement states "Date must be current moment".
        // date: data.date || prev.date 
      }));
    } catch (err) {
      setError("No se pudieron extraer los datos de la imagen. Por favor intente nuevamente o ingrese los datos manualmente.");
    } finally {
      setLoading(prev => ({ ...prev, image: false }));
    }
  };

  const handleAudioReady = async (base64: string, mimeType: string) => {
    setLoading(prev => ({ ...prev, audio: true }));
    setError(null);
    try {
      const interventionData = await processInterventionAudio(base64, mimeType);
      setCurrentRecord(prev => ({
        ...prev,
        intervention: interventionData
      }));
    } catch (err) {
      setError("Error al procesar el audio. Por favor intente hablar más claro o verifique su conexión.");
    } finally {
      setLoading(prev => ({ ...prev, audio: false }));
    }
  };

  const toggleBooleanIntervention = (field: 'isArthroscopic' | 'isLCA' | 'isKneeRelated') => {
    if (!currentRecord.intervention) return;
    setCurrentRecord(prev => ({
      ...prev,
      intervention: {
        ...prev.intervention!,
        [field]: !prev.intervention![field]
      }
    }));
  };

  const handleSaveRecord = () => {
    if (!currentRecord.patientName || !currentRecord.intervention) {
      setError("Faltan datos obligatorios (Nombre del Paciente o Intervención).");
      return;
    }

    const newRecord: PatientRecord = {
      id: uuidv4(),
      patientName: currentRecord.patientName || "Desconocido",
      clinicalHistoryId: currentRecord.clinicalHistoryId || "S/N",
      phoneNumber: currentRecord.phoneNumber || "",
      date: currentRecord.date || new Date().toISOString().split('T')[0],
      intervention: currentRecord.intervention!,
      createdAt: Date.now()
    };

    setSavedRecords(prev => [newRecord, ...prev]);
    setIsSuccess(true);
    
    // Delay new patient reset to show the success check animation
    setTimeout(() => {
      handleNewPatient();
      setIsSuccess(false);
    }, 1500);
  };

  const handleNewPatient = () => {
    // Reset to default state with Today's date
    setCurrentRecord({
      date: new Date().toISOString().split('T')[0]
    });
    setImageBase64(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (id: string) => {
    // Immediate deletion without confirmation as requested
    setSavedRecords(prev => prev.filter(r => r.id !== id));
    // Optional: Clear error/status message or show a small transient feedback if needed
    setError(null); 
  };

  const handleExportCSV = () => {
    if (savedRecords.length === 0) return;

    const headers = ["ID", "Fecha", "HC", "Paciente", "Teléfono", "Intervención", "Región", "Artroscopia", "LCA", "Rodilla"];
    const rows = savedRecords.map(r => [
      r.id,
      r.date,
      r.clinicalHistoryId,
      r.patientName,
      `"${r.phoneNumber || ''}"`, // Wrap phone in quotes to prevent Excel formatting issues
      `"${r.intervention?.description.replace(/"/g, '""') || ''}"`, // Escape quotes
      r.intervention?.region || '',
      r.intervention?.isArthroscopic ? 'Sí' : 'No',
      r.intervention?.isLCA ? 'Sí' : 'No',
      r.intervention?.isKneeRelated ? 'Sí' : 'No'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `surgilog_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-medical-600 text-white p-2 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">SurgiLog AI</h1>
              <p className="text-xs text-gray-500">Asistente Quirúrgico Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <ShieldCheck size={14} />
            <span className="font-medium">Confidencialidad Activa</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Image & Patient Data */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-medical-500" size={20} />
                Datos del Paciente
              </h2>
              
              <ImageUpload 
                onImageSelected={handleImageSelected}
                onClear={() => {
                  setImageBase64(null);
                  setCurrentRecord(prev => ({ 
                    ...prev, 
                    patientName: '', 
                    clinicalHistoryId: '', 
                    phoneNumber: ''
                    // Date is kept as is
                  }));
                }}
                previewUrl={imageBase64}
                isProcessing={loading.image}
              />

              {loading.image && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                  <Activity className="animate-spin" size={20} />
                  Analizando documento con IA...
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <User size={14} /> Nombre del Paciente
                  </label>
                  <input 
                    type="text" 
                    value={currentRecord.patientName || ''}
                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="Detectado automáticamente..."
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 px-4 py-2 border"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Hash size={14} /> Historia Clínica (HC)
                    </label>
                    <input 
                      type="text" 
                      value={currentRecord.clinicalHistoryId || ''}
                      onChange={(e) => setCurrentRecord(prev => ({ ...prev, clinicalHistoryId: e.target.value }))}
                      placeholder="Ej. 123456"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 px-4 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Phone size={14} /> Teléfono(s)
                    </label>
                    <input 
                      type="tel" 
                      value={currentRecord.phoneNumber || ''}
                      onChange={(e) => setCurrentRecord(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Ej: 555-0101 / 555-0102"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 px-4 py-2 border"
                    />
                    <p className="text-xs text-gray-400 mt-1">Si hay múltiples, sepárelos con /</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar size={14} /> Fecha de Registro
                  </label>
                  <input 
                    type="date" 
                    value={currentRecord.date || ''}
                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 px-4 py-2 border bg-gray-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">Por defecto: Fecha actual.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Audio & Intervention Data */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Stethoscope className="text-medical-500" size={20} />
                Detalles de Intervención
              </h2>

              <AudioRecorder onAudioReady={handleAudioReady} isProcessing={loading.audio} />
              
              {loading.audio && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                  <Activity className="animate-spin" size={20} />
                  Transcribiendo y clasificando con IA...
                </div>
              )}

              {currentRecord.intervention && (
                <div className="mt-6 flex-grow flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción Transcrita</label>
                    <textarea 
                      value={currentRecord.intervention.description}
                      onChange={(e) => {
                         const newVal = e.target.value;
                         setCurrentRecord(prev => ({
                           ...prev,
                           intervention: prev.intervention ? { ...prev.intervention, description: newVal } : null
                         }))
                      }}
                      className="w-full mt-2 bg-transparent border-none p-0 text-gray-800 focus:ring-0 resize-none h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Región</label>
                      <div className="font-medium text-medical-700 mt-1">{currentRecord.intervention.region}</div>
                    </div>
                    
                    {/* Artroscopia Toggle */}
                    <button
                      onClick={() => toggleBooleanIntervention('isArthroscopic')}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                        currentRecord.intervention.isArthroscopic 
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-md transform scale-[1.02]' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <label className="text-xs font-semibold uppercase cursor-pointer">Artroscopia</label>
                      <div className="font-bold mt-1">{currentRecord.intervention.isArthroscopic ? 'SÍ' : 'NO'}</div>
                    </button>

                    {/* LCA Toggle */}
                    <button
                      onClick={() => toggleBooleanIntervention('isLCA')}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                        currentRecord.intervention.isLCA 
                          ? 'bg-orange-500 border-orange-600 text-white shadow-md transform scale-[1.02]' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <label className="text-xs font-semibold uppercase cursor-pointer">LCA / ACL</label>
                      <div className="font-bold mt-1">{currentRecord.intervention.isLCA ? 'SÍ' : 'NO'}</div>
                    </button>

                    {/* Knee Toggle */}
                    <button
                      onClick={() => toggleBooleanIntervention('isKneeRelated')}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                        currentRecord.intervention.isKneeRelated 
                          ? 'bg-blue-600 border-blue-700 text-white shadow-md transform scale-[1.02]' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <label className="text-xs font-semibold uppercase cursor-pointer">Cirugía Rodilla</label>
                      <div className="font-bold mt-1">{currentRecord.intervention.isKneeRelated ? 'SÍ' : 'NO'}</div>
                    </button>
                  </div>
                </div>
              )}
             </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className="sticky bottom-4 z-40 bg-white/90 backdrop-blur shadow-lg rounded-2xl p-4 border border-gray-200 flex justify-between items-center gap-4">
            <Button variant="secondary" onClick={handleNewPatient} icon={<RefreshCw size={18} />}>
              Nuevo Paciente
            </Button>
            <div className="flex-grow"></div>
            <Button 
              variant="success" 
              onClick={handleSaveRecord} 
              disabled={!currentRecord.patientName || !currentRecord.intervention || isSuccess}
              className={`w-full md:w-auto px-8 transition-all duration-300 ${isSuccess ? 'scale-105' : ''}`}
              icon={isSuccess ? <Check size={20} className="text-white" /> : <Save size={18} />}
            >
              {isSuccess ? '¡Guardado!' : 'Guardar Registro'}
            </Button>
        </div>

        {/* Database Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity size={18} className="text-medical-600" />
              Base de Datos Local
              <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{savedRecords.length}</span>
            </h3>
            <Button variant="ghost" onClick={handleExportCSV} disabled={savedRecords.length === 0} icon={<Download size={16} />}>
              Exportar CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Paciente</th>
                  <th className="px-6 py-3">HC</th>
                  <th className="px-6 py-3">Teléfono</th>
                  <th className="px-6 py-3">Región</th>
                  <th className="px-6 py-3">Detalles</th>
                  <th className="px-6 py-3">Descripción</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {savedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      No hay registros guardados aún.
                    </td>
                  </tr>
                ) : (
                  savedRecords.map((record) => (
                    <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{record.date}</td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">{record.patientName}</td>
                      <td className="px-6 py-4">{record.clinicalHistoryId}</td>
                      <td className="px-6 py-4 font-mono text-xs max-w-[150px] truncate" title={record.phoneNumber}>
                        {record.phoneNumber || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.intervention?.region === BodyRegion.KNEE ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.intervention?.region}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           {record.intervention?.isArthroscopic && (
                             <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Art</span>
                           )}
                           {record.intervention?.isLCA && (
                             <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">LCA</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={record.intervention?.description}>
                        {record.intervention?.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                          title="Eliminar registro"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;