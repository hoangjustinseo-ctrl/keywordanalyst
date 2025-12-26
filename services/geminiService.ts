import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedKeyword } from "../types";

// Khai báo kiểu dữ liệu cho process.env để TypeScript không báo lỗi trong môi trường Vite/Browser
declare const process: {
  env: {
    API_KEY?: string;
  }
};

const SYSTEM_INSTRUCTION = `
Bạn là một chuyên gia SEO và NLP. Nhiệm vụ của bạn là phân tích danh sách từ khóa được cung cấp.
Với mỗi từ khóa, bạn cần thực hiện:
1. "cluster": Gom nhóm từ khóa này vào một chủ đề ngữ nghĩa (Semantic Cluster) ngắn gọn (ví dụ: "Giày dép", "Công nghệ", "Review", v.v.). Dùng Tiếng Việt cho tên Cluster.
2. "isEnglish": Xác định xem từ khóa này có phải hoàn toàn là tiếng Anh hay không (true/false).
3. "isBrand": Xác định xem từ khóa này có chứa tên thương hiệu (Brand Name) cụ thể hay không (ví dụ: Nike, Samsung, Shopee).
4. "intent": Xác định ý định tìm kiếm (Navigational, Informational, Transactional, Commercial).

Trả về định dạng JSON thuần túy, không dùng Markdown block.
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeKeywordsBatch = async (keywords: string[], retries = 3): Promise<AnalyzedKeyword[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Phân tích danh sách từ khóa sau đây: ${JSON.stringify(keywords)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              cluster: { type: Type.STRING },
              isEnglish: { type: Type.BOOLEAN },
              isBrand: { type: Type.BOOLEAN },
              intent: { 
                type: Type.STRING, 
                enum: ['Navigational', 'Informational', 'Transactional', 'Commercial', 'Unknown'] 
              }
            },
            required: ["original", "cluster", "isEnglish", "isBrand", "intent"]
          }
        }
      }
    });

    if (response.text) {
        // Clean up markdown syntax if model includes it despite instruction
        let cleanText = response.text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
        }
        
        try {
            const data = JSON.parse(cleanText) as AnalyzedKeyword[];
            return data;
        } catch (jsonError) {
            console.error("Failed to parse JSON from Gemini:", cleanText);
            // If parsing fails, we might want to return dummy data or throw
            // For now, throw so retry might happen if it was a weird glitch, or parent catches it
            throw new Error("Invalid JSON response from AI");
        }
    }
    return [];

  } catch (error: any) {
    // Handle Rate Limiting (429)
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
        if (retries > 0) {
            console.warn(`Rate limit hit. Retrying in ${(4 - retries) * 2} seconds...`);
            await wait((4 - retries) * 2000); // Exponential backoff: 2s, 4s, 6s
            return analyzeKeywordsBatch(keywords, retries - 1);
        }
    }
    
    console.error("Gemini Analysis Error:", error);
    // If we ran out of retries or it's another error, throw it up
    throw error;
  }
};