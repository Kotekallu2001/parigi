import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Sprout, 
  TrendingUp, 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  Database,
  Grid,
  FileSpreadsheet,
  AlertCircle,
  Coins,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

interface FarmerRecord {
  mandal: string;
  village: string;
  farmerName: string;
  fatherName: string;
  mobile: string;
  acres: number;
  season: string;
  financialYear: string;
  cropName: string;
  workingCost?: number;
  grossIncome?: number;
  netIncome?: number;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

const CropsDashboard: React.FC = () => {
  const [data, setData] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMandal, setSelectedMandal] = useState('All');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedFY, setSelectedFY] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination for farmers table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord | null>(null);

  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtnzCBmnEWEb3lVa-LvRgq55bLZ1qAhubiLpcpICOoYCk7_LeONAPbJ6fLbLLA9g/pub?gid=53221638&single=true&output=csv';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const rawText = await response.text();
      const records = parseFarmerCSV(rawText);
      setData(records);
    } catch (err: any) {
      console.error('Error loading crops spreadsheet data:', err);
      setError('Could not connect or parse published spreadsheet data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const parseFarmerCSV = (text: string): FarmerRecord[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    // Header structure standard check
    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Find column positions dynamically to adapt to potential column swaps
    // Standard columns: Mandal Name, Village Name, Farmer Name, Father's Name, Mobile Number, Acres, Season, Financial Year, Crop name
    const getColIndex = (keywords: string[]) => {
      return rawHeaders.findIndex(header => 
        keywords.some(keyword => header.toLowerCase().includes(keyword.toLowerCase()))
      );
    };

    const mandalIdx = getColIndex(['mandal']);
    const villageIdx = getColIndex(['village']);
    const farmerIdx = getColIndex(['farmer name', 'farmer_name']);
    const fatherIdx = getColIndex(['father', 'father\'s name']);
    const mobileIdx = getColIndex(['mobile', 'phone']);
    const acresIdx = getColIndex(['acres', 'acre']);
    const seasonIdx = getColIndex(['season']);
    const fyIdx = getColIndex(['financial', 'year', 'fy']);
    const cropIdx = getColIndex(['crop name', 'crop_name', 'crop']);
    const workingCostIdx = getColIndex(['working cost', 'working_cost']);
    const grossIncomeIdx = getColIndex(['gross income', 'gross_income', 'grossincome']);
    const netIncomeIdx = getColIndex(['net income', 'net_income', 'netincome']);

    const list: FarmerRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle standard commas inside quotes correctly
      const values: string[] = [];
      let currentVal = '';
      let insideQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      // Read values based on resolved column indices or simple default order if indexes are missing
      const mandal = values[mandalIdx !== -1 ? mandalIdx : 0] || '';
      const village = values[villageIdx !== -1 ? villageIdx : 1] || '';
      const farmerName = values[farmerIdx !== -1 ? farmerIdx : 2] || '';
      const fatherName = values[fatherIdx !== -1 ? fatherIdx : 3] || '';
      const mobile = values[mobileIdx !== -1 ? mobileIdx : 4] || '';
      const acresRaw = values[acresIdx !== -1 ? acresIdx : 5] || '0';
      const season = values[seasonIdx !== -1 ? seasonIdx : 6] || '';
      const financialYear = values[fyIdx !== -1 ? fyIdx : 7] || '';
      const cropName = values[cropIdx !== -1 ? cropIdx : 8] || '';

      const workingCostRaw = workingCostIdx !== -1 ? values[workingCostIdx] : undefined;
      const grossIncomeRaw = grossIncomeIdx !== -1 ? values[grossIncomeIdx] : undefined;
      const netIncomeRaw = netIncomeIdx !== -1 ? values[netIncomeIdx] : undefined;

      const acres = parseFloat(acresRaw.replace(/[^\d.]/g, '')) || 0;

      const parseNumericField = (val?: string): number | undefined => {
        if (!val) return undefined;
        const cleaned = val.replace(/[^\d.-]/g, '');
        if (!cleaned) return undefined;
        const num = parseFloat(cleaned);
        return isNaN(num) ? undefined : num;
      };

      const workingCost = parseNumericField(workingCostRaw);
      const grossIncome = parseNumericField(grossIncomeRaw);
      const netIncome = parseNumericField(netIncomeRaw);

      if (farmerName && mandal) {
        list.push({
          mandal: mandal.trim().toUpperCase(),
          village: village.trim().toUpperCase(),
          farmerName: farmerName.trim(),
          fatherName: fatherName.trim(),
          mobile: mobile.trim(),
          acres,
          season: season.trim() || 'Kharif',
          financialYear: financialYear.trim() || '2024-25',
          cropName: cropName.trim() || 'Paddy',
          workingCost,
          grossIncome,
          netIncome
        });
      }
    }

    return list;
  };

  // Reset page when any filter triggers
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMandal, selectedVillage, selectedCrop, selectedSeason, selectedFY, searchQuery]);

  // Unique Lists for dynamic dropdown binding
  const mandals = Array.from(new Set(data.map(d => d.mandal))).filter(Boolean).sort();
  
  // Village list is dynamically filtered depending on Mandal chosen!
  const villages = Array.from(
    new Set(
      data
        .filter(d => selectedMandal === 'All' || d.mandal === selectedMandal)
        .map(d => d.village)
    )
  ).filter(Boolean).sort();

  const crops = Array.from(new Set(data.map(d => d.cropName))).filter(Boolean).sort();
  const seasons = Array.from(new Set(data.map(d => d.season))).filter(Boolean).sort();
  const financialYears = Array.from(new Set(data.map(d => d.financialYear))).filter(Boolean).sort();

  // Reset selected village if it is no longer valid for selected mandal
  useEffect(() => {
    if (selectedVillage !== 'All') {
      const isValid = data.some(
        d => (selectedMandal === 'All' || d.mandal === selectedMandal) && d.village === selectedVillage
      );
      if (!isValid) {
        setSelectedVillage('All');
      }
    }
  }, [selectedMandal]);

  // Apply filters to dataset
  const filteredData = data.filter(d => {
    const matchesMandal = selectedMandal === 'All' || d.mandal === selectedMandal;
    const matchesVillage = selectedVillage === 'All' || d.village === selectedVillage;
    const matchesCrop = selectedCrop === 'All' || d.cropName.toLowerCase() === selectedCrop.toLowerCase();
    const matchesSeason = selectedSeason === 'All' || d.season.toLowerCase() === selectedSeason.toLowerCase();
    const matchesFY = selectedFY === 'All' || d.financialYear.toLowerCase() === selectedFY.toLowerCase();
    
    const term = searchQuery.toLowerCase();
    const matchesSearch = !term || 
      d.farmerName.toLowerCase().includes(term) ||
      d.fatherName.toLowerCase().includes(term) ||
      d.mobile.includes(term) ||
      d.village.toLowerCase().includes(term) ||
      d.mandal.toLowerCase().includes(term);

    return matchesMandal && matchesVillage && matchesCrop && matchesSeason && matchesFY && matchesSearch;
  });

  // KPI Calculations
  const stats = {
    totalFarmers: filteredData.length,
    totalAcres: filteredData.reduce((acc, curr) => acc + curr.acres, 0),
    avgAcres: filteredData.length > 0 ? (filteredData.reduce((acc, curr) => acc + curr.acres, 0) / filteredData.length) : 0,
    uniqueVillagesCount: new Set(filteredData.map(f => f.village)).size,
  };

  // Recharts aggregation 1: Land acreage by Mandal
  const mandalAcreageMap = new Map<string, number>();
  filteredData.forEach(d => {
    mandalAcreageMap.set(d.mandal, (mandalAcreageMap.get(d.mandal) || 0) + d.acres);
  });
  const mandalAcreageData = Array.from(mandalAcreageMap.entries())
    .map(([name, acres]) => ({ name, acres: parseFloat(acres.toFixed(2)) }))
    .sort((a, b) => b.acres - a.acres);

  // Recharts aggregation 2: Crop Area distribution
  const cropAcreageMap = new Map<string, number>();
  filteredData.forEach(d => {
    cropAcreageMap.set(d.cropName, (cropAcreageMap.get(d.cropName) || 0) + d.acres);
  });
  const cropAcreageData = Array.from(cropAcreageMap.entries())
    .map(([name, acres]) => ({ name, value: parseFloat(acres.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  // Pagination processing
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatAcres = (val: number) => {
    return val.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Ac';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center font-sans capitalize">
            <Sprout className="mr-2 h-6 w-6 text-indigo-600" /> {selectedCrop === 'All' ? 'Crops & Farmers' : `${selectedCrop.toLowerCase()} Farmers`} Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Analyzing {selectedCrop === 'All' ? 'cultivation' : selectedCrop.toLowerCase() + ' cultivation'} area, farmers lists, and crop metrics across blocks.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-all bg-white"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Sheet</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-white rounded-3xl border shadow-xs">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Syncing live spreadsheet database...</p>
            <p className="text-xs text-slate-400 mt-1">Collecting rows from real-time farmer rosters</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="h-12 w-12 text-rose-600 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-900">Spreadsheet Fetch Failed</h3>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Try Reconnecting
          </button>
        </div>
      ) : (
        <>
          {/* Advanced Filter Panel */}
          <div className="bg-white rounded-2xl border shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2 text-slate-700">
              <Filter className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Dynamic Segmentation Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Search Farmers / GPs
                </label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Farmer name or mobile..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Mandal Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mandal Name
                </label>
                <select
                  value={selectedMandal}
                  onChange={(e) => setSelectedMandal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50/50"
                >
                  <option value="All">All Mandals ({mandals.length})</option>
                  {mandals.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Village Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Village Name ({selectedMandal !== 'All' ? 'filtered' : 'all'})
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50/50"
                >
                  <option value="All">All Villages ({villages.length})</option>
                  {villages.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Crop Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cultivating Crop
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50/50"
                >
                  <option value="All">All Crops ({crops.length})</option>
                  {crops.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Season Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Season
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50/50"
                >
                  <option value="All">All Seasons ({seasons.length})</option>
                  {seasons.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Financial Year Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Financial Year
                </label>
                <select
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50/50"
                >
                  <option value="All">All Years ({financialYears.length})</option>
                  {financialYears.map(fy => (
                    <option key={fy} value={fy}>{fy}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Clear Pill button if active filters exist */}
            {(selectedMandal !== 'All' || selectedVillage !== 'All' || selectedCrop !== 'All' || selectedSeason !== 'All' || selectedFY !== 'All' || searchQuery !== '') && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs font-semibold text-slate-400">
                  Showing <span className="font-bold text-slate-700">{filteredData.length}</span> of {data.length} total farmers registry rows
                </span>
                <button
                  onClick={() => {
                    setSelectedMandal('All');
                    setSelectedVillage('All');
                    setSelectedCrop('All');
                    setSelectedSeason('All');
                    setSelectedFY('All');
                    setSearchQuery('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Farmers */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div id="metric-total-farmers" className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  {stats.totalFarmers}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total {selectedCrop === 'All' ? 'Registered' : selectedCrop} Farmers
                </div>
              </div>
            </div>

            {/* Card 2: Total Registered Acres */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div id="metric-total-acres" className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  {stats.totalAcres.toFixed(1)} <span className="text-xs font-normal text-slate-500">Ac</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {selectedCrop === 'All' ? 'Cultivated Land Area' : `${selectedCrop} Cultivated Area`}
                </div>
              </div>
            </div>

            {/* Card 3: Avg Landholding Acres */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div id="metric-avg-landholding" className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  {stats.avgAcres.toFixed(2)} <span className="text-xs font-normal text-slate-500">Ac / Fm</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Landholding Ratio</div>
              </div>
            </div>

            {/* Card 4: Unique Villages Area */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="p-3.5 rounded-xl bg-orange-50 text-orange-600 flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div id="metric-active-villages" className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  {stats.uniqueVillagesCount}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Covered Village Units</div>
              </div>
            </div>
          </div>

          {/* Analytical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Mandal-wise Cultivation Area Breakdown (Bar) */}
            <div className="bg-white p-5 rounded-2xl border shadow-xs lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-600" /> {selectedCrop === 'All' ? 'Land Cultivation' : `${selectedCrop} Cultivation`} Acres by Mandal Group
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Sum of acres for active {selectedCrop === 'All' ? 'farmers' : `${selectedCrop.toLowerCase()} farmers`} per mandal division</p>
              </div>

              <div className="h-64 sm:h-72 w-full">
                {mandalAcreageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mandalAcreageData} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} unit=" Ac" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', fontSize: 11 }}
                      />
                      <Bar dataKey="acres" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        {mandalAcreageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">No chart data generated</div>
                )}
              </div>
            </div>

            {/* Chart 2: Variety Crop Density (Pie Chart) */}
            <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sprout className="h-4 w-4 text-emerald-500" /> crop variety land allocation
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Acreage division by categorized crop variety name</p>
              </div>

              <div className="h-64 sm:h-72 flex flex-col justify-between">
                <div className="h-48 w-full">
                  {cropAcreageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cropAcreageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {cropAcreageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">No chart data generated</div>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-2 scrollbar-thin">
                  {cropAcreageData.slice(0, 4).map((entry, idx) => (
                    <div key={entry.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="font-bold text-slate-700 truncate">{entry.name}</span>
                      </div>
                      <span className="text-slate-500 font-semibold">{entry.value} Ac</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Roster / Detail Table */}
          <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                  {selectedCrop === 'All' ? 'Farmers Detailed Roster' : `${selectedCrop} Farmers Detailed Roster`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Complete list of registered {selectedCrop === 'All' ? 'farmers' : `${selectedCrop.toLowerCase()} farmers`} matching selected criteria.</p>
              </div>

              <div className="bg-indigo-50 border text-indigo-700 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider self-start sm:self-auto flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Sheet Sync Active
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5 text-center">S.No</th>
                    <th className="py-3 px-4">Farmer Details</th>
                    <th className="py-3 px-4">Contact Number</th>
                    <th className="py-3 px-4">Mandal Division</th>
                    <th className="py-3 px-4">Village Name</th>
                    <th className="py-3 px-4">Acres Area</th>
                    <th className="py-3 px-4 text-right">Working Cost</th>
                    <th className="py-3 px-4 text-right">Gross Income</th>
                    <th className="py-3 px-4 text-right">Net Income</th>
                    <th className="py-3 px-4">Variety / season</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium whitespace-nowrap">
                  {paginatedData.map((record, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr 
                        key={index} 
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedFarmer(record)}
                      >
                        <td className="py-3 px-5 text-center font-bold text-slate-400">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate">
                          <div className="font-bold text-slate-800">{record.farmerName}</div>
                          <div className="text-[10px] text-slate-400">S/o: {record.fatherName || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {record.mobile ? (
                            <span className="bg-slate-100 hover:bg-slate-200 border text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider select-none">
                              {record.mobile}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Not Recorded</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{record.mandal}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{record.village}</td>
                        <td className="py-3 px-4">
                          <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-black px-2 py-0.5 rounded-md text-[10px]">
                            {record.acres.toFixed(2)} Ac
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {record.workingCost !== undefined ? (
                            <span className="font-semibold text-slate-700">₹{record.workingCost.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {record.grossIncome !== undefined ? (
                            <span className="font-semibold text-slate-700">₹{record.grossIncome.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {record.netIncome !== undefined ? (
                            <span className={`font-bold ${record.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ₹{record.netIncome.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 font-bold">{record.cropName}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-extrabold">{record.season} / {record.financialYear}</div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                        No farmer records matched the filter criteria. Try expanding search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t py-4 px-6 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)}</span> of {filteredData.length} records
                </span>

                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 px-3 border border-slate-200 rounded-lg text-xs font-bold hover:bg-white text-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none bg-slate-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`p-1 px-3 border rounded-lg text-xs font-bold transition-all select-none ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'border-slate-200 hover:bg-white text-slate-600 bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 px-3 border border-slate-200 rounded-lg text-xs font-bold hover:bg-white text-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Farmer Details Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400">
                  {selectedFarmer.farmerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">{selectedFarmer.farmerName}</h4>
                  <p className="text-[10px] text-slate-400">S/o: {selectedFarmer.fatherName || 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFarmer(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* General & Location Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mandal Division</span>
                  <span className="text-xs font-bold text-slate-800">{selectedFarmer.mandal}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Village Name</span>
                  <span className="text-xs font-bold text-slate-800">{selectedFarmer.village}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                  <span className="text-xs font-semibold text-slate-800">{selectedFarmer.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cultivation Land</span>
                  <span className="text-xs font-bold text-indigo-600">{selectedFarmer.acres.toFixed(2)} Acres</span>
                </div>
              </div>

              {/* Crop details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Crop Name</span>
                  <span className="text-xs font-black text-slate-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block">{selectedFarmer.cropName}</span>
                </div>
                <div className="border border-slate-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Season</span>
                  <span className="text-xs font-bold text-slate-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md inline-block">{selectedFarmer.season}</span>
                </div>
                <div className="border border-slate-100 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fin. Year</span>
                  <span className="text-xs font-bold text-slate-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-block">{selectedFarmer.financialYear}</span>
                </div>
              </div>

              {/* Financial Metrics Section */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-emerald-600" /> Cultivation Financial Details
                </h5>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Working Cost */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Working Cost</span>
                    <span className="text-sm font-black text-slate-800 leading-none">
                      {selectedFarmer.workingCost !== undefined ? `₹${selectedFarmer.workingCost.toLocaleString('en-IN')}` : 'N/A'}
                    </span>
                  </div>

                  {/* Gross Income */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Gross Income</span>
                    <span className="text-sm font-black text-slate-800 leading-none">
                      {selectedFarmer.grossIncome !== undefined ? `₹${selectedFarmer.grossIncome.toLocaleString('en-IN')}` : 'N/A'}
                    </span>
                  </div>

                  {/* Net Income */}
                  <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider block mb-1.5">Net Income</span>
                    <span className={`text-sm font-black leading-none ${selectedFarmer.netIncome !== undefined && selectedFarmer.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedFarmer.netIncome !== undefined ? `₹${selectedFarmer.netIncome.toLocaleString('en-IN')}` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Profit/Loss Badge/Summary */}
                {selectedFarmer.workingCost !== undefined && selectedFarmer.grossIncome !== undefined && selectedFarmer.netIncome !== undefined && (
                  <div className="mt-3 text-[11px] font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center flex items-center justify-center gap-1.5">
                    {selectedFarmer.netIncome >= 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>This crop generated a profit margin of <strong className="text-emerald-700">{selectedFarmer.grossIncome > 0 ? ((selectedFarmer.netIncome / selectedFarmer.grossIncome) * 100).toFixed(1) : '0'}%</strong> of gross revenue.</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                        <span>This crop operated at a net loss of <strong className="text-rose-700">₹{Math.abs(selectedFarmer.netIncome).toLocaleString('en-IN')}</strong>.</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedFarmer(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropsDashboard;
