import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedKeyword } from "../types";

const SYSTEM_INSTRUCTION = `
Bạn là một chuyên gia SEO và NLP. Nhiệm vụ của bạn là phân tích danh sách từ khóa được cung cấp.
Với mỗi từ khóa, bạn cần thực hiện:
1. "cluster": Gom nhóm từ khóa này vào một chủ đề ngữ nghĩa (Semantic Cluster) ngắn gọn (ví dụ: "Giày dép", "Công nghệ", "Review", v.v.). Dùng Tiếng Việt cho tên Cluster.
2. "isEnglish": Xác định xem từ khóa này có phải hoàn toàn là tiếng Anh hay không (true/false).
3. "isBrand": Xác định xem từ khóa này có chứa tên thương hiệu (Brand Name) cụ thể hay không (ví dụ: Nike, Samsung, Shopee).
4. "intent": Xác định ý định tìm kiếm (Navigational, Informational, Transactional, Commercial).

Trả về định dạng JSON thuần túy.
`;

export const analyzeKeywordsBatch = async (keywords: string[]): Promise<AnalyzedKeyword[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Process in chunks to avoid token limits if the list is long, 
  // but for this function we assume the caller handles chunking or the list is < 50 items.
  
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
      const data = JSON.parse(response.text) as AnalyzedKeyword[];
      return data;
    }
    return [];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return empty array or throw depending on desired resilience
    // Returning dummy objects for failed items is another strategy, but let's throw to inform UI
    throw error;
  }
};
