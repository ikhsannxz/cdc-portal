const fs = require('fs');
const oldPath = 'c:/Users/Pongo/Codingan_portal-cdc-um-kendari/src/components/PublicLayout.tsx';
const oldContent = fs.readFileSync(oldPath, 'utf8');

// We extract the parts from oldContent.
// 1. Tab 2: PROFIL CDC
const tab2Match = oldContent.match(/\{\/\* TAB 2: PROFIL CDC \*\/\}([\s\S]*?)\{\/\* TAB 3: INFO MAGANG \*\/\}/);
// 2. Tab 3: INFO MAGANG
const tab3Match = oldContent.match(/\{\/\* TAB 3: INFO MAGANG \*\/\}([\s\S]*?)\{\/\* TAB 4: LOWONGAN KARIR LIST \*\/\}/);
// 3. Tab 4: LOWONGAN KARIR LIST
const tab4Match = oldContent.match(/\{\/\* TAB 4: LOWONGAN KARIR LIST \*\/\}([\s\S]*?)\{\/\* TAB 5: BERITA LIST \*\/\}/);
// 4. Tab 5: BERITA LIST
const tab5Match = oldContent.match(/\{\/\* TAB 5: BERITA LIST \*\/\}([\s\S]*?)\{\/\* TAB 6: KONTAK \*\/\}/);
// 5. Tab 6: KONTAK
const tab6Match = oldContent.match(/\{\/\* TAB 6: KONTAK \*\/\}([\s\S]*?)<\/main>/);

let otherTabs = '';
if(tab2Match) otherTabs += tab2Match[0];
if(tab3Match) otherTabs += tab3Match[0];
if(tab4Match) otherTabs += tab4Match[0];
if(tab5Match) otherTabs += tab5Match[0];
if(tab6Match) {
  let content = tab6Match[0];
  content = content.replace('</main>', '');
  otherTabs += content;
}

// Ensure "UMSU" and "CDAC" occurrences in the old tabs are updated to Kendari
otherTabs = otherTabs.replace(/Universitas Muhammadiyah Sumatera Utara/g, 'Universitas Muhammadiyah Kendari');
otherTabs = otherTabs.replace(/UMSU/g, 'UM Kendari');
otherTabs = otherTabs.replace(/CDAC UMSU/g, 'Portal CDC UM Kendari');

const finalContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, MapPin, Calendar, Briefcase, Search, BookOpen, 
  FileText, Mail, Phone, Clock, ArrowRight, Globe, Megaphone,
  Sparkles, Info, GraduationCap, ChevronRight, Menu, X, 
  CheckCircle, ExternalLink, PlayCircle, Facebook, Instagram, 
  Youtube, MonitorPlay, Users, Building
} from 'lucide-react';
import { Lowongan, Berita, Pengumuman } from '../types';
import { motion } from 'motion/react';

interface PublicLayoutProps {
  currentTab: string;
  setTab: (tab: string) => void;
  lowongan: Lowongan[];
  berita: Berita[];
  pengumuman: Pengumuman[];
  onSelectLowongan: (id: string) => void;
  onSelectBerita: (slug: string) => void;
  onNavigateToLogin: () => void;
}

export default function PublicLayout({
  currentTab,
  setTab,
  lowongan,
  berita,
  pengumuman,
  onSelectLowongan,
  onSelectBerita,
  onNavigateToLogin
}: PublicLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'magang' | 'kerja'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Format date for Top Bar
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-GB', dateOptions);

  // Filter only published items
  const filteredLowongan = lowongan.filter(item => {
    if (item.status !== 'published') return false;
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.namaInstansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' ? true : item.tipe === filterType;
    return matchesSearch && matchesType;
  });

  const publishedLowongan = lowongan.filter(item => item.status === 'published');
  const publishedBerita = berita.filter(n => n.status === 'published');
  const publishedPengumuman = pengumuman.filter(p => p.status === 'published');

  // Nav actions
  const navMenus = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'profil', label: 'Tentang Kami' },
    { id: 'magang', label: 'Layanan' },
    { id: 'login-tracer', label: 'Tracer Study', isAction: true },
    { id: 'login-survey', label: 'User Survey', isAction: true },
    { id: 'login-register', label: 'Register', isAction: true },
    { id: 'lowongan', label: 'Job Info' },
    { id: 'berita', label: 'APSKAR PTMA' }
  ];

  const handleNavClick = (menu: any) => {
    setIsMobileMenuOpen(false);
    if (menu.isAction) {
      onNavigateToLogin();
    } else {
      setTab(menu.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="pub-root">
      
      {/* 1. HEADER & NAVIGASI UTAMA */}
      
      {/* Top Bar */}
      <div className="bg-blue-950 text-slate-300 text-[10px] sm:text-xs py-2 px-4 border-b border-blue-900/50 hidden sm:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start">
            <span className="hover:text-white cursor-pointer transition">Home Portal CDC UM Kendari</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
            <span className="hover:text-white cursor-pointer transition">APCDA Website</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
            <span className="hover:text-white cursor-pointer transition">UM Kendari Entrepreneur</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
            <span className="hover:text-white cursor-pointer transition">UM Kendari Program</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
            <span className="hover:text-white cursor-pointer transition">Jalinan Kealumnian UM Kendari</span>
          </div>
          <div className="font-semibold text-emerald-400 shrink-0">
            {formattedDate}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm" id="pub-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab('beranda')} id="pub-brand">
            <div className="bg-blue-900 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-md">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-extrabold text-blue-950 text-xl md:text-2xl tracking-tight leading-none">
                Portal CDC UM Kendari
              </h1>
              <div className="text-emerald-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1.5 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">
                Asia Pacific Career Development Association Member 2025
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5" id="pub-nav-desktop">
            {navMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => handleNavClick(menu)}
                className={\`px-3 py-2 text-[13px] font-bold rounded-lg transition-all duration-200 uppercase tracking-wide \${
                  currentTab === menu.id && !menu.isAction
                    ? 'text-white bg-blue-900 shadow-md'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50'
                }\`}
              >
                {menu.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-600 bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl pb-4">
            <div className="flex flex-col px-4 pt-2 gap-1">
              {navMenus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => handleNavClick(menu)}
                  className={\`text-left px-4 py-3 text-sm font-bold rounded-lg transition-colors uppercase \${
                    currentTab === menu.id && !menu.isAction
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-blue-50'
                  }\`}
                >
                  {menu.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* CORE BODY WRAPPER */}
      <main className="flex-grow" id="pub-main">
        {currentTab === 'beranda' && (
          <div id="tab-beranda" className="space-y-0">
            
            {/* 2. HERO BANNER (SLIDER UTAMA) */}
            <section className="relative overflow-hidden bg-white border-b border-slate-200" id="hero-banner">
              {/* Background Elements */}
              <div className="absolute top-0 right-0 w-[60%] h-full bg-blue-950 rounded-bl-[100px] sm:rounded-bl-[200px] z-0 overflow-hidden hidden md:block">
                {/* Green curved accent inside the blue */}
                <div className="absolute top-0 right-0 w-full h-full bg-emerald-500 rounded-bl-[150px] sm:rounded-bl-[250px] opacity-20 transform translate-x-12 translate-y-12"></div>
                {/* Dots pattern */}
                <div className="absolute top-10 right-10 grid grid-cols-5 gap-2 opacity-30">
                  {Array.from({length: 25}).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  ))}
                </div>
              </div>

              {/* Mobile background */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white via-blue-50 to-emerald-100 z-0 md:hidden"></div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-[500px] md:min-h-[600px] items-center py-12 md:py-0">
                
                {/* Left Content */}
                <div className="space-y-8 pr-0 md:pr-12">
                  {/* Credibility Logos */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-white/80 backdrop-blur-sm p-3 rounded-2xl inline-flex border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> AKREDITASI UNGGUL
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <Sparkles className="w-3 h-3 text-blue-600" /> DIKTISAINTEK BERDAMPAK
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <Globe className="w-3 h-3 text-rose-600" /> MQA
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-500">AppliedHE</div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-500">THE Impact Rankings</div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-950 leading-[1.1] tracking-tight uppercase" style={{ textShadow: '2px 2px 0px rgba(255,255,255,1)' }}>
                      Raih Masa Depanmu Bersama <br/>
                      <span className="text-blue-700 text-5xl sm:text-6xl lg:text-7xl block mt-2">YANG TERBAIK</span>
                    </h2>
                    
                    <div className="bg-blue-900 text-white px-4 sm:px-6 py-2 sm:py-3 inline-block font-bold text-sm sm:text-lg tracking-widest shadow-lg">
                      UNGGUL - CERDAS - TERPERCAYA
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={onNavigateToLogin}
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white px-8 py-4 rounded font-bold text-lg shadow-xl shadow-emerald-500/30 flex items-center gap-2 transition-transform hover:scale-105"
                    >
                      Daftar Sekarang <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-600 font-medium space-y-1 pt-4 border-t border-slate-200/60 max-w-md">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Kampus Utama: Jl. K.H. Ahmad Dahlan No. 10 Kendari</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Kampus Pascasarjana: Jl. K.H. Ahmad Dahlan No. 10 Kendari</span>
                    </div>
                  </div>
                </div>

                {/* Right Visual (Student) */}
                <div className="hidden md:flex justify-end h-full items-end relative">
                  <div className="relative w-[90%] max-w-[500px] z-10 pt-10">
                    <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop" 
                      alt="Mahasiswi UM Kendari" 
                      className="w-full h-auto object-cover rounded-tl-[100px] rounded-br-[100px] border-8 border-white shadow-2xl"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-full"><Users className="w-6 h-6 text-emerald-600" /></div>
                      <div>
                        <div className="font-bold text-slate-900">Bergabunglah</div>
                        <div className="text-xs text-slate-500">dengan ribuan alumni sukses</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Banner Info (Socials & Contacts) */}
              <div className="bg-slate-50 border-t border-slate-200 py-3 relative z-10">
                <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between md:justify-center gap-4 sm:gap-8 items-center text-xs font-bold text-slate-600">
                  <a href="#" className="flex items-center gap-2 hover:text-blue-900 transition"><Globe className="w-4 h-4"/> WEBSITE umkendari.ac.id</a>
                  <a href="#" className="flex items-center gap-2 hover:text-blue-900 transition"><Instagram className="w-4 h-4"/> @umkendari</a>
                  <a href="#" className="flex items-center gap-2 hover:text-blue-900 transition"><Facebook className="w-4 h-4"/> um kendari</a>
                  <a href="#" className="flex items-center gap-2 hover:text-blue-900 transition"><Youtube className="w-4 h-4"/> um kendari</a>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <Phone className="w-4 h-4 text-emerald-600"/> 
                    <span className="text-slate-800">0852-4100-9988</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Layout with Main Column and Sidebar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Main Content Column (Left) */}
              <div className="lg:col-span-8 space-y-16">
                
                {/* 3. PENCARIAN KERJA (JOB SEARCH ENGINE) */}
                <section id="job-search-engine" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <h3 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
                        UM Kendari <span className="text-emerald-500">CAREER FAIR</span>
                      </h3>
                      <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded font-bold text-xs italic flex items-center gap-1.5 border border-slate-200">
                        Powered by <span className="text-blue-600 font-extrabold normal-case">prosple</span>
                      </div>
                    </div>
                    
                    <div className="relative w-full shadow-lg rounded-2xl group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Search className="w-6 h-6" />
                      </div>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Mesin Pencari Lowongan Kerja Terkini..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-base font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                      <button className="absolute inset-y-2 right-2 bg-blue-900 hover:bg-blue-800 text-white px-6 rounded-xl font-bold text-sm transition-colors">
                        Cari
                      </button>
                    </div>
                  </div>
                </section>

                {/* 4. INFO KARIR TERKINI (JOB LISTINGS) */}
                <section id="job-listings">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-extrabold text-slate-900 border-l-4 border-blue-900 pl-4">
                      INFO KARIR PORTAL CDC TERKINI
                    </h3>
                    <button 
                      onClick={() => setTab('lowongan')}
                      className="text-emerald-600 hover:text-emerald-800 font-bold text-sm flex items-center gap-1"
                    >
                      Lihat Semua <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {publishedLowongan
                      .filter(l => l.judul.toLowerCase().includes(searchQuery.toLowerCase()) || l.namaInstansi.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 6)
                      .map(loker => (
                      <div 
                        key={loker.id} 
                        onClick={() => onSelectLowongan(loker.id)}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-blue-950 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                              {loker.judul}
                            </h4>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border border-emerald-100 uppercase">
                              {loker.tipe}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" />
                            {loker.namaInstansi}
                          </div>
                          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                            {loker.deskripsi}
                          </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            by Admin Website
                          </div>
                          <div className="text-slate-500 font-medium">
                            {loker.createdAt ? new Date(loker.createdAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {publishedLowongan.length === 0 && (
                      <div className="col-span-1 sm:col-span-2 text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                        <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <div className="font-bold text-slate-600">Belum ada lowongan tersedia</div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 5. PROGRAM PENGEMBANGAN & PENGUMUMAN */}
                <section id="programs">
                  <h3 className="text-2xl font-extrabold text-slate-900 border-l-4 border-emerald-500 pl-4 mb-6">
                    PROGRAM PENGEMBANGAN & ARTIKEL
                  </h3>
                  
                  <div className="space-y-8">
                    {/* Artikel Utama / Blog */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {publishedBerita.slice(0, 2).map((item, idx) => (
                        <div 
                          key={item.id} 
                          onClick={() => onSelectBerita(item.slug)}
                          className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer group hover:shadow-md transition-all"
                        >
                          <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                            {item.coverImageUrl ? (
                              <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <BookOpen className="w-12 h-12" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 bg-blue-900 text-white text-[10px] font-bold px-2 py-1 rounded">
                              BLOG & INFO
                            </div>
                          </div>
                          <div className="p-5 space-y-2">
                            <h4 className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.excerpt || item.content.substring(0, 100) + '...'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Banner Promosi Internal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Banner 1 */}
                      <div className="bg-gradient-to-br from-blue-950 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-center items-start shadow-md group cursor-pointer">
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500">
                          <GraduationCap className="w-40 h-40 transform translate-x-10 translate-y-10" />
                        </div>
                        <div className="relative z-10 space-y-2">
                          <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block">CERTIFICATION</div>
                          <h4 className="font-extrabold text-lg leading-tight">Student Career Development Certificate</h4>
                          <p className="text-blue-200 text-xs mt-1">Universitas Muhammadiyah Kendari - Pintu Gerbang Sukses Berkarir</p>
                        </div>
                      </div>

                      {/* Banner 2 */}
                      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-center items-start shadow-md group cursor-pointer">
                        <div className="absolute right-0 bottom-0 opacity-20 group-hover:scale-110 transition-transform duration-500 text-emerald-400">
                          <PlayCircle className="w-40 h-40 transform translate-x-10 translate-y-10" />
                        </div>
                        <div className="relative z-10 space-y-2">
                          <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block">VIDEO</div>
                          <h4 className="font-extrabold text-lg leading-tight">UM Kendari Graduate Day</h4>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mt-2 bg-slate-800/50 inline-flex px-3 py-1.5 rounded-lg border border-slate-600/50">
                            <MonitorPlay className="w-4 h-4" /> Watch on Portal CDC
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pengumuman Khusus */}
                    {publishedPengumuman.length > 0 && (
                      <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="bg-white p-3 rounded-xl shadow-sm shrink-0 border border-emerald-100">
                            <Megaphone className="w-6 h-6 text-emerald-600 animate-pulse" />
                          </div>
                          <div>
                            <div className="text-emerald-800 font-extrabold text-sm mb-1 uppercase tracking-wider">Pengumuman Khusus</div>
                            <h4 className="font-bold text-slate-900 text-base">{publishedPengumuman[0].title}</h4>
                            <p className="text-slate-600 text-sm mt-1">{publishedPengumuman[0].content}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 6. LAYANAN B2B (UNTUK PERUSAHAAN) */}
                <section id="b2b-services">
                  <div className="bg-blue-900 rounded-3xl overflow-hidden shadow-xl relative border border-blue-800">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-800 to-transparent z-0"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    
                    <div className="relative z-10 p-8 sm:p-10 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 text-white">
                      <div className="md:w-2/3 space-y-6">
                        <div className="inline-block bg-white text-blue-900 px-3 py-1 rounded font-extrabold text-xs uppercase tracking-wider">
                          Layanan Mitra Industri
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                          PEMASANGAN INFO LOKER <br/>
                          <span className="text-emerald-400 font-medium text-2xl sm:text-3xl block mt-2">Temukan Kandidat Terbaik Perusahaan Anda</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-blue-800">
                          <div className="space-y-2">
                            <div className="font-bold text-blue-200 text-xs uppercase">Langkah Mudah:</div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> Mengisi Link Pendaftaran Perusahaan</li>
                              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> Kirim Info Loker Melalui kontak</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <div className="font-bold text-blue-200 text-xs uppercase">Benefits (Keuntungan):</div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/> Free (Gratis) pemasangan loker</li>
                              <li className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/> Pencarian kandidat tepat sasaran</li>
                              <li className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/> Akses ke database alumni UM Kendari</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-1/3 flex justify-center md:justify-end w-full">
                        <button 
                          onClick={onNavigateToLogin}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-blue-950 font-extrabold py-4 px-6 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          Daftar Sebagai Mitra <ArrowRight className="w-5 h-5"/>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* 7. SIDEBAR (Right) */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* Sidebar Community Banner */}
                <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-6 text-white text-center shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Users className="w-48 h-48" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <h4 className="font-extrabold text-xl">PORTAL CDC UM KENDARI CLUB</h4>
                    <p className="text-sm text-rose-100">Bergabung dengan jejaring alumni tangguh yang tersebar di seluruh nusantara.</p>
                    <button className="bg-white text-rose-700 font-bold text-xs px-4 py-2 rounded-full mt-2 hover:bg-rose-50 transition-colors">
                      Gabung Komunitas
                    </button>
                  </div>
                </div>

                {/* Widget Popular Info */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Popular Info
                    </h4>
                  </div>
                  <div className="p-0">
                    <ul className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      <li className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2 transition-colors">
                        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> 
                        Loker Indofood 2026
                      </li>
                      <li className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2 transition-colors">
                        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> 
                        JOB PREPARATION 2026
                      </li>
                      <li className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2 transition-colors">
                        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> 
                        Selamat & Sukses Pimpinan UM Kendari 2026
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Widget Info Terkini */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-blue-900 text-white px-5 py-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" /> Info Terkini Loker
                    </h4>
                  </div>
                  <div className="p-4 space-y-4">
                    {publishedLowongan.slice(0, 4).map(loker => (
                      <div key={loker.id} className="group cursor-pointer border-b border-slate-100 last:border-0 pb-3 last:pb-0" onClick={() => onSelectLowongan(loker.id)}>
                        <h5 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                          {loker.judul}
                        </h5>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Building className="w-3 h-3" /> {loker.namaInstansi}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
              </div>

            </div>
          </div>
        )}
        
${otherTabs}

      </main>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 border-t-4 border-blue-950 mt-auto" id="pub-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            
            {/* Identitas Brand */}
            <div className="md:col-span-5 space-y-6" id="footer-brand">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 text-slate-900 p-2 rounded-lg font-bold flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-xl leading-tight">
                    Portal CDC UM Kendari
                  </h3>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Pusat Pengembangan Karir dan Alumni, Universitas Muhammadiyah Kendari. Berkomitmen menjembatani lulusan dengan dunia kerja profesional dan pengembangan potensi diri.
              </p>
              
              <div className="space-y-2">
                <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">Terkoneksi Dengan Kami</div>
                <div className="flex gap-3">
                  <a href="#" className="bg-slate-800 p-2.5 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"><Facebook className="w-5 h-5"/></a>
                  <a href="#" className="bg-slate-800 p-2.5 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"><Instagram className="w-5 h-5"/></a>
                  <a href="#" className="bg-slate-800 p-2.5 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"><Youtube className="w-5 h-5"/></a>
                  <a href="#" className="bg-slate-800 p-2.5 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"><Globe className="w-5 h-5"/></a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-bold text-white text-base border-b border-slate-700 pb-2">Tautan Tambahan</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" onClick={(e) => {e.preventDefault(); setTab('beranda');}} className="hover:text-emerald-400 transition flex items-center gap-2"><ChevronRight className="w-3 h-3"/> UM Kendari Career Fair</a></li>
                <li><a href="#" onClick={(e) => {e.preventDefault(); setTab('lowongan');}} className="hover:text-emerald-400 transition flex items-center gap-2"><ChevronRight className="w-3 h-3"/> Everyday is Career Fair</a></li>
                <li><a href="#" onClick={(e) => {e.preventDefault(); setTab('beranda');}} className="hover:text-emerald-400 transition flex items-center gap-2"><ChevronRight className="w-3 h-3"/> Visit Web Portal CDC</a></li>
                <li><a href="#" onClick={(e) => {e.preventDefault(); onNavigateToLogin();}} className="hover:text-emerald-400 transition flex items-center gap-2"><ChevronRight className="w-3 h-3"/> Tracer Study Alumni</a></li>
              </ul>
            </div>

            {/* Kontak Footer */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-bold text-white text-base border-b border-slate-700 pb-2">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Jl. K.H. Ahmad Dahlan No. 10, Kendari, Sulawesi Tenggara.</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>0852-4100-9988</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>cdc@umkendari.ac.id</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© {new Date().getFullYear()} Portal CDC Universitas Muhammadiyah Kendari. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
`;

fs.writeFileSync(oldPath, finalContent, 'utf8');
console.log('Successfully wrote the new PublicLayout.tsx!');
