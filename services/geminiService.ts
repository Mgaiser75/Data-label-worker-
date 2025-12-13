import { GoogleGenAI, Type } from "@google/genai";
import { Project, ProjectType, Task, TaskStatus } from "../types";

// Initialize Gemini Client
// NOTE: Process.env.API_KEY must be set in the build environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const checkApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

/**
 * Pre-labels a task based on the project configuration using Gemini.
 */
export const preLabelTask = async (task: Task, project: Project): Promise<{ label: string; confidence: number; reasoning: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
  }

  const modelName = 'gemini-2.5-flash';

  let prompt = '';
  let responseSchema: any = {};

  // Construct prompt based on project type
  if (project.type === ProjectType.TEXT_CLASSIFICATION || project.type === ProjectType.SENTIMENT_ANALYSIS) {
    prompt = `
      Analyze the following text and assign exactly one of the following labels: ${project.labels.join(', ')}.
      Text: "${task.data.text}"
      
      Provide a confidence score between 0.0 and 1.0, and a brief reasoning for your choice.
    `;

    responseSchema = {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, enum: project.labels, description: "The assigned label" },
        confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
        reasoning: { type: Type.STRING, description: "Short explanation for the label" }
      },
      required: ["label", "confidence", "reasoning"]
    };
  } else if (project.type === ProjectType.IMAGE_CAPTIONING) {
     prompt = `Generate a descriptive caption for this content.`;
     responseSchema = {
        type: Type.OBJECT,
        properties: {
            label: { type: Type.STRING, description: "The caption" },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
        }
     };
  } else {
    // Default fallback
    prompt = `Analyze: ${JSON.stringify(task.data)}. Labels: ${project.labels.join(',')}`;
    responseSchema = {
        type: Type.OBJECT,
        properties: {
            label: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
        }
     };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for deterministic labeling
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    return result;

  } catch (error) {
    console.error("Gemini Pre-label Error:", error);
    // Fallback or rethrow
    throw error;
  }
};

/**
 * Audit Agent: Compares Human Label vs AI Label to flag discrepancies.
 */
export const auditLabel = async (task: Task, project: Project): Promise<{ flagForReview: boolean; comment: string }> => {
    if (!task.humanLabel || !task.aiPrediction) {
        return { flagForReview: false, comment: "Insufficient data" };
    }

    if (task.humanLabel.label !== task.aiPrediction.label) {
        return { 
            flagForReview: true, 
            comment: `Disagreement detected. AI: ${task.aiPrediction.label} (${task.aiPrediction.confidence}), Human: ${task.humanLabel.label}` 
        };
    }

    return { flagForReview: false, comment: "Consensus reached" };
};

/**
 * Browser Agent (Simulated): Generates realistic work without external calls.
 */
export const scoutForWork = async (): Promise<{ project: Project; tasks: Task[]; logs: string[] }> => {
  if (!process.env.API_KEY) {
     throw new Error("API Key missing");
  }

  const modelName = 'gemini-2.5-flash';
  
  const prompt = `
    You are an autonomous agent scouting for data labeling work.
    Generate a realistic, high-value data labeling contract that might be found on a freelance platform like Upwork or Scale AI.
    
    The project should be one of these types: SENTIMENT_ANALYSIS, TEXT_CLASSIFICATION, NER.
    
    Return a JSON object containing the Project details and 3 sample Tasks (raw data) associated with it.
  `;

  // Schema reuse for both functions
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      project: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Catchy project name" },
          description: { type: Type.STRING, description: "Client description of the work" },
          type: { type: Type.STRING, enum: [ProjectType.SENTIMENT_ANALYSIS, ProjectType.TEXT_CLASSIFICATION, ProjectType.NAMED_ENTITY_RECOGNITION] },
          labels: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of valid labels" },
          guidelines: { type: Type.STRING, description: "Instructions for labelers" },
          hourlyRate: { type: Type.NUMBER, description: "Pay rate in USD" }
        },
        required: ["name", "description", "type", "labels", "guidelines", "hourlyRate"]
      },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The raw text data to label" }
          },
          required: ["text"]
        }
      }
    },
    required: ["project", "tasks"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    const { project, tasks } = parseScoutResult(result);
    
    return { 
      project, 
      tasks,
      logs: ['Generated simulated contract via Gemini 2.5 Flash']
    };

  } catch (error) {
    console.error("Scout Agent Error:", error);
    throw error;
  }
};

/**
 * Browser Agent (Grounded): Uses Google Search to find REAL current trends, then generates work.
 */
export const scoutWorkWithGrounding = async (): Promise<{ project: Project; tasks: Task[]; logs: string[]; sourceUrls: string[] }> => {
  if (!process.env.API_KEY) {
     throw new Error("API Key missing");
  }

  const modelName = 'gemini-2.5-flash';

  try {
    // Step 1: Search for real world context
    const searchPrompt = "What are the most in-demand freelance data labeling jobs right now? (e.g. RLHF, medical, coding). Find a specific recent example or niche.";
    
    const searchResponse = await ai.models.generateContent({
      model: modelName,
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }], 
      }
    });

    const searchContext = searchResponse.text || "General high-demand RLHF data labeling.";
    
    // Extract sources if available
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingChunks
      .map(c => c.web?.uri)
      .filter((u): u is string => !!u);

    // Step 2: Generate JSON based on this real context
    const genPrompt = `
      Based on this real-world market context: "${searchContext.slice(0, 500)}...",
      Generate a realistic Project contract and 3 sample Tasks that fits this specific niche.
      
      Return JSON only.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        project: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Catchy project name based on the market trend" },
            description: { type: Type.STRING, description: "Client description" },
            type: { type: Type.STRING, enum: [ProjectType.SENTIMENT_ANALYSIS, ProjectType.TEXT_CLASSIFICATION, ProjectType.NAMED_ENTITY_RECOGNITION] },
            labels: { type: Type.ARRAY, items: { type: Type.STRING } },
            guidelines: { type: Type.STRING },
            hourlyRate: { type: Type.NUMBER }
          },
          required: ["name", "description", "type", "labels", "guidelines", "hourlyRate"]
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Realistic raw data text for this niche" }
            },
            required: ["text"]
          }
        }
      },
      required: ["project", "tasks"]
    };

    const genResponse = await ai.models.generateContent({
      model: modelName,
      contents: genPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7
      }
    });

    const text = genResponse.text;
    if (!text) throw new Error("No response from AI generation step");

    const result = JSON.parse(text);
    const { project, tasks } = parseScoutResult(result);

    return {
      project,
      tasks,
      logs: [`Grounding search completed. Found context: ${searchContext.slice(0, 50)}...`],
      sourceUrls
    };

  } catch (error) {
    console.error("Grounded Scout Error:", error);
    throw error;
  }
};

// Helper to transform AI JSON to App Types
const parseScoutResult = (result: any) => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      ...result.project
    };

    const newTasks: Task[] = result.tasks.map((t: any, idx: number) => ({
      id: `t-${Date.now()}-${idx}`,
      projectId: newProject.id,
      data: { text: t.text },
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
    
    return { project: newProject, tasks: newTasks };
};
