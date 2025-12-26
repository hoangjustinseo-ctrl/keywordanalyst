import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isLoading) return;
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        onFileUpload(file);
      } else {
        alert("Vui lòng tải lên file .csv hoặc .xlsx");
      }
    },
    [onFileUpload, isLoading]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
        ${isLoading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white border-blue-300 hover:border-blue-500 hover:bg-blue-50'}
      `}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept=".csv, .xlsx, .xls"
        onChange={handleChange}
        disabled={isLoading}
      />
      
      <div className="bg-blue-100 p-4 rounded-full mb-4">
        {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        ) : (
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {isLoading ? "Đang xử lý dữ liệu..." : "Tải lên file từ khóa"}
      </h3>
      
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        Kéo thả file .csv hoặc .xlsx vào đây, hoặc click để chọn file từ máy tính.
      </p>

      {!isLoading && (
        <label
          htmlFor="fileInput"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          Chọn file
        </label>
      )}
      
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <AlertCircle size={14} />
        <span>Hỗ trợ định dạng CSV, Excel (XLSX)</span>
      </div>
    </div>
  );
};

export default FileUpload;
