/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User as UserType, 
  Mitra, 
  Lowongan, 
  PengajuanMagang, 
  SurveiLulusan 
} from '../types';
import { 
  getFromDB, 
  saveToDB, 
  insertToDB, 
  updateInDB,
  deleteInDB
} from '../data';
import { 
  Building2, 
  Briefcase, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Globe, 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  ArrowRight,
  Info 
} from 'lucide-react';

interface MitraDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function MitraDashboard({ user, onLogout }: MitraDashboardProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'profil' | 'lowongan' | 'pelamar' | 'survei'>('ringkasan');
  
  // Data States
  const [mitraData, setMitraData] = useState<Mitra | null>(null);
  const [myJobs, setMyJobs] = useState<Lowongan[]>([]);
  const [myApplicants, setMyApplicants] = useState<PengajuanMagang[]>([]);
  const [mySurveys, setMySurveys] = useState<SurveiLulusan[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form States
  const [namaInstansi, setNamaInstansi] = useState('');
  const [bidangIndustri, setBidangIndustri] = useState('Teknologi Informasi & Software');
  const [alamat, setAlamat] = useState('');
  const [kontakPerson, setKontakPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Add Job Form States
  const [showAddJob, setShowAddJob] = useState(false);
  const [judul, setJudul] = useState('');
  const [tipe, setTipe] = useState<'magang' | 'kerja'>('magang');
  const [lokasi, setLokasi] = useState('Kendari (On-site)');
  const [deskripsi, setDeskripsi] = useState('');
  const [kualifikasi, setKualifikasi] = useState('');
  const [benefit, setBenefit] = useState('');
  const [kuota, setKuota] = useState(3);
  const [deadline, setDeadline] = useState('');

  // Survey Form States
  const [selectedAlumniId, setSelectedAlumniId] = useState('');
  const [kualitasLulusan, setKualitasLulusan] = useState(5);
  const [kemampuanTeknis, setKemampuanTeknis] = useState(5);
  const [kemampuanKomunikasi, setKemampuanKomunikasi] = useState(4);
  const [etikaKerja, setEtikaKerja] = useState(5);
  const [kemampuanKerjaTim, setKemampuanKerjaTim] = useState(5);
  const [surveiSaran, setSurveiSaran] = useState('');

  // Load specific Partner record
  const loadMitraData = () => {
    const list = getFromDB<Mitra>('mitra');
    let mit = list.find(m => m.userId === user.id);

    if (!mit) {
      // Auto seed blank partner item
      const newMit: Mitra = {
        id: `mtr_${Date.now()}`,
        userId: user.id,
        namaInstansi: user.name.split('(')[0].trim() || 'Instansi Kemitraan Baru',
        bidangIndustri: 'Teknologi Informasi & Software',
        alamat: '',
        kontakPerson: user.name,
        email: user.email,
        phone: user.phone || '',
        website: '',
        statusKerjaSama: 'aktif'
      };
      insertToDB<Mitra>('mitra', newMit);
      mit = newMit;
    }

    setMitraData(mit);
    setNamaInstansi(mit.namaInstansi || '');
    setBidangIndustri(mit.bidangIndustri || 'Teknologi Informasi & Software');
    setAlamat(mit.alamat || '');
    setKontakPerson(mit.kontakPerson || '');
    setPhone(mit.phone || '');
    setWebsite(mit.website || '');

    // Load related postings
    const lowongans = getFromDB<Lowongan>('lowongan');
    const partnerPostings = lowongans.filter(l => l.mitraId === mit.id);
    setMyJobs(partnerPostings);

    // Load related candidates/applicants
    const candidates = getFromDB<PengajuanMagang>('pengajuan_magang');
    const jobIds = partnerPostings.map(p => p.id);
    const partnerCandidates = candidates.filter(c => c.lowonganId && jobIds.includes(c.lowonganId));
    setMyApplicants(partnerCandidates);

    // Load surveys
    const surveys = getFromDB<SurveiLulusan>('survei_lulusan');
    const partnerSurveys = surveys.filter(s => s.mitraId === mit.id);
    setMySurveys(partnerSurveys);
  };

  useEffect(() => {
    loadMitraData();
  }, [user.id]);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Profile Save (FR-MTR-02)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitraData) return;

    if (!namaInstansi) {
      triggerToast('error', 'Nama instansi wajib diisi');
      return;
    }

    const updatedMitra: Mitra = {
      ...mitraData,
      namaInstansi,
      bidangIndustri,
      alamat,
      kontakPerson,
      phone,
      website
    };

    updateInDB<Mitra>('mitra', updatedMitra);
    setMitraData(updatedMitra);

    // Update lowongan instance names for consistency
    const allJobs = getFromDB<Lowongan>('lowongan');
    const recalculatedJobs = allJobs.map(j => {
      if (j.mitraId === mitraData.id) {
        return { ...j, namaInstansi };
      }
      return j;
    });
    saveToDB('lowongan', recalculatedJobs);

    triggerToast('success', 'Profil mitra berhasil disimpan ke database SQL server kampus.');
  };

  // Add job posting (FR-MTR-03)
  const handleAddJobPosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitraData) return;

    if (!judul || !deadline) {
      triggerToast('error', 'Semua field wajib bintang wajib diisi');
      return;
    }

    const newJob: Lowongan = {
      id: `low_${Date.now()}`,
      mitraId: mitraData.id,
      createdBy: user.id,
      judul,
      tipe,
      namaInstansi: mitraData.namaInstansi,
      lokasi,
      deskripsi,
      kualifikasi: kualifikasi.split('\n').filter(k => k.trim() !== ''),
      benefit: benefit.split('\n').filter(b => b.trim() !== ''),
      kuota,
      deadline,
      status: 'published', // standard published immediately in demo for easy testing
      createdAt: new Date().toISOString()
    };

    insertToDB<Lowongan>('lowongan', newJob);

    // Reset fields
    setJudul('');
    setDeskripsi('');
    setKualifikasi('');
    setBenefit('');
    setKuota(3);
    setDeadline('');
    setShowAddJob(false);

    loadMitraData();
    triggerToast('success', 'Lowongan baru berhasil diposting aktif ke halaman publik.');
  };

  // Change job status draft/closed (FR-MTR-04)
  const handleToggleJobStatus = (jobId: string, currentStatus: any) => {
    const allJobs = getFromDB<Lowongan>('lowongan');
    const target = allJobs.find(j => j.id === jobId);
    if (target) {
      target.status = currentStatus === 'published' ? 'closed' : 'published';
      updateInDB<Lowongan>('lowongan', target);
      loadMitraData();
      triggerToast('success', `Status lowongan berhasil diubah menjadi ${target.status === 'published' ? 'AKTIF/PUBLISHED' : 'DITUTUP'}.`);
    }
  };

  // Delete Job Posting safely
  const handleDeleteJob = (jobId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus lowongan ini dari server? Semua histori pelamar akan diarsipkan.')) {
      deleteInDB('lowongan', jobId);
      loadMitraData();
      triggerToast('success', 'Lowongan berhasil dihapus dari database.');
    }
  };

  // Handle Candidate Status Accept/Reject (FR-MTR-05)
  const handleUpdateApplicantStatus = (applId: string, decision: 'accepted' | 'rejected' | 'revision') => {
    const allAppls = getFromDB<PengajuanMagang>('pengajuan_magang');
    const target = allAppls.find(a => a.id === applId);
    if (target) {
      target.status = decision;
      target.catatanAdmin = `Diproses langsung oleh HRD Mitra (${mitraData?.namaInstansi}) : ${
        decision === 'accepted' ? 'Diterima magang.' : decision === 'rejected' ? 'Maaf, berkas ditolak.' : 'Harap revisi kelengkapan transkrip.'
      }`;
      updateInDB<PengajuanMagang>('pengajuan_magang', target);
      loadMitraData();
      triggerToast('success', `Status pelamar berhasil diperbarui menjadi ${decision.toUpperCase()}.`);
    }
  };

  // Submit survey (FR-MTR-06)
  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitraData) return;

    const surveyId = `sv_${Date.now()}`;
    const newSurvey: SurveiLulusan = {
      id: surveyId,
      mitraId: mitraData.id,
      namaInstansi: mitraData.namaInstansi,
      alumniId: selectedAlumniId || undefined,
      kualitasLulusan,
      kemampuanTeknis,
      kemampuanKomunikasi,
      etikaKerja,
      kemampuanKerjaTim,
      saran: surveiSaran || undefined,
      submittedAt: new Date().toISOString()
    };

    insertToDB<SurveiLulusan>('survei_lulusan', newSurvey);
    setSelectedAlumniId('');
    setSurveiSaran('');
    loadMitraData();
    triggerToast('success', 'Kuesioner survei kepuasan mitra berhasil di-upload dan disimpan di rekap admin.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="mtr-dashboard">
      {/* LOCAL TOAST NOTIFIER */}
      {message && (
        <div 
          id="mtr-toast"
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm max-w-sm flex items-center gap-2.5 transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <div>{message.text}</div>
        </div>
      )}

      {/* HEADER BANNER */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40" id="mtr-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">PORTAL MITRA INDUSTRI</div>
              <div className="text-slate-400 text-xs text-[10px] sm:text-xs">CDC Universitas Muhammadiyah Kendari</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-xs text-white leading-none">{namaInstansi || user.name}</div>
              <div className="text-emerald-400 text-[10px] font-medium leading-tight mt-0.5">PIC: {kontakPerson}</div>
            </div>
            <button 
              onClick={onLogout}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition"
              id="mtr-btn-logout"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD WEB CORE GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8" id="mtr-grid-layout">
        
        {/* SIDEBAR NAVIGATION CONTROLS */}
        <aside className="lg:col-span-3 space-y-6" id="mtr-sidebar">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center font-bold text-base">
                {namaInstansi ? namaInstansi.charAt(0) : 'M'}
              </div>
              <div className="truncate">
                <div className="font-bold text-slate-900 text-sm truncate">{namaInstansi || 'Instansi Mitra'}</div>
                <div className="text-slate-400 text-xs truncate">{user.email}</div>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5" id="mtr-nav-menu">
              {[
                { id: 'ringkasan', label: 'Ringkasan Kerja', icon: Building2 },
                { id: 'profil', label: 'Profil Instansi', icon: FileText },
                { id: 'lowongan', label: 'Kelola Lowongan', icon: Briefcase },
                { id: 'pelamar', label: 'Pelamar & Seleksi', icon: Users },
                { id: 'survei', label: 'Survei Mutu Lulusan', icon: Star }
              ].map((menu) => {
                const Icon = menu.icon;
                return (
                  <button
                    key={menu.id}
                    id={`mtr-tab-${menu.id}`}
                    onClick={() => {
                      setActiveTab(menu.id as any);
                      setShowAddJob(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === menu.id
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {menu.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-slate-900 text-slate-400 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-3" id="mtr-side-status">
            <h4 className="font-bold text-white text-xs uppercase tracking-wide">Status Kemitraan</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Kerja Sama:</span>
                <span className="font-bold text-emerald-400">AKTIF / APPROVED</span>
              </div>
              <div className="flex justify-between">
                <span>Lowongan Aktif:</span>
                <span className="font-bold text-white">{myJobs.filter(j => j.status === 'published').length} Post</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CORE CONTENT DISPLAY BOARD */}
        <main className="lg:col-span-9" id="mtr-dashboard-main">
          
          {/* TAB 1: RINGKASAN */}
          {activeTab === 'ringkasan' && (
            <div id="mtr-panel-ringkasan" className="space-y-6">
              {/* INTERACTIVE SHINE WELCOME BANNER */}
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex items-center justify-between" id="mtr-welcome">
                <div className="space-y-2 max-w-lg z-14">
                  <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/10">Mitra Resmi Kampus</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Selamat Datang, Bapak/Ibu {kontakPerson}</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Sistem multi-roles portal CDC memfasilitasi Anda memposting lowongan rekrutmen magang, mengunduh lampiran berkas mahasiswa, dan menyetujui program akselerasi.
                  </p>
                </div>
                <div className="hidden md:block opacity-10">
                  <Building2 className="w-20 h-20 text-emerald-400" />
                </div>
              </div>

              {/* METRIC ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="mtr-card-stats">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-wide">Total Lowongan</div>
                  <div className="text-2xl font-extrabold text-slate-800">{myJobs.length} Posisi</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-wide">Menunggu Tinjauan</div>
                  <div className="text-2xl font-extrabold text-emerald-600">{myApplicants.filter(a => a.status === 'submitted' || a.status === 'under_review').length} Mahasiswa</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-wide">Hasil Survei Mutu</div>
                  <div className="text-2xl font-extrabold text-blue-600">{mySurveys.length} Respon</div>
                </div>
              </div>

              {/* LATEST APPLICANTS PREVIEW (FR-MTR-05) */}
              <div className="space-y-4" id="latest-applicants-sec">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">Pelamar Magang Terbaru</h4>
                  <button onClick={() => setActiveTab('pelamar')} className="text-emerald-500 hover:underline text-xs font-bold">Semua Pelamar</button>
                </div>

                {myApplicants.length === 0 ? (
                  <div className="bg-white p-8 border border-slate-100 rounded-2xl text-center text-xs text-slate-500">
                    Belum ada mahasiswa yang melamar pada postingan lowongan Anda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApplicants.slice(0, 2).map((appl) => (
                      <div key={appl.id} className="bg-white p-5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-850 text-sm">{appl.namaMahasiswa}</h5>
                          <div className="text-xs text-slate-550 flex items-center gap-1.5 font-medium">
                            NIM: {appl.nim} • Prodi: {appl.programStudi}
                          </div>
                          <div className="text-[10px] text-slate-400">Tujuan: <span className="font-semibold text-slate-750">{appl.tujuanMagang}</span></div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => triggerToast('success', 'Mengunduh CV & Berkas (Simulasi)...')}
                            className="text-emerald-600 hover:underline text-xs font-bold"
                          >
                            Unduh Berkas
                          </button>
                          <span className="text-slate-200">|</span>
                          <button 
                            onClick={() => setActiveTab('pelamar')}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            Tinjau
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PROFIL INSTANSI (FR-MTR-02) */}
          {activeTab === 'profil' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mtr-panel-profil">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Kelola Identitas Profil Instansi</h3>
                <p className="text-xs text-slate-400">Informasi ini akan ditampilkan pada lembar detail lowongan di halaman publik CDC.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5" id="profile-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="profile-inputs">
                  <div className="space-y-1.5 col-span-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Nama Lengkap Instansi / Perusahaan *</label>
                    <input 
                      type="text" 
                      required
                      value={namaInstansi}
                      onChange={(e) => setNamaInstansi(e.target.value)}
                      placeholder="Contoh: PT Go Digital Kendari"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Sektor Industri Kemitraan</label>
                    <input 
                      type="text" 
                      value={bidangIndustri}
                      onChange={(e) => setBidangIndustri(e.target.value)}
                      placeholder="Contoh: Perbankan Syariah"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Petugas Penghubung / PIC *</label>
                    <input 
                      type="text" 
                      required
                      value={kontakPerson}
                      onChange={(e) => setKontakPerson(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nomor Telepon / Hotline *</label>
                    <input 
                      type="text" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-755">Situs Web Resmi (Website URL)</label>
                    <input 
                      type="text" 
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-755">Alamat Lengkap Kantor Pusat / Regional *</label>
                  <textarea 
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Jl. Ahmad Dahlan, Kendari"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Simpan Perubahan Database
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: KELOLA LOWONGAN (FR-MTR-03 & FR-MTR-04) */}
          {activeTab === 'lowongan' && (
            <div className="space-y-6" id="mtr-panel-lowongan">
              
              {/* TOP BAR ACTION TRIGGER */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-950 text-lg">Manajemen Database Postingan</h3>
                  <p className="text-xs text-slate-400">Kelola kuota, deadline, and tipe lowongan magang atau kerja lulusan Anda.</p>
                </div>
                <button 
                  onClick={() => setShowAddJob(!showAddJob)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  {showAddJob ? "Sembunyikan Form" : "Posting Lowongan Baru"}
                </button>
              </div>

              {/* ADD VACANCY FORM SCREEN */}
              {showAddJob && (
                <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-6" id="add-vacancy-panel">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-500" /> Form Input Lowongan Kerja / Magang Baru
                  </h4>

                  <form onSubmit={handleAddJobPosting} className="space-y-5 text-xs font-bold" id="add-job-form">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Judul Rekrutmen Karir *</label>
                        <input 
                          type="text" 
                          required
                          value={judul}
                          onChange={(e) => setJudul(e.target.value)}
                          placeholder="Contoh: Digital Marketer Intern"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Lokasi Penempatan Kerja *</label>
                        <input 
                          type="text" 
                          required
                          value={lokasi}
                          onChange={(e) => setLokasi(e.target.value)}
                          placeholder="Contoh: Kendari (Hybrid)"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Tipe Lowongan *</label>
                        <select 
                          value={tipe}
                          onChange={(e) => setTipe(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-normal"
                        >
                          <option value="magang">Magang (Mahasiswa Aktif)</option>
                          <option value="kerja">Kerja (Lulusan Baru / Alumni)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Rencana Kuota Penerimaan (Orang)</label>
                        <input 
                          type="number" 
                          value={kuota}
                          onChange={(e) => setKuota(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Batas Tanggal Pendaftaran (Deadline) *</label>
                        <input 
                          type="date" 
                          required
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Deskripsi Ringkas Pekerjaan *</label>
                      <textarea 
                        required
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        rows={3}
                        placeholder="Uraikan gambaran umum, teknologi yang dipakai..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Kualifikasi Persyaratan (Satu baris untuk setiap poin kualifikasi)</label>
                      <textarea 
                        value={kualifikasi}
                        onChange={(e) => setKualifikasi(e.target.value)}
                        rows={3}
                        placeholder="Contoh:&#10;Mahasiswa Teknik Informatika semester 6&#10;Menguasai bahasa pemrograman Javascript"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Benefit Kompensasi (Satu baris untuk setiap poin benefit)</label>
                      <textarea 
                        value={benefit}
                        onChange={(e) => setBenefit(e.target.value)}
                        rows={3}
                        placeholder="Contoh:&#10;Uang saku bulanan&#10;Sertifikat industri dari mitra"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowAddJob(false)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 border border-slate-150 transition"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Posting ke Publik
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* LISTING VACANCIES */}
              {myJobs.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-xs text-slate-500">
                  Instansi Anda belum memiliki postingan lowongan karir aktif.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="mitra-job-list">
                  {myJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between" id={`job-box-${job.id}`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            job.tipe === 'magang' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {job.tipe}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                            job.status === 'published' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {job.status === 'published' ? 'Aktif' : 'Tutup'}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-500 transition-colors text-sm sm:text-base">{job.judul}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block">Deadline: {job.deadline}</span>
                        </div>

                        <p className="text-slate-650 text-xs sm:text-sm line-clamp-2 leading-relaxed">{job.deskripsi}</p>
                      </div>

                      {/* ACTIONS BAR */}
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-4">
                        <button 
                          onClick={() => handleToggleJobStatus(job.id, job.status)}
                          className="text-emerald-650 hover:text-emerald-700 font-bold text-xs"
                        >
                          {job.status === 'published' ? 'Draft/Tutup' : 'Publish/Aktif'}
                        </button>

                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Hapus Lowongan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DAFTAR PELAMAR (FR-MTR-05) */}
          {activeTab === 'pelamar' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mtr-panel-pelamar">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Pelamar & Berkas Calon Peserta Magang</h3>
                <p className="text-xs text-slate-400">Verifikasi berkas, baca CV, and ubah status kelayakan pelamar untuk penempatan magang industri.</p>
              </div>

              {myApplicants.length === 0 ? (
                <div className="text-center py-12" id="applicants-empty">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs text-slate-500">Belum ada pelamar masuk.</div>
                </div>
              ) : (
                <div className="overflow-x-auto" id="applicants-table-container">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-3 px-4">Nama Pelamar</th>
                        <th className="py-3 px-4">Instansi/Proyek</th>
                        <th className="py-3 px-4">Rentang Tanggal</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Aksi Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700" id="applicants-table-body">
                      {myApplicants.map((appl) => (
                        <tr key={appl.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="py-4 px-4 font-semibold text-slate-900">
                            <div>{appl.namaMahasiswa}</div>
                            <span className="text-[10px] text-slate-400 block font-normal">NIM: {appl.nim} • {appl.programStudi}</span>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">{appl.tujuanMagang}</td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {appl.tanggalMulai} s/d {appl.tanggalSelesai}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              appl.status === 'accepted' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : appl.status === 'rejected' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            }`}>
                              {appl.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap space-x-2">
                            <button 
                              onClick={() => triggerToast('success', `Simulasi download berkas lamaran ${appl.namaMahasiswa}...`)}
                              className="text-emerald-600 hover:underline text-xs font-bold"
                            >
                              Berkas
                            </button>
                            <span className="text-slate-250">|</span>
                            <button 
                              onClick={() => handleUpdateApplicantStatus(appl.id, 'accepted')}
                              className="text-green-600 hover:text-green-700 text-xs font-bold"
                            >
                              Terima
                            </button>
                            <button 
                              onClick={() => handleUpdateApplicantStatus(appl.id, 'rejected')}
                              className="text-rose-500 hover:text-rose-600 text-xs font-bold"
                            >
                              Tolak
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SURVEI PENGGUNA LULUSAN (FR-MTR-06) */}
          {activeTab === 'survei' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mtr-panel-survei">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Survei Kepuasan Mutu Pengguna Lulusan</h3>
                <p className="text-xs text-slate-400">Tanggapan evaluasi Anda sangat penting bagi monitoring akreditasi dekanat fakultas.</p>
              </div>

              <form onSubmit={handleSubmitSurvey} className="space-y-6" id="survey-feedback-form">
                <div className="space-y-1.5 text-xs font-bold">
                  <label className="text-slate-700 text-xs">Pilih Alumni Terkait (Karyawan/Magang) *</label>
                  <select 
                    required
                    value={selectedAlumniId}
                    onChange={(e) => setSelectedAlumniId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal bg-white"
                  >
                    <option value="">-- Silakan Pilih Lulusan --</option>
                    <option value="alm_1_fadly">Muhammad Fadly Alamsyah (Teknik Informatika)</option>
                    <option value="alm_2_faisal">Fachrul Alam Prasetyo, S.Kom. (Teknik Informatika)</option>
                    <option value="alm_3_mega">Andi Megawati, S.E. (Manajemen)</option>
                  </select>
                </div>

                {/* FIVE CORE DIMENSIONS RATING FOR SURVEI_LULUSAN */}
                <div className="space-y-4 border-t border-slate-50 pt-4" id="survei-ratings">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Skor Evaluasi (Skala 1 - 5)</h4>
                  
                  {[
                    { label: 'Kualitas Umum Kinerja Lulusan', state: kualitasLulusan, setter: setKualitasLulusan },
                    { label: 'Kemampuan Teknis Keilmuan', state: kemampuanTeknis, setter: setKemampuanTeknis },
                    { label: 'Cakupan Kemampuan Komunikasi', state: kemampuanKomunikasi, setter: setKemampuanKomunikasi },
                    { label: 'Etika, Kedisiplinan & Sikap', state: etikaKerja, setter: setEtikaKerja },
                    { label: 'Kolaborasi & Kemampuan Kerja Tim', state: kemampuanKerjaTim, setter: setKemampuanKerjaTim }
                  ].map((dim, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl" id={`dim-row-${i}`}>
                      <span className="text-xs font-semibold text-slate-700">{dim.label}</span>
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          value={dim.state}
                          onChange={(e) => dim.setter(Number(e.target.value))}
                          className="w-32 accent-emerald-500 rounded-lg cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-xs border bg-white px-2.5 py-1 rounded-md min-w-[30px] text-center font-mono">{dim.state} ★</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-50">
                  <label className="text-xs font-bold text-slate-700">Tanggapan, Kesan & Saran Perbaikan Akademis</label>
                  <textarea 
                    value={surveiSaran}
                    onChange={(e) => setSurveiSaran(e.target.value)}
                    rows={4}
                    placeholder="Uraikan kelebihan lulusan serta kritik penyelarasan kurikulum Anda..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Kirim Hasil Evaluasi Mutu
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
