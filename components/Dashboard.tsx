import React, { useState, useMemo } from 'react';
import { AnalyzedKeyword } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Download, Filter, Search, Tag, Globe, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardProps {
  data: AnalyzedKeyword[];
  onReset: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<'all' | 'brand' | 'non-brand'>('all');
  const [filterLang, setFilterLang] = useState<'all' | 'vietnamese' | 'english'>('all');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.original.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.cluster.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = filterBrand === 'all' 
        ? true 
        : filterBrand === 'brand' ? item.isBrand : !item.isBrand;

      const matchesLang = filterLang === 'all'
        ? true
        : filterLang === 'english' ? item.isEnglish : !item.isEnglish;

      const matchesCluster = selectedCluster === 'all' ? true : item.cluster === selectedCluster;

      return matchesSearch && matchesBrand && matchesLang && matchesCluster;
    });
  }, [data, searchTerm, filterBrand, filterLang, selectedCluster]);

  // Statistics
  const stats = useMemo(() => {
    const clusterCounts: Record<string, number> = {};
    const intentCounts: Record<string, number> = {};
    
    data.forEach(item => {
      clusterCounts[item.cluster] = (clusterCounts[item.cluster] || 0) + 1;
      intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
    });

    const clusters = Object.entries(clusterCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const intents = Object.entries(intentCounts)
      .map(([name, value]) => ({ name, value }));

    return { clusters, intents };
  }, [data]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analysis");
    XLSX.writeFile(wb, "keyword_analysis_export.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Kết quả phân tích</h2>
          <p className="text-sm text-gray-500">Đã tìm thấy {data.length} từ khóa trong {stats.clusters.length} nhóm chủ đề</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onReset}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
                Tải file khác
            </button>
            <button 
                onClick={exportExcel}
                className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
            >
                <Download size={16} /> Xuất Excel
            </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cluster Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-blue-500"/> Phân bố chủ đề (Top 8)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.clusters.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {stats.clusters.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intent Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
             <Search size={20} className="text-purple-500"/> Ý định tìm kiếm
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.intents}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.intents.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Tìm kiếm từ khóa..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value as any)}
            >
                <option value="all">Tất cả thương hiệu</option>
                <option value="brand">Chứa Brand</option>
                <option value="non-brand">Không chứa Brand</option>
            </select>

            <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value as any)}
            >
                <option value="all">Tất cả ngôn ngữ</option>
                <option value="vietnamese">Tiếng Việt / Khác</option>
                <option value="english">Tiếng Anh</option>
            </select>

             <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
            >
                <option value="all">Tất cả chủ đề</option>
                {stats.clusters.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.value})</option>
                ))}
            </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Từ khóa gốc</th>
                        <th className="px-6 py-4">Chủ đề (Cluster)</th>
                        <th className="px-6 py-4">Ý định</th>
                        <th className="px-6 py-4">Thuộc tính</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredData.length > 0 ? (
                        filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 font-medium text-gray-800">{item.original}</td>
                                <td className="px-6 py-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {item.cluster}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-gray-600">{item.intent}</td>
                                <td className="px-6 py-3 flex gap-2">
                                    {item.isBrand && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                            <Tag size={10} /> Brand
                                        </span>
                                    )}
                                    {item.isEnglish && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                            <Globe size={10} /> English
                                        </span>
                                    )}
                                    {!item.isBrand && !item.isEnglish && (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                Không tìm thấy dữ liệu phù hợp với bộ lọc
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-right">
            Hiển thị {filteredData.length} kết quả
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
