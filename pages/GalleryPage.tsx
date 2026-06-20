import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Role, GalleryItem } from '../types';
import { apiService } from '../services/apiService';
import { 
  Plus, 
  X, 
  Upload, 
  MapPin, 
  Calendar as CalendarIcon, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Camera,
  Search,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface UploadSlot {
  file: File | null;
  previewUrl: string;
  description: string;
  village: string;
  activity: string;
}

const GalleryPage: React.FC = () => {
  const { auth } = useAuth();
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Carousel states for Hero Gallery
  const [heroIndex, setHeroIndex] = useState(0);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');

  // Upload Panel states
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [slots, setSlots] = useState<UploadSlot[]>(
    Array(5).fill(null).map(() => ({ file: null, previewUrl: '', description: '', village: '', activity: '' }))
  );

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const items = await apiService.getGallery();
      setGalleryList(items);
    } catch (e) {
      console.error("Error loading gallery:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // Determine Hero items: Top 3-5 latest items
  // If no items, we will use mock or secondary placeholders for Hero section
  const heroItems = galleryList.slice(0, 5);

  // Auto rotate hero carousel
  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  const handlePrevHero = () => {
    setHeroIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
  };

  const handleNextHero = () => {
    setHeroIndex((prev) => (prev + 1) % heroItems.length);
  };

  // Convert files to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const url = URL.createObjectURL(file);
      setSlots(prev => prev.map((slot, i) => i === index ? { ...slot, file, previewUrl: url } : slot));
    }
  };

  const handleSlotTextChange = (index: number, field: 'description' | 'village' | 'activity', value: string) => {
    setSlots(prev => prev.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
  };

  const removeSlotFile = (index: number) => {
    setSlots(prev => prev.map((slot, i) => i === index ? { file: null, previewUrl: '', description: '', village: '', activity: '' } : slot));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    const activeSlots = slots.filter(s => s.file !== null);
    if (activeSlots.length === 0) {
      setUploadError('Please select at least one photo to upload.');
      return;
    }

    // Verify fields
    const invalidSlot = activeSlots.find(s => !s.description.trim() || !s.village.trim() || !s.activity.trim());
    if (invalidSlot) {
      setUploadError('Please provide Description, Village, and Activity for all selected photos.');
      return;
    }

    try {
      setUploading(true);
      const payload = await Promise.all(activeSlots.map(async (slot) => {
        const base64 = await fileToBase64(slot.file!);
        return {
          base64,
          fileName: slot.file!.name,
          description: slot.description,
          village: slot.village,
          activity: slot.activity
        };
      }));

      const success = await apiService.uploadGallery(payload);
      if (success) {
        setUploadSuccess('Successfully uploaded photos to Google Drive and saved registry in Spreadsheet!');
        setSlots(Array(5).fill(null).map(() => ({ file: null, previewUrl: '', description: '', village: '', activity: '' })));
        await fetchGallery();
        setHeroIndex(0);
        // Automatically close upload panel after 2.5 seconds
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadSuccess('');
        }, 2500);
      } else {
        setUploadError('Failed to upload photos. Please check your Spreadsheet 2 Web App deployment.');
      }
    } catch (err) {
      console.error(err);
      setUploadError('An error occurred during file upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Filter gallery list for the Field Section
  const filteredGallery = galleryList.filter(item => {
    const matchesSearch = 
      item.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVillage = 
      selectedVillage === '' || item.village.toLowerCase() === selectedVillage.toLowerCase();

    const matchesActivity = 
      selectedActivity === '' || item.activity.toLowerCase() === selectedActivity.toLowerCase();

    return matchesSearch && matchesVillage && matchesActivity;
  });

  const villages = Array.from(new Set(galleryList.map(item => item.village))).filter(Boolean);
  const activities = Array.from(new Set(galleryList.map(item => item.activity))).filter(Boolean);

  const isAdmin = !!(auth.isAuthenticated && auth.user?.role && auth.user.role.toLowerCase() === Role.ADMIN.toLowerCase());

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Area */}
      <div className="bg-indigo-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-800 text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Camera className="w-3.5 h-3.5" />
                <span>Google Drive Cloud Persistence</span>
              </div>
              <h1 id="gallery-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Field Photo Registry
              </h1>
              <p className="text-indigo-200 mt-2 max-w-2xl text-sm md:text-base">
                Interactive photolog showcasing real-world progress, agricultural activities, and community milestones across Vikarabad district.
              </p>
            </div>

            {isAdmin && (
              <button
                id="toggle-upload-btn"
                onClick={() => setIsUploadOpen(!isUploadOpen)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all transform hover:scale-102 active:scale-98"
              >
                {isUploadOpen ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Close Upload Panel</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Upload Photos</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Upload Drawer / Component */}
      {isAdmin && isUploadOpen && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Admin Photo Upload Center</h2>
                <p className="text-xs text-slate-500">Upload up to 5 photos directly linked to Spreadsheet 2 and your Google Drive Folder</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-6 mt-6">
              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{uploadError}</span>
                </div>
              )}
              {uploadSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span className="font-semibold">{uploadSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {slots.map((slot, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative flex flex-col justify-between hover:border-slate-300 transition-colors">
                    {/* Clear Slot / Step Counter */}
                    <div className="absolute top-2 right-2 z-10">
                      {slot.file ? (
                        <button
                          type="button"
                          onClick={() => removeSlotFile(idx)}
                          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-transform hover:scale-110"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="w-5 h-5 bg-slate-200 text-slate-500 text-[10px] rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    {!slot.file ? (
                      <div className="h-44 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white p-4 text-center cursor-pointer relative hover:bg-slate-100/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(idx, e)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Choose Image</span>
                        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG or JPEG</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="h-28 rounded-lg overflow-hidden bg-slate-100 border relative select-none">
                          <img
                            src={slot.previewUrl}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">VILLAGE</span>
                            <input
                              type="text"
                              value={slot.village}
                              onChange={(e) => handleSlotTextChange(idx, 'village', e.target.value)}
                              placeholder="e.g. Mominpet"
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:border-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">ACTIVITY EFFECTED</span>
                            <input
                              type="text"
                              value={slot.activity}
                              onChange={(e) => handleSlotTextChange(idx, 'activity', e.target.value)}
                              placeholder="e.g. Soil Testing"
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:border-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">DESCRIPTION / NOTES</span>
                            <textarea
                              rows={2}
                              value={slot.description}
                              onChange={(e) => handleSlotTextChange(idx, 'description', e.target.value)}
                              placeholder="Describe context..."
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:border-indigo-500 outline-none resize-none leading-tight"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSlots(Array(5).fill(null).map(() => ({ file: null, previewUrl: '', description: '', village: '', activity: '' })));
                    setUploadError('');
                    setUploadSuccess('');
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                >
                  Clear Slots
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Drive...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Photos</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Gallery Section (Slider of newest articles/entries) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-900">Featured Spotlight (Hero Gallery)</h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Fetching featured snapshots...</p>
          </div>
        ) : heroItems.length > 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white min-h-[350px] md:h-[480px] shadow-lg">
            {/* Carousel Slides */}
            {heroItems.map((item, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 transform ${
                  index === heroIndex ? 'opacity-100 translate-x-0 scale-100 shadow-inner' : 'opacity-0 translate-x-12 scale-95 pointer-events-none'
                }`}
              >
                {/* Background Shadow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <img
                  src={item.imageUrl}
                  alt={item.activity}
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200`;
                  }}
                />

                {/* Left Top Ribbon */}
                <div className="absolute top-4 left-4 z-20 bg-indigo-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase inline-flex items-center gap-1.5 shadow">
                  <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span>Spotlight Featured</span>
                </div>

                {/* Slide Details */}
                <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 z-20 flex flex-col justify-end text-left">
                  <div className="flex flex-wrap items-center gap-3 text-indigo-300 text-xs font-bold uppercase mb-2 select-none">
                    <span className="bg-indigo-500/20 backdrop-blur-md text-indigo-200 border border-indigo-400/20 px-2.5 py-1 rounded">
                      {item.village}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Date'}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {item.activity}
                  </h3>
                  <p className="text-sm md:text-base text-slate-300 mt-2 max-w-3xl line-clamp-2 md:line-clamp-3 leading-relaxed">
                    {item.description || "Activity logged successfully by Wassan Field Teams. Real-time monitoring helps drive impact in rural communities and support local farmers."}
                  </p>
                </div>
              </div>
            ))}

            {/* Slider Navigation arrows */}
            {heroItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevHero}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 md:w-12 h-10 md:h-12 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextHero}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 md:w-12 h-10 md:h-12 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Progress Indicators */}
                <div className="absolute bottom-4 right-10 z-20 flex space-x-2">
                  {heroItems.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHeroIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === heroIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white border rounded-3xl p-12 text-center select-none shadow-sm text-slate-400 font-medium">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No photographs registered in spreadsheet yet.</p>
            {isAdmin && <p className="text-xs text-slate-400 mt-1">Click top upload button to populate your system gallery catalog!</p>}
          </div>
        )}
      </div>

      {/* Field Section Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Explore Archives (Field Section)</h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(true);
                  const uploadCenter = document.getElementById('gallery-heading');
                  if (uploadCenter) {
                    uploadCenter.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 100, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-150 border border-emerald-200 rounded-lg text-xs font-bold transition-all hover:scale-102"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
            )}
          </div>

          {/* Filtering Dropdowns and Search Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-indigo-500 outline-none max-w-xs shadow-sm"
              />
            </div>

            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-indigo-500 outline-none shadow-sm"
            >
              <option value="">All Villages</option>
              {villages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:border-indigo-500 outline-none shadow-sm"
            >
              <option value="">All Activities</option>
              {activities.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Gallery Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white border rounded-2xl p-4 space-y-4 animate-pulse">
                <div className="aspect-[4/3] bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded-md w-1/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item, index) => (
              <div
                key={index}
                className="bg-white border text-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col justify-between"
              >
                <div className="overflow-hidden aspect-[4/3] bg-slate-100 relative">
                  <img
                    src={item.imageUrl}
                    alt={item.activity}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=500`;
                    }}
                  />
                  {/* Village Badge */}
                  <span className="absolute top-3 right-3 bg-indigo-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {item.village}
                  </span>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg mb-1 line-clamp-1">
                      {item.activity}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3">
                      {item.description || "Field team work log entry details. Action registered live."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold select-none border-t pt-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{item.village}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border rounded-3xl p-12 text-center text-slate-400 font-semibold select-none shadow-sm">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm">No photographs found matching filtration criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try to clear selections or look for other parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
