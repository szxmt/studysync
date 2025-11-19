
import { GoogleGenAI, Type } from "@google/genai";
import { ResourceApp, ResourceType } from '../types';

const cleanApiKey = (key: string | undefined) => {
    if (!key) return '';
    return key.replace(/["']/g, "").trim();
};

const apiKey = cleanApiKey(process.env.API_KEY);
const ai = new GoogleGenAI({ apiKey });

export const generateStudyStructure = async (topic: string): Promise<ResourceApp | null> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini Service");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a structured study plan for: "${topic}". 
      Imagine this is a mobile app or a textbook. Break it down into a main resource name (the App or Book name) and specific modules (Chapters or Topics).
      Estimate the number of 'items' (questions, pages, or minutes) for each module strictly.
      
      The output MUST be in Traditional Chinese (繁體中文).

      Return valid JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the Resource/App" },
            description: { type: Type.STRING, description: "Brief description" },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Module Name" },
                  type: { type: Type.STRING, enum: ["Questions", "Minutes", "Chapters", "Pages"] },
                  totalItems: { type: Type.INTEGER, description: "Total count of items to complete" }
                },
                required: ["name", "type", "totalItems"]
              }
            }
          },
          required: ["name", "modules"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    
    // Transform to internal type
    const newResource: ResourceApp = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || `AI 為 ${topic} 生成的計劃`,
      modules: data.modules.map((m: any) => ({
        id: crypto.randomUUID(),
        name: m.name,
        type: m.type as ResourceType,
        totalItems: m.totalItems,
        completedItems: 0,
        color: getRandomPastelColor()
      }))
    };

    return newResource;

  } catch (error) {
    console.error("Failed to generate study plan:", error);
    return null;
  }
};

export const generateKnowledgeTip = async (resourceName: string, moduleName: string, knowledgePoint: string): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        User is studying "${resourceName}" - "${moduleName}".
        They are struggling with the specific concept: "${knowledgePoint}".
        
        Please provide a "First Aid Kit" for this knowledge point in Traditional Chinese (繁體中文).
        
        Structure the response strictly as:
        1. 【核心概念】：One sentence definition.
        2. 【常考坑點】：One common mistake or trick used in exams.
        3. 【記憶口訣】：A short, catchy mnemonic or rhyme to help remember it.
        
        Keep it very concise and encouraging.
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Failed to generate tip:", error);
    return null;
  }
}

function getRandomPastelColor() {
  const colors = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4'];
  return colors[Math.floor(Math.random() * colors.length)];
}