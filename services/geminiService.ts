import { GoogleGenAI, Type } from "@google/genai";
import { BodyRegion, SurgicalIntervention } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Extracts patient data from an image using Gemini Vision capabilities.
 */
export const extractPatientDataFromImage = async (
  base64Image: string,
  mimeType: string
): Promise<{ patientName: string; clinicalHistoryId: string; date: string; phoneNumber: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: `Analiza esta imagen de un documento médico. Extrae la siguiente información:
            1. Nombre del Paciente (Patient Name).
            2. Número de Historia Clínica (Clinical History / HC / ID).
            3. Fecha del documento (Date).
            4. Números de Teléfono (Phone Numbers). Si encuentras más de uno (ej. casa y móvil), inclúyelos todos separados por " / ".
            
            Si algún dato no es visible, devuelve una cadena vacía. Formatea la fecha como YYYY-MM-DD si es posible.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING },
            clinicalHistoryId: { type: Type.STRING },
            date: { type: Type.STRING },
            phoneNumber: { type: Type.STRING },
          },
          required: ["patientName", "clinicalHistoryId", "date", "phoneNumber"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text from Gemini.");
  } catch (error) {
    console.error("Error extracting patient data:", error);
    throw error;
  }
};

/**
 * Transcribes audio and classifies the intervention.
 */
export const processInterventionAudio = async (
  base64Audio: string,
  mimeType: string
): Promise<SurgicalIntervention> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: `Escucha este audio donde un cirujano describe una intervención quirúrgica. 
            Tu tarea es:
            1. Transcribir la descripción de la intervención (nombre de la intervención).
            2. Clasificar la región del cuerpo (Hombro, Rodilla, Codo, Muñeca, Pie/Tobillo, Cadera, u Otro).
            3. Identificar si es una cirugía artroscópica (arthroscopic).
            4. Identificar específicamente si implica el LCA (Ligamento Cruzado Anterior / ACL).
            5. Identificar si es una cirugía de rodilla en general.
            
            Devuelve un objeto JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Transcription of the surgery description" },
            region: { 
              type: Type.STRING, 
              enum: [
                BodyRegion.SHOULDER,
                BodyRegion.KNEE,
                BodyRegion.ELBOW,
                BodyRegion.WRIST,
                BodyRegion.FOOT_ANKLE,
                BodyRegion.HIP,
                BodyRegion.OTHER
              ] 
            },
            isArthroscopic: { type: Type.BOOLEAN },
            isLCA: { type: Type.BOOLEAN },
            isKneeRelated: { type: Type.BOOLEAN },
          },
          required: ["description", "region", "isArthroscopic", "isLCA", "isKneeRelated"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text from Gemini audio processing.");
  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
};