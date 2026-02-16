
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filter, setFilter] = useState({ village: '', activity: '' });

  const slides = [
    { url: 'https://picsum.photos/id/1018/1600/600', title: 'Empowering Villages', sub: 'Field activities across Vikarabad district.' },
    { url: 'https://picsum.photos/id/1019/1600/600', title: 'Sustainable Agriculture', sub: 'Monitoring soil health and irrigation practices.' },
    { url: 'https://picsum.photos/id/1020/1600/600', title: 'Community Engagement', sub: 'Stakeholder meetings at the grassroots level.' },
  ];

  const galleryItems = [
    { imageUrl: 'https://picsum.photos/id/10/400/300', activity: 'Soil Testing', village: 'Mominpet', date: '2024-03-15' },
    { imageUrl: 'https://picsum.photos/id/11/400/300', activity: 'Training Session', village: 'Vikarabad', date: '2024-03-12' },
    { imageUrl: 'https://picsum.photos/id/12/400/300', activity: 'Plantation', village: 'Pargi', date: '2024-03-10' },
    { imageUrl: 'https://picsum.photos/id/13/400/300', activity: 'Meeting', village: 'Tandur', date: '2024-03-08' },
    { imageUrl: 'https://picsum.photos/id/14/400/300', activity: 'Survey', village: 'Dharur', date: '2024-03-05' },
    { imageUrl: 'https://picsum.photos/id/15/400/300', activity: 'Soil Testing', village: 'Pargi', date: '2024-03-01' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const filteredGallery = galleryItems.filter(item => 
    (filter.village === '' || item.village === filter.village) &&
    (filter.activity === '' || item.activity === filter.activity)
  );

  return (
    <div className="bg-slate-50">
      {/* Hero Slider */}
      <section className="relative h-[400px] sm:h-[600px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 px-4 text-center">
              <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 animate-fadeIn">{slide.title}</h1>
              <p className="text-lg sm:text-xl max-w-2xl">{slide.sub}</p>
              <Link to="/login" className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold transition-transform hover:scale-105">
                Staff Login
              </Link>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-colors ${i === currentSlide ? 'bg-white' : 'bg-white/40'}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Villages Covered', val: '45+', icon: 'fa-map-marker-alt' },
            { label: 'Active Staff', val: '120+', icon: 'fa-users' },
            { label: 'Work Hours Logged', val: '12k+', icon: 'fa-clock' },
            { label: 'Projects Completed', val: '85', icon: 'fa-check-circle' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-indigo-600 mb-4 text-2xl">
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.val}</div>
              <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Field Gallery</h2>
            <p className="text-slate-500 mt-2">Glimpses of activities from our field teams.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={filter.village}
              onChange={(e) => setFilter(f => ({ ...f, village: e.target.value }))}
              className="px-4 py-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Villages</option>
              {Array.from(new Set(galleryItems.map(i => i.village))).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select
              value={filter.activity}
              onChange={(e) => setFilter(f => ({ ...f, activity: e.target.value }))}
              className="px-4 py-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Activities</option>
              {Array.from(new Set(galleryItems.map(i => i.activity))).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white border shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.activity} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900">{item.activity}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-semibold uppercase">{item.village}</span>
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <i className="far fa-calendar-alt mr-2"></i>
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
