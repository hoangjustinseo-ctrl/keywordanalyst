import React, { useState } from 'react';
import { AppStatus, AnalyzedKeyword } from './types';
import { parseFile } from './utils/fileHelpers';
import { analyzeKeywordsBatch } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { BrainCircuit, Key } from 'lucide-react';

// Chunk size for Gemini Batching
const BATCH_SIZE = 30;
// Limit total processed for demo to prevent excessive API usage in this environment
const MAX_KEYWORDS_LIMIT = 200; 

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [data, setData] = useState<AnalyzedKeyword[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processKeywords = async (keywords: string[]) => {
    setStatus(AppStatus.ANALYZING);
    setErrorMsg(null);
    const limitedKeywords = keywords.slice(0, MAX_KEYWORDS_LIMIT);
    const results: AnalyzedKeyword[] = [];
    
    // Chunking
    const totalBatches = Math.ceil(limitedKeywords.length / BATCH_SIZE);
    
    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = limitedKeywords.slice(start, end);
        
        // Update progress UI
        setProgress(Math.round(((i) / totalBatches) * 100));
        
        const batchResults = await analyzeKeywordsBatch(batch);
        results.push(...batchResults);
        
        // Small delay to be gentle on rate limits (optional but good practice)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setData(results);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng kiểm tra API Key.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleFileUpload = async (file: File) => {
    setStatus(AppStatus.PARSING);
    try {
      const keywords = await parseFile(file);
      if (keywords.length === 0) {
        throw new Error("Không tìm thấy từ khóa nào trong file.");
      }
      await processKeywords(keywords);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi đọc file.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setData([]);
    setStatus(AppStatus.IDLE);
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-lg">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                  KeywordSense AI
                </h1>
                <span className="text-xs text-gray-500 font-medium">Powered by Gemini 2.5</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
             <span>{errorMsg}</span>
             <button onClick={() => setErrorMsg(null)} className="text-sm underline hover:text-red-900">Đóng</button>
          </div>
        )}

        {/* Content Switcher */}
        {status === AppStatus.IDLE || status === AppStatus.PARSING || status === AppStatus.ERROR ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Phân tích ngữ nghĩa từ khóa tự động</h2>
              <p className="text-gray-600 text-lg">
                Tải lên danh sách từ khóa của bạn để tự động phân nhóm, phát hiện thương hiệu và lọc ngôn ngữ bằng trí tuệ nhân tạo.
              </p>
            </div>
            
            <FileUpload 
              onFileUpload={handleFileUpload} 
              isLoading={status === AppStatus.PARSING} 
            />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="font-semibold text-blue-600 mb-1">Semantic Clustering</div>
                    <div className="text-xs text-gray-500">Gom nhóm từ khóa theo ý nghĩa thực tế</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="font-semibold text-purple-600 mb-1">Brand Detection</div>
                    <div className="text-xs text-gray-500">Tự động phát hiện tên thương hiệu</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="font-semibold text-orange-600 mb-1">Language Filter</div>
                    <div className="text-xs text-gray-500">Nhận diện Tiếng Anh / Tiếng Việt</div>
                </div>
            </div>
          </div>
        ) : status === AppStatus.ANALYZING ? (
            <div className="max-w-2xl mx-auto mt-20 text-center">
                <div className="mb-8 relative pt-4">
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="mt-4 text-gray-600 font-medium">Đang phân tích dữ liệu với Gemini AI... {progress}%</div>
                    <p className="text-sm text-gray-400 mt-2">Đang xử lý ngữ nghĩa, vui lòng đợi trong giây lát.</p>
                </div>
                <div className="animate-pulse flex justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-400"></div>
                </div>
            </div>
        ) : (
          <Dashboard data={data} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;
