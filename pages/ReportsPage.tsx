import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { apiService } from '../services/apiService';
import { WorkLog, WorkStatus } from '../types';

const ReportsPage: React.FC = () => {
  const { auth } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportLogs, setReportLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handlePrint = () => {
    window.print();
  };

  const currentMonthName = months[selectedMonth - 1].toUpperCase();

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
            onClick={handlePrint}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center"
          >
            <i className="fas fa-file-pdf mr-2 text-xl"></i> Download PDF / Print
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

      {/* DOCUMENT VIEW - Exact Replica of User Requirement */}
      <div className="bg-white p-12 border shadow-2xl print:shadow-none print:border-none print-area mx-auto max-w-[210mm] min-h-[297mm] text-black">
        {/* Logo and Main Header */}
        <div className="relative mb-8 pt-4">
          <div className="absolute left-0 top-0">
             <img 
              src="https://www.wassan.org/wp-content/uploads/2021/11/wassan-logo.png" 
              alt="WASSAN" 
              className="h-24 w-auto object-contain"
             />
          </div>
          <div className="text-center pt-6 border-b-2 border-slate-800 pb-2 ml-24">
             <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
               MONTHLY WORK DONE REPORT - {currentMonthName} {selectedYear}
             </h1>
          </div>
        </div>

        {/* Info Grid - Standard Office Layout */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-[14px]">
          <div className="flex items-center">
            <span className="font-bold w-32 uppercase">NAME:</span>
            <span className="border-b border-black flex-1 px-2 font-medium">{auth.user?.username || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold w-32 uppercase">Date:</span>
            <span className="border-b border-black flex-1 px-2 font-medium">{new Date().toLocaleDateString('en-GB')}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold w-32 uppercase">Designation:</span>
            <span className="border-b border-black flex-1 px-2 font-medium">{auth.user?.role || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold w-32 uppercase">LOCATION:</span>
            <span className="border-b border-black flex-1 px-2 font-medium uppercase">VIKARABAD</span>
          </div>
        </div>

        {/* Report Table */}
        <div className="w-full">
          <table className="report-table border-2 border-black">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-[60px] text-center border-2 border-black py-3 px-2 font-black text-xs">S.NO</th>
                <th className="w-[120px] text-center border-2 border-black py-3 px-2 font-black text-xs">DATE</th>
                <th className="w-[150px] border-2 border-black py-3 px-2 font-black text-xs">village</th>
                <th className="w-[180px] border-2 border-black py-3 px-2 font-black text-xs">Activity</th>
                <th className="border-2 border-black py-3 px-2 font-black text-xs">WORK DONE DETAILS</th>
              </tr>
            </thead>
            <tbody className="telugu-font">
              {reportLogs.length > 0 ? reportLogs.map((log, i) => (
                <tr key={i} className="min-h-[40px]">
                  <td className="text-center border border-black py-2 px-2 font-bold">{i + 1}</td>
                  <td className="text-center border border-black py-2 px-2">
                    {new Date(log.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="border border-black py-2 px-2 uppercase text-[11px]">{log.village || '-'}</td>
                  <td className="border border-black py-2 px-2 text-[11px] font-semibold">{log.activity || '-'}</td>
                  <td className="border border-black py-2 px-2 text-[11px] leading-relaxed">
                    {log.status === WorkStatus.WORKING ? log.workDetails : `[${log.status.toUpperCase()}] ${log.reason}`}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 italic border border-black">
                    {loading ? 'Processing data...' : 'No entries found for this reporting period.'}
                  </td>
                </tr>
              )}
              {/* Fill remaining space to match the physical document look */}
              {reportLogs.length < 15 && Array.from({ length: 15 - reportLogs.length }).map((_, i) => (
                <tr key={`blank-${i}`} className="h-10">
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Section */}
        <div className="mt-20 flex justify-between px-8">
          <div className="w-64 text-center border-t border-black pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Employee Signature</span>
          </div>
          <div className="w-64 text-center border-t border-black pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</span>
          </div>
        </div>

        <div className="mt-16 text-[9px] text-center text-slate-500 uppercase tracking-widest print:block hidden">
          This is a computer-generated report | Wassan Vikarabad Operations | {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;