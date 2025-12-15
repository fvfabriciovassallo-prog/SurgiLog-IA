export enum BodyRegion {
  SHOULDER = 'Hombro',
  KNEE = 'Rodilla',
  ELBOW = 'Codo',
  WRIST = 'Muñeca',
  FOOT_ANKLE = 'Pie/Tobillo',
  HIP = 'Cadera',
  OTHER = 'Otro'
}

export interface SurgicalIntervention {
  description: string;
  region: BodyRegion;
  isArthroscopic: boolean;
  isLCA: boolean; // Anterior Cruciate Ligament
  isKneeRelated: boolean;
}

export interface PatientRecord {
  id: string; // UUID
  patientName: string;
  clinicalHistoryId: string;
  phoneNumber?: string;
  date: string;
  intervention: SurgicalIntervention | null;
  createdAt: number;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  error: string | null;
}