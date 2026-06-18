/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User as UserType, 
  Mahasiswa, 
  Lowongan, 
  PengajuanMagang, 
  UploadedDocument,
  StatusPengajuan
} from '../types';
import { 
  getFromDB, 
  saveToDB, 
  insertToDB, 
  updateInDB 
} from '../data';
import { 
  Briefcase, 
  User as UserIcon, 
  FileText, 
  Clock, 
  History, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  File, 
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Building2
} from 'lucide-react';

interface MahasiswaDashboardProps {
  user: UserType;
  onLogout: () => void;
  allLowongan: Lowongan[];
}

export default function MahasiswaDashboard({ user, onLogout, allLowongan }: MahasiswaDashboardProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'profil' | 'pengajuan' | 'berkas' | 'riwayat'>('ringkasan');
  
  // Data States
  const [mahasiswaData, setMahasiswaData] = useState<Mahasiswa | null>(null);
  const [myPengajuan, setMyPengajuan] = useState<PengajuanMagang[]>([]);
  const [myDocs, setMyDocs] = useState<UploadedDocument[]>([]);
  
  // Notifications or toast simulation
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields for Profil
  const [nim, setNim] = useState('');
  const [phone, setPhone] = useState('');
  const [programStudi, setProgramStudi] = useState('Teknik Informatika');
  const [fakultas, setFakultas] = useState('Fakultas Teknik');
  const [angkatan, setAngkatan] = useState('2022');
  const [semester, setSemester] = useState(6);
  const [alamat, setAlamat] = useState('');

  // Form Fields for Pengajuan Magang
  const [selectedLowonganId, setSelectedLowonganId] = useState('');
  const [tujuanMagang, setTujuanMagang] = useState('');
  const [lokasiMagang, setLokasiMagang] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  
  // File upload simulation fields
  const [dekanFile, setDekanFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  // Load student personal record or initialize it
  const loadStudentData = () => {
    const students = getFromDB<Mahasiswa>('mahasiswa');
    let stud = students.find(m => m.userId === user.id);
    
    if (!stud) {
      // Create student entry on the fly representing empty record
      const newStud: Mahasiswa = {
        id: `mhs_${Date.now()}`,
        userId: user.id,
        nim: '',
        nama: user.name,
        email: user.email,
        phone: user.phone || '',
        programStudi: 'Teknik Informatika',
        fakultas: 'Fakultas Teknik',
        angkatan: '2022',
        semester: 6,
        alamat: ''
      };
      insertToDB<Mahasiswa>('mahasiswa', newStud);
      stud = newStud;
    }
    
    setMahasiswaData(stud);
    
    // Set profile inputs
    setNim(stud.nim || '');
    setPhone(stud.phone || '');
    setProgramStudi(stud.programStudi || 'Teknik Informatika');
    setFakultas(stud.fakultas || 'Fakultas Teknik');
    setAngkatan(stud.angkatan || '2022');
    setSemester(stud.semester || 6);
    setAlamat(stud.alamat || '');

    // Load Applications and Documents
    const appls = getFromDB<PengajuanMagang>('pengajuan_magang');
    const myAppls = appls.filter(a => a.userId === user.id);
    setMyPengajuan(myAppls);

    const docs = getFromDB<UploadedDocument>('uploaded_documents');
    const myUploadedDocs = docs.filter(d => d.ownerUserId === user.id);
    setMyDocs(myUploadedDocs);
  };

  useEffect(() => {
    loadStudentData();
  }, [user.id]);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Profile Save Action (FR-MHS-02)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mahasiswaData) return;

    if (!nim) {
      triggerToast('error', 'NIM wajib diisi');
      return;
    }

    const updatedStudent: Mahasiswa = {
      ...mahasiswaData,
      nim,
      phone,
      programStudi,
      fakultas,
      angkatan,
      semester: Number(semester),
      alamat
    };

    updateInDB<Mahasiswa>('mahasiswa', updatedStudent);
    
    // Also save user basic records back
    const users = getFromDB<UserType>('users');
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, name: user.name, phone };
      }
      return u;
    });
    saveToDB('users', updatedUsers);

    setMahasiswaData(updatedStudent);
    triggerToast('success', 'Profil mahasiswa berhasil diperbarui di database SQL.');
  };

  // Quick select prefilled lowongan
  const handleSelectJobPreset = (jobId: string) => {
    const job = allLowongan.find(l => l.id === jobId);
    if (job) {
      setSelectedLowonganId(job.id);
      setTujuanMagang(job.judul);
      setLokasiMagang(job.lokasi);
    }
  };

  // Submit Application Form (FR-MHS-04 & FR-MHS-05)
  const handleSubmitPengajuan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mahasiswaData) return;

    if (!nim) {
      triggerToast('error', 'Lengkapi profil (NIM Anda) terlebih dahulu pada tab Profil.');
      return;
    }
    if (!tujuanMagang) {
      triggerToast('error', 'Tujuan instansi magang wajib diisi.');
      return;
    }
    if (!tanggalMulai || !tanggalSelesai) {
      triggerToast('error', 'Tanggal mulai dan selesai wajib diisi.');
      return;
    }
    
    // Simple date validator
    if (new Date(tanggalMulai) > new Date(tanggalSelesai)) {
      triggerToast('error', 'Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }

    const pengajuanId = `pj_${Date.now()}`;
    const newPengajuan: PengajuanMagang = {
      id: pengajuanId,
      mahasiswaId: mahasiswaData.id,
      userId: user.id,
      lowonganId: selectedLowonganId || undefined,
      namaMahasiswa: user.name,
      nim: nim,
      programStudi: programStudi,
      tujuanMagang: tujuanMagang,
      lokasiMagang: lokasiMagang || undefined,
      tanggalMulai,
      tanggalSelesai,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    insertToDB<PengajuanMagang>('pengajuan_magang', newPengajuan);

    // Save corresponding dummy files
    const fileMocks = [
      { name: dekanFile ? dekanFile.name : 'Surat_Pengantar_Dekan.pdf', type: 'surat_pengantar' as const },
      { name: cvFile ? cvFile.name : 'CV_Lengkap_Mahasiswa.pdf', type: 'cv' as const },
      { name: transcriptFile ? transcriptFile.name : 'Transkrip_Akademis.pdf', type: 'transkrip' as const }
    ];

    fileMocks.forEach((f, index) => {
      const docId = `doc_${Date.now()}_${index}`;
      const newDoc: UploadedDocument = {
        id: docId,
        ownerUserId: user.id,
        pengajuanId: pengajuanId,
        name: f.name,
        type: f.type,
        fileUrl: '#simulated-url',
        mimeType: 'application/pdf',
        sizeBytes: Math.floor(Math.random() * 2000000) + 500000,
        uploadedAt: new Date().toISOString()
      };
      insertToDB<UploadedDocument>('uploaded_documents', newDoc);
    });

    // Reset Form
    setSelectedLowonganId('');
    setTujuanMagang('');
    setLokasiMagang('');
    setTanggalMulai('');
    setTanggalSelesai('');
    setDekanFile(null);
    setCvFile(null);
    setTranscriptFile(null);

    // Refresh Local States
    loadStudentData();
    setActiveTab('ringkasan');
    triggerToast('success', 'Pendaftaran magang berhasil diajukan dengan 3 file berkas wajib.');
  };

  // Get active status object
  const activePengajuan = myPengajuan[myPengajuan.length - 1];

  // Helper label translating
  const getStatusLabel = (status: StatusPengajuan) => {
    switch (status) {
      case 'draft': return { text: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'submitted': return { text: 'Submitted / Dikirim', color: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'under_review': return { text: 'Under Review / Diverifikasi', color: 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' };
      case 'revision': return { text: 'Revisi Berkas', color: 'bg-rose-50 text-rose-600 border-rose-200' };
      case 'accepted': return { text: 'Diterima Magang', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'rejected': return { text: 'Ditolak', color: 'bg-red-50 text-red-600 border-red-200' };
      case 'ongoing': return { text: 'Sedang Berjalan', color: 'bg-teal-50 text-teal-600 border-teal-200' };
      case 'report_submitted': return { text: 'Laporan Dikirim', color: 'bg-purple-50 text-purple-600 border-purple-200' };
      case 'completed': return { text: 'Magang Selesai', color: 'bg-green-100 text-green-800 border-green-300' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="mhs-dashboard">
      {/* LOCAL TOAST NOTIFIER */}
      {message && (
        <div 
          id="mhs-toast" 
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm max-w-sm flex items-center gap-3 transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <div>{message.text}</div>
        </div>
      )}

      {/* HEADER BANNER */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40" id="mhs-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">PORTAL MAHASISWA</div>
              <div className="text-slate-400 text-xs text-[10px] sm:text-xs">CDC Universitas Muhammadiyah Kendari</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-xs text-white leading-none">{user.name}</div>
              <div className="text-emerald-400 text-[10px] font-medium leading-tight">NIM: {nim || 'Belum diatur'}</div>
            </div>
            <button 
              onClick={onLogout}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition"
              id="mhs-btn-logout"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD OUTER CORE CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8" id="mhs-grid-layout">
        
        {/* SIDEBAR NAVIGATION CONTROL */}
        <aside className="lg:col-span-3 space-y-6" id="mhs-sidebar col">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center font-bold text-base">
                {user.name.charAt(0)}
              </div>
              <div className="truncate">
                <div className="font-bold text-slate-900 text-sm truncate">{user.name}</div>
                <div className="text-slate-400 text-xs truncate">{user.email}</div>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5" id="mhs-nav-menu">
              {[
                { id: 'ringkasan', label: 'Ringkasan Saya', icon: Layers },
                { id: 'profil', label: 'Profil Akademis', icon: UserIcon },
                { id: 'pengajuan', label: 'Ajukan Magang Baru', icon: Briefcase },
                { id: 'berkas', label: 'File & Berkas', icon: FileText },
                { id: 'riwayat', label: 'Riwayat Konsul', icon: History }
              ].map((menu) => {
                const Icon = menu.icon;
                return (
                  <button
                    key={menu.id}
                    id={`mhs-tab-${menu.id}`}
                    onClick={() => setActiveTab(menu.id as any)}
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

          {/* SYSTEM SIDEBAR INFO METRIC */}
          <div className="bg-slate-900 text-slate-400 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-3" id="mhs-side-status">
            <h4 className="font-bold text-white text-xs uppercase tracking-wide">Status Akademis</h4>
            <div className="space-y-1.5 text-xs text-[11px] sm:text-xs">
              <div className="flex justify-between">
                <span>Semester Aktif:</span>
                <span className="font-bold text-emerald-400">{semester}</span>
              </div>
              <div className="flex justify-between">
                <span>Angkatan:</span>
                <span className="font-bold text-white">{angkatan}</span>
              </div>
              <div className="flex justify-between">
                <span>Fakultas:</span>
                <span className="font-bold text-white max-w-[120px] truncate block text-right">{fakultas}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CORE CONTENT DISPLAY BOARD */}
        <main className="lg:col-span-9" id="mhs-dashboard-main">
          
          {/* TAB 1: RINGKASAN */}
          {activeTab === 'ringkasan' && (
            <div id="mhs-panel-ringkasan" className="space-y-6">
              {/* WELCOME SECTION */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex items-center justify-between" id="mhs-welcome">
                <div className="space-y-2 max-w-lg z-10" id="welcome-col-left">
                  <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/10">Mahasiswa Aktif</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ahlan wa Sahlan, {user.name}</h3>
                  <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
                    Ajukan lembar magang legal, pantau status verifikasi, dan penuhi tracer study penyerapan lulusan di Kampus Kebanggaan Sulawesi Tenggara.
                  </p>
                </div>
                <div className="hidden md:block opacity-10 blur-0">
                  <Sparkles className="w-20 h-20 text-emerald-400" />
                </div>
              </div>

              {/* ACTIVE APPLICATION TRACKING STEP (FR-MHS-06) */}
              {activePengajuan ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="active-tracking-box">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Status Berjalan Pengajuan Magang Anda</h4>
                      <p className="text-xs text-slate-400 font-medium">Diajukan pada: {new Date(activePengajuan.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    {(() => {
                      const badgeObj = getStatusLabel(activePengajuan.status);
                      return (
                        <span className={`px-3 py-1 rounded-full font-bold text-xs border uppercase tracking-wider ${badgeObj?.color}`}>
                          {badgeObj?.text}
                        </span>
                      );
                    })()}
                  </div>

                  {/* VISUAL LAYOUT STEPS MAP */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="mhs-steps-visualizer">
                    {[
                      { step: 'Isi & Terbit', done: true, label: 'Submitted' },
                      { step: 'Verifikasi Berkas', done: ['under_review', 'accepted', 'ongoing', 'completed'].includes(activePengajuan.status), label: 'Verification' },
                      { step: 'Diterima Mitra', done: ['accepted', 'ongoing', 'completed'].includes(activePengajuan.status), label: 'Accepted' },
                      { step: 'Laporan Selesai', done: activePengajuan.status === 'completed', label: 'Completed' }
                    ].map((st, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-xl border flex items-center gap-3 ${
                          st.done 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          st.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {i+1}
                        </div>
                        <div>
                          <div className="font-bold text-xs leading-none">{st.step}</div>
                          <div className="text-[10px] text-slate-400 font-medium font-mono">{st.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ADMIN RESPONSE FEEDBACK AND REMARKS */}
                  {activePengajuan.catatanAdmin && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-2" id="verified-comments">
                      <Info className="w-5 h-5 text-slate-500 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Catatan Administrator CDC:</div>
                        <p className="text-xs text-slate-600 italic mt-0.5">"{activePengajuan.catatanAdmin}"</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500 text-xs flex justify-between">
                    <span>Perusahaan Tujuan:</span>
                    <span className="font-bold text-slate-800">{activePengajuan.tujuanMagang}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center space-y-4" id="mhs-empty-state">
                  <Info className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Belum Ada Pengajuan Magang Aktif</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">Anda belum melengkapi form pendaftaran magang atau mengajukan berkas hukum CDC.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('pengajuan')} 
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto"
                  >
                    Mulai Ajukan Sekarang <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* RECOMMENDED PLACEMENT FROM MITRA */}
              <div className="space-y-4" id="placement-recommendations">
                <h4 className="font-bold text-slate-800 text-sm">Rekomendasi Lowongan Magang CDC</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="placement-recommendations-grid">
                  {allLowongan.filter(l => l.tipe === 'magang' && l.status === 'published').slice(0, 2).map((job) => (
                    <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id={`recom-card-${job.id}`}>
                      <div className="space-y-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold text-[10px] border border-emerald-100">Rekomendasi</span>
                        <h5 className="font-bold text-slate-850 text-sm line-clamp-1">{job.judul}</h5>
                        <div className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                          <Building2 className="w-3.5 h-3.5" /> {job.namaInstansi}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveTab('pengajuan');
                          handleSelectJobPreset(job.id);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 mt-4"
                      >
                        Pilih Lowongan <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL AKADEMIS (FR-MHS-02) */}
          {activeTab === 'profil' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mhs-panel-profil">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Kelola Informasi Profil Mahasiswa</h3>
                <p className="text-xs text-slate-400">Pastikan data NIM dan program studi Anda sesuai di sistem aslinya agar surat pengantar magang valid.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5" id="profile-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="profile-form-inputs text-xs">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nomor Induk Mahasiswa (NIM) *</label>
                    <input 
                      type="text" 
                      required
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      placeholder="Contoh: 202101001"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nomor Telepon / WhatsApp</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 0852xxxx"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Program Studi *</label>
                    <select 
                      value={programStudi}
                      onChange={(e) => setProgramStudi(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Manajemen">Manajemen</option>
                      <option value="Pendidikan Bahasa Inggris">Pendidikan Bahasa Inggris</option>
                      <option value="Agribisnis">Agribisnis</option>
                      <option value="Hukum">Hukum</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Fakultas *</label>
                    <select 
                      value={fakultas}
                      onChange={(e) => setFakultas(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value="Fakultas Teknik">Fakultas Teknik</option>
                      <option value="Fakultas Ekonomi dan Bisnis Islam">Fakultas Ekonomi dan Bisnis Islam</option>
                      <option value="Fakultas Hukum">Fakultas Hukum</option>
                      <option value="Fakultas Keguruan dan Ilmu Pendidikan">Fakultas Keguruan dan Ilmu Pendidikan</option>
                      <option value="Fakultas Pertanian">Fakultas Pertanian</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tahun Angkatan *</label>
                    <input 
                      type="text" 
                      required
                      value={angkatan}
                      onChange={(e) => setAngkatan(e.target.value)}
                      placeholder="2022"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Semester Aktif *</label>
                    <input 
                      type="number" 
                      required
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Alamat Tempat Tinggal (Sekarang)</label>
                  <textarea 
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Jl. Ahmad Dahlan, Kendari"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
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

          {/* TAB 3: KIRIM PENGAJUAN MAGANG (FR-MHS-04 & FR-MHS-05) */}
          {activeTab === 'pengajuan' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mhs-panel-pengajuan">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Inisiasi Form Pengajuan Magang</h3>
                <p className="text-xs text-slate-400">Silakan memilih penempatan lowongan mitra resmi di preset kotak, atau mengisi tujuan institusi eksternal khusus mandiri.</p>
              </div>

              {/* JOB CHOOSER BOX COMPACT FOR EASY QUICK ACCESS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-550">Pilih dari Mitra Resmi CDC (Opsional Preset):</div>
                <div className="flex flex-wrap gap-2" id="job-preset-buttons">
                  {allLowongan.filter(l => l.tipe === 'magang' && l.status === 'published').map((job) => (
                    <button 
                      key={job.id}
                      type="button"
                      id={`preset-job-btn-${job.id}`}
                      onClick={() => handleSelectJobPreset(job.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition text-left flex flex-col ${
                        selectedLowonganId === job.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold leading-none">{job.judul}</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[200px]">{job.namaInstansi}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitPengajuan} className="space-y-6" id="submit-application-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Perusahaan / Institusi Penerima Magang *</label>
                    <input 
                      type="text" 
                      required
                      value={tujuanMagang}
                      onChange={(e) => setTujuanMagang(e.target.value)}
                      placeholder="Contoh: PT Go Digital Kendari"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lokasi Penempatan Magang *</label>
                    <input 
                      type="text" 
                      required
                      value={lokasiMagang}
                      onChange={(e) => setLokasiMagang(e.target.value)}
                      placeholder="Contoh: Kendari (On-site)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Rencana Tanggal Mulai *</label>
                    <input 
                      type="date" 
                      required
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Rencana Tanggal Selesai *</label>
                    <input 
                      type="date" 
                      required
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                    />
                  </div>
                </div>

                {/* SIMULATED DOCUMENT FILE UPLOADER (REQUIRING DRAG AND DROP / SELECTION MULTI-MODE AS DIRECTED) */}
                <div className="space-y-4" id="mhs-file-upload-section">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Persyaratan Dokumen Pendukung (Maks 5 MB per File)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="mhs-file-uploader-grid">
                    
                    {/* DOC 1: SURAT PENGANTAR */}
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center space-y-2 bg-slate-50/50 hover:bg-slate-50 transition" id="file-dekan-box">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto text-xs"><Upload className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Surat Pengantar Akademik *</div>
                        <p className="text-[10px] text-slate-400">PDF, tanda tangan dekanat</p>
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDekanFile(e.target.files[0]);
                            triggerToast('success', `Dokumen "${e.target.files[0].name}" disiapkan.`);
                          }
                        }}
                        className="hidden" 
                        id="dekan-uploader-input"
                      />
                      <label 
                        htmlFor="dekan-uploader-input" 
                        className="inline-block px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition shadow-xs"
                      >
                        {dekanFile ? "Ganti File PDF" : "Gali File"}
                      </label>
                      {dekanFile && <div className="text-[10px] text-emerald-600 truncate px-2 font-semibold">✓ {dekanFile.name}</div>}
                    </div>

                    {/* DOC 2: CV */}
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center space-y-2 bg-slate-50/50 hover:bg-slate-50 transition" id="file-cv-box">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto text-xs"><Upload className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Curriculum Vitae (CV) *</div>
                        <p className="text-[10px] text-slate-400">PDF, riwayat karir anda</p>
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCvFile(e.target.files[0]);
                          }
                        }}
                        className="hidden" 
                        id="cv-uploader-input"
                      />
                      <label 
                        htmlFor="cv-uploader-input" 
                        className="inline-block px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition shadow-xs"
                      >
                        {cvFile ? "Ganti File PDF" : "Gali File"}
                      </label>
                      {cvFile && <div className="text-[10px] text-emerald-600 truncate px-2 font-semibold">✓ {cvFile.name}</div>}
                    </div>

                    {/* DOC 3: TRANSCRIPT */}
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center space-y-2 bg-slate-50/50 hover:bg-slate-50 transition" id="file-transcript-box">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto text-xs"><Upload className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Transkrip Nilas Sementara *</div>
                        <p className="text-[10px] text-slate-400">PDF, legalisir KHS kempus</p>
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setTranscriptFile(e.target.files[0]);
                          }
                        }}
                        className="hidden" 
                        id="transcript-uploader-input"
                      />
                      <label 
                        htmlFor="transcript-uploader-input" 
                        className="inline-block px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition shadow-xs"
                      >
                        {transcriptFile ? "Ganti File PDF" : "Gali File"}
                      </label>
                      {transcriptFile && <div className="text-[10px] text-emerald-600 truncate px-2 font-semibold">✓ {transcriptFile.name}</div>}
                    </div>

                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Kirim Pendaftaran Ke Database Server Kampus
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: FILE DAN BERKAS SAYA */}
          {activeTab === 'berkas' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mhs-panel-berkas">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Kelola Berkas Upload Dokumen</h3>
                <p className="text-xs text-slate-400">Daftar dokumen hukum magang yang berhasil di-upload dan tersimpan di database Universitas Muhammadiyah Kendari.</p>
              </div>

              {myDocs.length === 0 ? (
                <div className="text-center py-12" id="berkas-empty">
                  <File className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs text-slate-500">Belum ada files dan dokumen PDF terlampir.</div>
                </div>
              ) : (
                <div className="overflow-x-auto" id="berkas-table-container">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-3 px-4">Nama Dokumen</th>
                        <th className="py-3 px-4">Tipe Berkas</th>
                        <th className="py-3 px-4">Ukuran</th>
                        <th className="py-3 px-4">Di-upload</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50" id="berkas-table-body">
                      {myDocs.map((doc) => (
                        <tr key={doc.id} className="text-slate-700 hover:bg-slate-50/55 transition">
                          <td className="py-4 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <File className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="truncate max-w-[200px] block">{doc.name}</span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[10px] uppercase">{doc.type.replace('_', ' ')}</td>
                          <td className="py-4 px-4 text-slate-500 font-medium font-mono text-[11px]">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                          <td className="py-4 px-4 text-slate-400 text-[11px]">{new Date(doc.uploadedAt).toLocaleDateString('id-ID')}</td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => triggerToast('success', `Mengunduh berkas "${doc.name}" (Simulasi)...`)}
                              className="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                            >
                              Unduh
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

          {/* TAB 5: RIWAYAT PENGAJUAN */}
          {activeTab === 'riwayat' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="mhs-panel-riwayat">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Riwayat Registrasi & Bimbingan Magang</h3>
                <p className="text-xs text-slate-400">Riwayat audit digital dari status lembar pengajuan karir anda di server UM Kendari.</p>
              </div>

              {myPengajuan.length === 0 ? (
                <div className="text-center py-12" id="riwayat-empty">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs text-slate-500">Tidak ada pengajuan sebelumnya.</div>
                </div>
              ) : (
                <div className="overflow-x-auto" id="riwayat-table-container">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-3 px-4">Instansi Tujuan</th>
                        <th className="py-3 px-4">Tanggal Diajukan</th>
                        <th className="py-3 px-4">Periode Magang</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Verifikator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50" id="riwayat-table-body">
                      {myPengajuan.map((pj) => (
                        <tr key={pj.id} className="text-slate-700">
                          <td className="py-4 px-4 font-semibold text-slate-850">{pj.tujuanMagang}</td>
                          <td className="py-4 px-4 text-slate-500 text-[11px]">{new Date(pj.createdAt).toLocaleDateString('id-ID')}</td>
                          <td className="py-4 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                            {pj.tanggalMulai} s/d {pj.tanggalSelesai}
                          </td>
                          <td className="py-4 px-4">
                            {(() => {
                              const badge = getStatusLabel(pj.status);
                              return (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge?.color}`}>
                                  {badge?.text.split('/')[0]}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-medium text-[11px]">{pj.verifiedBy ? 'Admin CDC' : 'Belum Diverifikasi'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
