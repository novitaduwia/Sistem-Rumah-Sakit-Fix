import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { SYSTEM_INSTRUCTION, MOCK_PATIENT_DB, SUB_AGENT_INSTRUCTIONS } from "../constants";
import { AgentType, ToolCallResult } from "../types";

// --- Tool Definitions ---

const medicalRecordsTool: FunctionDeclaration = {
  name: "panggil_sub_agen_rekam_medis",
  description: "Mengambil dan merangkum riwayat medis pasien, hasil lab, diagnosis, dan rencana perawatan. PERHATIAN: Hanya untuk data klinis dan harus menjamin privasi dan keamanan data.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      permintaan_pengguna: {
        type: Type.STRING,
        description: "Kueri lengkap pengguna yang akan diteruskan. Contoh: 'Tolong berikan ringkasan diagnosis CT Thorax Tuan Budi bulan lalu.'",
      },
    },
    required: ["permintaan_pengguna"],
  },
};

const patientManagementTool: FunctionDeclaration = {
  name: "panggil_sub_agen_manajemen_pasien",
  description: "Menangani pendaftaran pasien baru, pembaruan data identitas, atau pertanyaan umum non-medis.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      permintaan_pengguna: { type: Type.STRING, description: "Kueri lengkap pengguna." },
    },
    required: ["permintaan_pengguna"],
  },
};

const appointmentTool: FunctionDeclaration = {
  name: "panggil_sub_agen_penjadwal",
  description: "Menangani pembuatan janji temu, perubahan jadwal, atau pembatalan dengan dokter.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      permintaan_pengguna: { type: Type.STRING, description: "Kueri lengkap pengguna." },
    },
    required: ["permintaan_pengguna"],
  },
};

const billingTool: FunctionDeclaration = {
  name: "panggil_sub_agen_penagihan",
  description: "Menangani pertanyaan seputar tagihan rumah sakit, asuransi, dan metode pembayaran.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      permintaan_pengguna: { type: Type.STRING, description: "Kueri lengkap pengguna." },
    },
    required: ["permintaan_pengguna"],
  },
};

const tools: Tool[] = [{
  functionDeclarations: [
    medicalRecordsTool,
    patientManagementTool,
    appointmentTool,
    billingTool
  ]
}];

// --- Service Logic ---

// Helper to simulate agent execution time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GeminiService {
  private client: GoogleGenAI;
  private modelName = "gemini-2.5-flash"; 

  constructor() {
    // Ideally from process.env.API_KEY, but checking existence
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key missing. App will fail to connect to Gemini.");
    }
    this.client = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  // --- Sub-Agent Brain ---
  // This simulates the Sub-Agent actually "thinking" about the data
  private async generateSubAgentAnalysis(agentType: AgentType, rawData: any, userQuery: string): Promise<string> {
    try {
        const response = await this.client.models.generateContent({
            model: this.modelName,
            config: {
                systemInstruction: SUB_AGENT_INSTRUCTIONS[agentType],
                temperature: 0.4, // Slightly creative but grounded in data
            },
            contents: [{
                role: 'user',
                parts: [{ 
                    text: `DATA MENTAH DARI DATABASE SISTEM:\n${JSON.stringify(rawData, null, 2)}\n\nPERMINTAAN SPESIFIK PENGGUNA:\n"${userQuery}"\n\nINSTRUKSI: Sebagai sub-agen khusus, analisislah data di atas untuk menjawab permintaan pengguna. Berikan jawaban yang siap diteruskan oleh Koordinator.` 
                }]
            }]
        });
        return response.text || "Sub-agen gagal memproses analisis.";
    } catch (e) {
        console.error(`Sub-agent ${agentType} failed to think:`, e);
        return "Gagal melakukan analisis cerdas. Mengembalikan data mentah.";
    }
  }

  // Execute the agent logic based on the tool call
  private async executeLocalTool(name: string, args: any): Promise<{ result: any, agentType: AgentType }> {
    await delay(1000); // Simulate network fetch

    // Common Extraction (Simple mock regex for NIK)
    const userQuery = args.permintaan_pengguna;
    const nikMatch = userQuery.match(/(\d{10,})/) || userQuery.match(/3273/); // Relaxed matching for demo
    const patientKey = nikMatch ? "3273xxxxxxxxxx" : "default";
    const patientData = MOCK_PATIENT_DB[patientKey];

    let agentType: AgentType;
    let relevantData: any;

    switch (name) {
      case "panggil_sub_agen_rekam_medis":
        agentType = AgentType.MEDICAL_RECORDS;
        // The agent only sees medical data
        relevantData = patientData.medical_history ? {
             name: patientData.biodata?.name, 
             ...patientData.medical_history 
        } : patientData;
        break;

      case "panggil_sub_agen_manajemen_pasien":
        agentType = AgentType.PATIENT_MANAGEMENT;
        relevantData = patientData.biodata || patientData;
        break;

      case "panggil_sub_agen_penjadwal":
        agentType = AgentType.APPOINTMENT;
        relevantData = patientData.appointments || { message: "No appointments found" };
        break;

      case "panggil_sub_agen_penagihan":
        agentType = AgentType.BILLING;
        relevantData = patientData.billing || { message: "Billing data unavailable" };
        break;

      default:
        throw new Error("Unknown tool called");
    }

    // --- MAXIMIZING SUB-AGENT: Run a dedicated LLM call for the sub-agent ---
    // This allows the sub-agent to format, filter, and explain the data specifically for the query.
    const analysis = await this.generateSubAgentAnalysis(agentType, relevantData, userQuery);

    return {
        agentType,
        result: {
            status: "SUCCESS",
            agent_analysis: analysis, // The "Smart" output
            source_data_snapshot: relevantData // The "Raw" proof
        }
    };
  }

  async sendMessage(
    history: { role: string; parts: { text: string }[] }[],
    newMessage: string,
    onToolStart: (toolName: string) => void,
    onToolComplete: (result: ToolCallResult, agentType: AgentType) => void
  ) {
    try {
      // 1. Send message to Coordinator
      const result = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
            ...history.map(h => ({ role: h.role, parts: h.parts })), // Previous context
            { role: 'user', parts: [{ text: newMessage }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools,
          temperature: 0, // Strict adherence
        },
      });

      // 2. Check for tool calls (Delegation)
      const toolCalls = result.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);

      if (toolCalls && toolCalls.length > 0) {
        const functionCall = toolCalls[0].functionCall!;
        const toolName = functionCall.name;
        const toolArgs = functionCall.args;

        // UI callback: Coordinator has decided to delegate
        onToolStart(toolName);

        // 3. Execute the Sub-agent (NOW WITH AI INTELLIGENCE)
        const { result: toolOutput, agentType } = await this.executeLocalTool(toolName, toolArgs);

        // UI callback: Sub-agent finished
        onToolComplete({ toolName, result: toolOutput }, agentType);

        // 4. Send result back to Coordinator for final synthesis
        const result2 = await this.client.models.generateContent({
            model: this.modelName,
            contents: [
                ...history.map(h => ({ role: h.role, parts: h.parts })),
                { role: 'user', parts: [{ text: newMessage }] },
                result.candidates![0].content, // The assistant's tool call
                {
                    role: 'function',
                    parts: [{
                        functionResponse: {
                            name: toolName,
                            response: { result: toolOutput } // Coordinator sees both analysis and raw data
                        }
                    }]
                }
            ],
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });

        return {
          text: result2.text || "Delegasi selesai.",
          toolUsed: toolName,
          agentType: agentType
        };

      } else {
        return {
          text: result.text || "Maaf, saya tidak dapat memproses permintaan tanpa pendelegasian yang valid.",
          toolUsed: null,
          agentType: AgentType.COORDINATOR
        };
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
}