import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { apiService } from '../services/apiService';
import { WorkLog, WorkStatus } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const ReportsPage: React.FC = () => {
  const { auth } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportLogs, setReportLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    generateReport();
  }, [selectedMonth, selectedYear]);

  const generateReport = async () => {
    setLoading(true);
    // Period: 26th of prev month to 25th of current month
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    try {
      const allLogs = await apiService.getAllLogs();
      
      const filtered = allLogs.filter(l => {
          if (l.username !== auth.user?.username) return false;
          const d = new Date(l.date);
          const day = d.getDate();
          const m = d.getMonth() + 1;
          const y = d.getFullYear();

          const logDate = new Date(y, m - 1, day);
          const startDate = new Date(prevYear, prevMonth - 1, 26);
          const endDate = new Date(selectedYear, selectedMonth - 1, 25);

          return logDate >= startDate && logDate <= endDate;
      });

      setReportLogs(filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      console.error("Report Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthName = months[selectedMonth - 1].toUpperCase();

  const logChunks = reportLogs.length > 0 ? chunkArray(reportLogs, 10) : [[]];

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      for (let index = 0; index < logChunks.length; index++) {
        const pageElement = document.getElementById(`report-document-page-${index}`);
        if (!pageElement) continue;

        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');

        if (index > 0) {
          pdf.addPage('a4', 'landscape');
        }

        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      }

      pdf.save(`Wassan_Work_Report_${auth.user?.username || 'User'}_${currentMonthName}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Error occurred while generating PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Controls - Hidden on print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 no-print gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Work Done Report</h1>
          <p className="text-slate-500 italic">Generate your monthly work summary for submission.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className={`px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center ${downloading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <i className="fas fa-file-pdf mr-2 text-xl"></i> {downloading ? 'Generating PDF...' : 'Download Report PDF (Landscape)'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 no-print">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* DOCUMENT VIEW - Exact Replica of User Requirement in Landscape */}
      <div className="w-full overflow-x-auto py-4 flex flex-col items-center gap-8 bg-slate-100 p-6 rounded-3xl border border-slate-200">
        {logChunks.map((chunk, index) => (
          <div 
            key={index}
            id={`report-document-page-${index}`}
            className="bg-white p-12 border shadow-2xl print:shadow-none print:border-none print-area mx-auto text-black relative font-sans"
            style={{ 
              width: '297mm', 
              height: '210mm', 
              minHeight: '210mm', 
              maxHeight: '210mm', 
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Top Container for Header, Info, Table */}
            <div>
              {/* Logo and Main Header */}
              <div className="relative mb-6 pt-2 select-none flex items-center justify-center">
                <div className="absolute left-0 top-0">
                   <img 
                    src="https://www.wassan.org/wp-content/uploads/2021/11/wassan-logo.png" 
                    alt="WASSAN" 
                    className="h-16 w-auto object-contain"
                    referrerPolicy="no-referrer"
                   />
                </div>
                <div className="text-center pt-2 border-b-2 border-slate-800 pb-2 w-full">
                   <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
                     MONTHLY WORK DONE REPORT
                   </h1>
                </div>
              </div>

              {/* Info Grid - Standard Office Layout with Perfect Bottom Align Underline */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6 text-[13px] select-none">
                <div className="flex items-end min-h-[30px]">
                  <span className="font-bold w-36 uppercase text-slate-700 pb-1">NAME:</span>
                  <span className="border-b border-black flex-1 px-2 pb-1 font-semibold text-slate-900 min-h-[24px]">
                    {auth.user?.username || '-'}
                  </span>
                </div>
                <div className="flex items-end min-h-[30px]">
                  <span className="font-bold w-40 uppercase text-slate-700 pb-1">REPORTING MONTH:</span>
                  <span className="border-b border-black flex-1 px-2 pb-1 font-semibold text-slate-900 min-h-[24px]">
                    {currentMonthName} {selectedYear}
                  </span>
                </div>
                <div className="flex items-end min-h-[30px]">
                  <span className="font-bold w-36 uppercase text-slate-700 pb-1">DESIGNATION:</span>
                  <span className="border-b border-black flex-1 px-2 pb-1 font-semibold text-slate-900 min-h-[24px]">
                    {auth.user?.role || '-'}
                  </span>
                </div>
                <div className="flex items-end min-h-[30px]">
                  <span className="font-bold w-36 uppercase text-slate-700 pb-1">LOCATION:</span>
                  <span className="border-b border-black flex-1 px-2 pb-1 font-semibold text-slate-900 uppercase min-h-[24px]">
                    VIKARABAD
                  </span>
                </div>
              </div>

              {/* Report Table */}
              <div className="w-full">
                <table className="report-table border-2 border-black text-slate-900">
                  <thead>
                    <tr className="bg-slate-100 select-none">
                      <th className="w-[60px] text-center border-2 border-black py-2 px-2 font-black text-[11px]">S.NO</th>
                      <th className="w-[120px] text-center border-2 border-black py-2 px-2 font-black text-[11px]">DATE</th>
                      <th className="w-[150px] border-2 border-black py-2 px-2 font-black text-[11px]">VILLAGE</th>
                      <th className="w-[180px] border-2 border-black py-2 px-2 font-black text-[11px]">ACTIVITY</th>
                      <th className="border-2 border-black py-2 px-2 font-black text-[11px]">WORK DONE DETAILS</th>
                    </tr>
                  </thead>
                  <tbody className="telugu-font text-[11px]">
                    {chunk.length > 0 ? chunk.map((log, i) => (
                      <tr key={i} className="h-9">
                        <td className="text-center border border-black py-1 px-2 font-semibold select-none">
                          {index * 10 + i + 1}
                        </td>
                        <td className="text-center border border-black py-1 px-2 select-none">
                          {new Date(log.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="border border-black py-1 px-2 uppercase font-medium">{log.village || '-'}</td>
                        <td className="border border-black py-1 px-2 font-semibold text-indigo-900">{log.activity || '-'}</td>
                        <td className="border border-black py-1 px-2 leading-relaxed">
                          {log.status === WorkStatus.WORKING ? log.workDetails : `[${log.status.toUpperCase()}] ${log.reason}`}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 italic border border-black text-xs select-none">
                          {loading ? 'Processing data...' : 'No entries found for this reporting period.'}
                        </td>
                      </tr>
                    )}
                    {/* Fill remaining space to match the physical document look perfectly (10 rows limit) */}
                    {chunk.length < 10 && Array.from({ length: 10 - chunk.length }).map((_, i) => (
                      <tr key={`blank-${i}`} className="h-9">
                        <td className="border border-black select-none"></td>
                        <td className="border border-black select-none"></td>
                        <td className="border border-black select-none"></td>
                        <td className="border border-black select-none"></td>
                        <td className="border border-black select-none"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Container for Signatures / Footers */}
            <div>
              {/* Footer Signature Section */}
              <div className="flex justify-between px-8 border-t border-slate-100 pt-4 select-none">
                <div className="w-64 text-center border-t border-black pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Employee Signature</span>
                </div>
                <div className="w-64 text-center border-t border-black pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Authorized Signatory</span>
                </div>
              </div>

              <div className="mt-4 text-[9px] text-center text-slate-400 uppercase tracking-widest select-none">
                This is a computer-generated report | Wassan Vikarabad Operations | {new Date().toLocaleString('en-GB')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;