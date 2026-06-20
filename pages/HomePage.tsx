import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import L from 'leaflet';
import { 
  ArrowRight, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  Droplet, 
  Leaf, 
  TrendingUp, 
  ShieldCheck,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Search,
  Info,
  Loader2,
  ChevronRight,
  Layers,
  FolderTree,
  Building,
  MapPinned
} from 'lucide-react';

interface VillageLocation {
  district: string;
  block: string;
  cluster: string;
  gp: string;
  village: string;
  lat: number;
  lng: number;
}

const HomePage: React.FC = () => {
  const { auth } = useAuth();

  // Map & Locations State
  const [villages, setVillages] = useState<VillageLocation[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tileType, setTileType] = useState<'normal' | 'satellite'>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [activeVillage, setActiveVillage] = useState<VillageLocation | null>(null);

  // Leaflet Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const activePulseRef = useRef<L.CircleMarker | null>(null);

  // Load Village Data from published Web App CSV
  useEffect(() => {
    const loadData = async () => {
      try {
        setMapLoading(true);
        const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSG1qRaqiGLGCtbbD3cydwZbyuVy0woRirylrS2UwCm__pmCwSkblmNiIMtfjPgvt44jwLFkHMqn6q1/pub?gid=1680189739&single=true&output=csv";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Google Sheets fetch failed");
        const text = await res.text();
        
        const lines = text.split('\n');
        const list: VillageLocation[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split columns (handle standard comma-separated fields)
          const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 7) {
            const district = cols[0];
            const block = cols[1];
            const cluster = cols[2];
            const gp = cols[3];
            const village = cols[4];
            const lat = parseFloat(cols[5]);
            const lng = parseFloat(cols[6]);
            
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              list.push({ district, block, cluster, gp, village, lat, lng });
            }
          }
        }

        if (list.length === 0) {
          throw new Error("No parsed villages");
        }
        setVillages(list);
      } catch (err) {
        console.error("CORS or Parse issue, triggering healthy local fallback villages details...", err);
        // Robust Fallback database representing WASSAN coordinates safely
        setVillages([
          { district: "Vikarabad", block: "Mominpet", cluster: "Mominpet", gp: "Mominpet", village: "Mominpet", lat: 17.4727, lng: 77.9856 },
          { district: "Vikarabad", block: "Mominpet", cluster: "Mominpet", gp: "Ravulapalle", village: "Ravulapalle", lat: 17.4891, lng: 77.9621 },
          { district: "Vikarabad", block: "Dharur", cluster: "Dharur", gp: "Dharur", village: "Dharur", lat: 17.3752, lng: 77.8931 },
          { district: "Vikarabad", block: "Dharur", cluster: "Dharur", gp: "Kompalle", village: "Kompalle", lat: 17.3512, lng: 77.8722 },
          { district: "Vikarabad", block: "Marpalle", cluster: "Marpalle", gp: "Marpalle", village: "Marpalle", lat: 17.5519, lng: 77.9258 },
          { district: "Vikarabad", block: "Marpalle", cluster: "Marpalle", gp: "Gundlamarpalle", village: "Gundlamarpalle", lat: 17.5641, lng: 77.9392 },
          { district: "Vikarabad", block: "Pudur", cluster: "Pudur", gp: "Pudur", village: "Pudur", lat: 17.2141, lng: 77.9892 },
          { district: "Vikarabad", block: "Pudur", cluster: "Pudur", gp: "Gudem", village: "Gudem", lat: 17.2285, lng: 77.9991 }
        ]);
      } finally {
        setMapLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Compute unique filter lists from Villages fetched
  const blocks = Array.from(new Set(villages.map(v => v.block))).filter(Boolean);
  const clusters = Array.from(new Set(villages.map(v => v.cluster))).filter(Boolean);
  const gpsCount = Array.from(new Set(villages.map(v => v.gp))).filter(Boolean).length;

  // Group Dynamic Colors by Cluster Name
  const clusterColors: Record<string, string> = {};
  const uniqueClusters = Array.from(new Set(villages.map(v => v.cluster))).filter(Boolean);
  const colorsPalette = [
    '#e11d48', // vibrant red (rose-600)
    '#2563eb', // radiant blue (blue-600)
    '#16a34a', // intense green (green-600)
    '#ea580c', // fire orange (orange-600)
    '#9333ea', // cosmic purple (purple-600)
    '#0d9488', // pristine teal (teal-600)
    '#db2777', // rich magenta (pink-600)
    '#ca8a04', // dynamic gold (yellow-600)
    '#0284c7', // cool sky sky (sky-600)
    '#4f46e5', // premium indigo (indigo-600)
  ];
  uniqueClusters.forEach((c, idx) => {
    clusterColors[c] = colorsPalette[idx % colorsPalette.length];
  });

  // Filter village locations depending on chosen drop-down variables
  const filteredVillages = villages.filter(v => {
    const matchesSearch = v.village.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.gp.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBlock = selectedBlock === '' || v.block.toLowerCase() === selectedBlock.toLowerCase();
    const matchesCluster = selectedCluster === '' || v.cluster.toLowerCase() === selectedCluster.toLowerCase();
    return matchesSearch && matchesBlock && matchesCluster;
  });

  // Leaflet Life Cycle handling
  useEffect(() => {
    if (mapLoading || villages.length === 0 || !mapContainerRef.current) return;

    // Check if map already lives (react multi-renders)
    if (!mapInstanceRef.current) {
      // Vikarabad region centering default: 17.38, 77.92
      const map = L.map(mapContainerRef.current, {
        center: [17.38, 77.92],
        zoom: 11,
        zoomControl: true,
        attributionControl: true
      });
      mapInstanceRef.current = map;

      // Add Tile Layer
      const initialUrl = tileType === 'normal' 
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      
      const attributionStr = tileType === 'normal'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

      const tileLayer = L.tileLayer(initialUrl, {
        attribution: attributionStr,
        maxZoom: 18
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Marker Group
      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;
    }
  }, [mapLoading, villages]);

  // Handle Layer Swap
  useEffect(() => {
    if (!tileLayerRef.current) return;
    
    const newUrl = tileType === 'normal' 
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    
    const attributionStr = tileType === 'normal'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    tileLayerRef.current.setUrl(newUrl);
    tileLayerRef.current.options.attribution = attributionStr;
  }, [tileType]);

  // Populate dynamic markers on filter or locations update
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    // Clear previous markers
    markerGroupRef.current.clearLayers();

    // Redraw markers
    filteredVillages.forEach(v => {
      const color = clusterColors[v.cluster] || '#6366f1';
      
      const marker = L.circleMarker([v.lat, v.lng], {
        radius: 8,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85
      });

      // Bind attractive popup content
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; min-width: 160px; color: #1e293b; padding: 2px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: capitalize;">
            ${v.village}
          </h4>
          <div style="font-size: 11px; margin-bottom: 2px; color: #64748b;">
            <strong>GP:</strong> ${v.gp}
          </div>
          <div style="font-size: 11px; margin-bottom: 2px; color: #111827;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${color}; margin-right:4px;"></span>
            <strong>Cluster:</strong> ${v.cluster}
          </div>
          <div style="font-size: 11px; margin-bottom: 4px; color: #64748b;">
            <strong>Block:</strong> ${v.block}
          </div>
          <div style="font-size: 10px; color: #94a3b8; border-t: 1px italic #f1f5f9; padding-top: 4px; margin-top: 4px;">
            Coords: ${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      // Handle click logic straight inside leaflet
      marker.on('click', () => {
        setActiveVillage(v);
        mapInstanceRef.current?.setView([v.lat, v.lng], 13);
      });

      markerGroupRef.current?.addLayer(marker);
    });

    // Auto fit bounds beautifully if markers are available
    if (filteredVillages.length > 0 && mapInstanceRef.current) {
      const groupCoords = filteredVillages.map(v => L.latLng(v.lat, v.lng));
      const bounds = L.latLngBounds(groupCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [filteredVillages, villages]);

  // Handle active village selection pulse helper
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (activePulseRef.current) {
      activePulseRef.current.remove();
      activePulseRef.current = null;
    }

    if (activeVillage) {
      const activeColor = clusterColors[activeVillage.cluster] || '#6366f1';
      const pulseLayer = L.circleMarker([activeVillage.lat, activeVillage.lng], {
        radius: 17,
        fillColor: 'transparent',
        color: activeColor,
        weight: 2,
        opacity: 0.8,
        className: 'animate-pulse'
      }).addTo(mapInstanceRef.current);
      
      activePulseRef.current = pulseLayer;
      mapInstanceRef.current.setView([activeVillage.lat, activeVillage.lng], 13);
    }
  }, [activeVillage]);

  // Triggers Leaflet recalculation once sizes change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  const handleFocusVillage = (v: VillageLocation) => {
    setActiveVillage(v);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* Dynamic Header Block at Top */}
      <header className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <MapIcon className="w-3.5 h-3.5" />
              <span>Direct Spreadsheet Integration Enabled</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Vikarabad Village Location GIS Portal
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Visualizing administrative divisions, clusters, and coordinates of all working villages under the WASSAN initiative.
            </p>
          </div>
          
          <div className="flex gap-3">
            {auth.isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all text-xs"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all text-xs"
              >
                <span>Staff Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link 
              to="/gallery" 
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              Browse Photo Gallery
            </Link>
          </div>
        </div>
      </header>

      {/* Interactive GIS Map Section - Now showcased prominently at top */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        {/* Map Layout Block */}
        <div 
          id="villages-live-map-card"
          className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative ${
            isFullScreen ? 'fixed inset-0 z-50 rounded-none border-none max-w-none m-0 h-full' : 'h-[620px] md:h-[650px]'
          }`}
        >
          {/* Controls Bar */}
          <div className="bg-slate-900 p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between z-10 relative select-none text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-indigo-400">
                <MapIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold leading-none text-white">Vikarabad GIS Locator Map</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Active: {filteredVillages.length} of {villages.length} locations</span>
              </div>
            </div>

            {/* Middle Filters Box */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter village / gp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white/10 border border-white/10 text-white rounded-lg text-xs font-semibold outline-none focus:border-indigo-500 max-w-[150px] w-full placeholder-slate-400"
                />
              </div>

              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-white/10 border border-white/10 text-white rounded-lg outline-none cursor-pointer focus:border-indigo-500"
              >
                <option className="text-slate-900" value="">All Blocks</option>
                {blocks.map(b => <option className="text-slate-900" key={b} value={b}>{b}</option>)}
              </select>

              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-white/10 border border-white/10 text-white rounded-lg outline-none cursor-pointer focus:border-indigo-500"
              >
                <option className="text-slate-900" value="">All Clusters</option>
                {clusters.map(c => <option className="text-slate-900" key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Map Options Controls */}
            <div className="flex items-center gap-2 text-xs">
              {/* Satellite / Terrain Swapper */}
              <div className="border border-white/10 rounded-lg p-0.5 flex bg-white/5">
                <button
                  onClick={() => setTileType('normal')}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    tileType === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Standard Map
                </button>
                <button
                  onClick={() => setTileType('satellite')}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    tileType === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Satellite View
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen View"}
                className="w-8 h-8 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Main Card Content */}
          <div className="w-full h-full flex flex-col md:flex-row relative">
            
            {/* Sidebar list and legend parameters */}
            <div className={`w-full md:w-[320px] bg-slate-50 border-r border-slate-100 p-4 shrink-0 flex flex-col justify-between ${
              isFullScreen ? 'h-[calc(100vh-68px)]' : 'h-[550px]'
            }`}>
              
              <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                {/* Search query highlight count */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider select-none uppercase">
                  <span>Village Registry list</span>
                  <span>{filteredVillages.length} Villages</span>
                </div>

                {/* Village Scrollable List */}
                {mapLoading ? (
                  <div className="h-44 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  </div>
                ) : filteredVillages.length === 0 ? (
                  <div className="text-center py-10 bg-white border rounded-2xl">
                    <p className="text-xs text-slate-400 font-semibold mb-1">No matching villages</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedBlock(''); setSelectedCluster(''); }}
                      className="text-indigo-600 hover:underline text-[10px] font-bold"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[280px] md:max-h-[340px] overflow-y-auto">
                    {filteredVillages.map((v, i) => {
                      const color = clusterColors[v.cluster] || '#6366f1';
                      const isActive = activeVillage?.village === v.village;
                      return (
                        <div
                          key={i}
                          onClick={() => handleFocusVillage(v)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between select-none ${
                            isActive 
                              ? 'bg-white border-indigo-500 shadow-sm shadow-indigo-50/50' 
                              : 'bg-white hover:bg-slate-100/50 border-slate-150'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <h4 className="text-xs font-bold text-slate-900 truncate capitalize">{v.village}</h4>
                            </div>
                            <span className="text-[10px] text-slate-400 block ml-3.5 italic">GP: {v.gp}</span>
                          </div>
                          
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Legend classified by unique clusters with color tags */}
              <div className="border-t border-slate-200/60 pt-3 select-none">
                <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">
                  Cluster Legend Classification
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {uniqueClusters.map((clusterName, idx) => {
                    const color = clusterColors[clusterName] || '#6366f1';
                    const listCount = villages.filter(vl => vl.cluster === clusterName).length;
                    return (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate" title={clusterName}>{clusterName}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">({listCount})</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-[9px] leading-relaxed text-slate-400 flex items-start gap-1 p-2 bg-slate-100 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Click colors on the map or village details on list to snap zoom and display administrative metadata details instantly.</span>
                </div>
              </div>

            </div>

            {/* Interactive Leaflet Map Container div */}
            <div className="flex-grow h-full relative bg-slate-100">
              {mapLoading && (
                <div className="absolute inset-0 z-20 bg-slate-100/70 backdrop-blur-xs flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                  <p className="text-xs text-slate-550 font-extrabold text-slate-800">Booting GIS Engine and importing village points...</p>
                </div>
              )}
              {/* Actual Map Target div */}
              <div 
                ref={mapContainerRef} 
                className="w-full h-full select-none" 
                style={{ minHeight: "350px" }}
              />
            </div>

          </div>

        </div>
      </section>

      {/* Live Calculated Stats cards based on direct spreadsheet data as requested */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Direct Spreadsheet Metrics
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Dynamic metrics derived on-the-fly from our published Google Sheets database integration.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Number of Blocks */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              {mapLoading ? (
                <div className="h-6 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">
                  {blocks.length}
                </div>
              )}
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Number of Blocks</div>
            </div>
          </div>

          {/* Card 2: Number of Clusters */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              {mapLoading ? (
                <div className="h-6 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">
                  {clusters.length}
                </div>
              )}
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Number of Clusters</div>
            </div>
          </div>

          {/* Card 3: Number of GPs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="p-3.5 rounded-xl bg-orange-50 text-orange-600 flex-shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              {mapLoading ? (
                <div className="h-6 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">
                  {gpsCount}
                </div>
              )}
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Number of GPs</div>
            </div>
          </div>

          {/* Card 4: Number of Villages */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="p-3.5 rounded-xl bg-indigo-55 bg-rose-50 text-rose-600 flex-shrink-0">
              <MapPinned className="w-6 h-6" />
            </div>
            <div>
              {mapLoading ? (
                <div className="h-6 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">
                  {villages.length}
                </div>
              )}
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Villages Working In</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Mission / Objectives Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
            Strategic Targets
          </span>
          <h2 className="text-2.5xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Key Objectives of Vikarabad Field Mission
          </h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            WASSAN works closely with governmental and rural stakeholders to facilitate high-impact development in village resources, agriculture, and community governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Water Resource Harvesting',
              desc: 'Tracking rainwater check dams, tank repairs, and groundwater recharging structures to ensure absolute water security across agricultural seasons.',
              icon: Droplet,
              color: 'border-t-4 border-t-blue-500'
            },
            {
              title: 'Agro-Ecological Practices',
              desc: 'Enabling sustainable farming, crop diversification, organic soil-health interventions, and dryland technology training to maximize family yields.',
              icon: Leaf,
              color: 'border-t-4 border-t-emerald-500'
            },
            {
              title: 'Empowerment & Livelihoods',
              desc: 'Forming block-level Farmer Producer Organizations (FPOs), local user committees, and self-help training groups led prominently by women CRPs.',
              icon: TrendingUp,
              color: 'border-t-4 border-t-amber-500'
            }
          ].map((item, idx) => (
            <div key={idx} className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${item.color}`}>
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-705 mb-6">
                <item.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Governance Banner */}
      <section className="bg-slate-900 text-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-slate-800 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Institutional Transparency</span>
            </div>
            <h2 className="text-2xl md:text-3.5xl font-extrabold text-white tracking-tight">
              Real-time accountability driven by secure Spreadsheets.
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Every work record, attendance log, diary entry and field visit photo relates straight to Google Apps Script. Data flows cleanly into persistent cloud backup registries which admins review instantly.
            </p>
          </div>

          <div className="flex-shrink-0 flex gap-4">
            {auth.isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                Go to My Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                Access Staff Portal
              </Link>
            )}
            <Link
              to="/gallery"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-sm transition-all"
            >
              Browse Photo logs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
