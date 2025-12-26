import * as XLSX from 'xlsx';
import { RawRow } from '../types';

export const parseFile = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<RawRow>(worksheet, { header: 1 });
        
        // Flatten and extract likely keyword column
        // Logic: Find the first column that looks like text. 
        // For simplicity, we assume the first column contains keywords if no header is selected.
        // Or we flatten the first non-empty column.
        
        const keywords: string[] = [];
        
        if (jsonData.length > 0) {
            // Check rows
            for(let i=0; i<jsonData.length; i++) {
                const row = jsonData[i] as any[];
                if (row && row.length > 0) {
                    // Grab the first cell that is a string
                    const val = row[0]; 
                    if (typeof val === 'string' && val.trim().length > 0) {
                        keywords.push(val.trim());
                    }
                }
            }
        }

        // Limit for demo purposes to avoid blowing up tokens immediately if file is huge
        // In prod, you'd implement pagination or background processing.
        resolve(keywords); 
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
