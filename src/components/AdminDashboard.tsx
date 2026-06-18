/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User as UserType, 
  Mahasiswa, 
  Alumni, 
  Mitra, 
  Lowongan, 
  PengajuanMagang, 
  TracerStudy, 
  Berita, 
  Pengumuman 
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
  Users, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  BookOpen, 
  Layers, 
  Sparkles,
  Info 
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'mahasiswa' | 'alumni' | 'mitra' | 'pengajuan' | 'tracer' | 'konten' | 'laporan'>('ringkasan');
  
  // Database States
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [mitra, setMitra] = useState<Mitra[]>([]);
  const [appls, setAppls] = useState<PengajuanMagang[]>([]);
  const [tracers, setTracers] = useState<TracerStudy[]>([]);
  const [news, setNews] = useState<Berita[]>([]);
  const [newsletters, setNewsletters] = useState<Pengumuman[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  // Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Add Form States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [mName, setMName] = useState('');
  const [mNim, setMNim] = useState('');
  const [mProdi, setMProdi] = useState('Teknik Informatika');

  const [showAddNews, setShowAddNews] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nContent, setNContent] = useState('');

  // Reload everything from local simulated DB
  const reloadAll = () => {
    setStudents(getFromDB<Mahasiswa>('mahasiswa'));
    setAlumni(getFromDB<Alumni>('alumni'));
    setMitra(getFromDB<Mitra>('mitra'));
    setAppls(getFromDB<PengajuanMagang>('pengajuan_magang'));
    setTracers(getFromDB<TracerStudy>('tracer_studies'));
    setNews(getFromDB<Berita>('berita'));
    setNewsletters(getFromDB<Pengumuman>('pengumuman'));
    setAllUsers(getFromDB<UserType>('users'));
  };

  useEffect(() => {
    reloadAll();
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Add Student manually (FR-ADM-02)
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mNim) {
      triggerToast('error', 'Nama dan NIM wajib diisi.');
      return;
    }

    const mUserId = `usr_new_${Date.now()}`;
    const newUser: UserType = {
      id: mUserId,
      name: mName,
      email: `${mNim.toLowerCase()}@umkendari.ac.id`,
      role: 'mahasiswa',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    insertToDB<UserType>('users', newUser);

    const newMhs: Mahasiswa = {
      id: `mhs_new_${Date.now()}`,
      userId: mUserId,
      nim: mNim,
      nama: mName,
      email: newUser.email,
      programStudi: mProdi,
      fakultas: mProdi === 'Teknik Informatika' || mProdi === 'Sistem Informasi' ? 'Fakultas Teknik' : 'Fakultas Ekonomi',
      angkatan: '2022',
      semester: 6
    };
    insertToDB<Mahasiswa>('mahasiswa', newMhs);

    setMName('');
    setMNim('');
    setShowAddStudent(false);
    reloadAll();
    triggerToast('success', `Data Mahasiswa "${mName}" berhasil di-import & didaftarkan.`);
  };

  // Add News manually (FR-ADM-08)
  const handleAddNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle || !nContent) return;

    const newArticle: Berita = {
      id: `news_${Date.now()}`,
      title: nTitle,
      slug: nTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
      excerpt: nContent.substring(0, 100) + '...',
      content: nContent,
      coverImageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop',
      status: 'published',
      authorId: user.id,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    insertToDB<Berita>('berita', newArticle);

    setNTitle('');
    setNContent('');
    setShowAddNews(false);
    reloadAll();
    triggerToast('success', 'Berita/Pengumuman baru berhasil diterbitkan.');
  };

  // Delete entity safely
  const handleDeleteEntity = (key: any, id: string, label: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${label}" dari server utama?`)) {
      deleteInDB(key, id);
      reloadAll();
      triggerToast('success', `Dokumen "${label}" berhasil dihapus dari database.`);
    }
  };

  // Verify Application Status (FR-ADM-06)
  const handleVerifyApplication = (id: string, decision: 'accepted' | 'rejected' | 'under_review') => {
    const target = appls.find(a => a.id === id);
    if (target) {
      target.status = decision;
      target.catatanAdmin = `Disetujui oleh Operator CDC Kampus (${user.name}) pada ${new Date().toLocaleDateString('id-ID')}. Berkas lengkap dan sah.`;
      target.verifiedBy = user.id;
      target.verifiedAt = new Date().toISOString();
      updateInDB<PengajuanMagang>('pengajuan_magang', target);
      reloadAll();
      triggerToast('success', `Status lamaran berhasil diverifikasi menjadi ${decision.toUpperCase()}.`);
    }
  };

  // TRACE STUDY STATS MATHEMATICS FOR SVGs
  const countWorking = tracers.filter(t => t.statusPekerjaan === 'bekerja').length;
  const countEntre = tracers.filter(t => t.statusPekerjaan === 'wirausaha').length;
  const countStudy = tracers.filter(t => t.statusPekerjaan === 'lanjut_studi').length;
  const countUnemployed = tracers.filter(t => t.statusPekerjaan === 'belum_bekerja').length;
  const totalTracersCount = tracers.length || 1;

  // Percentage
  const pctWorking = Math.round((countWorking / totalTracersCount) * 100);
  const pctEntre = Math.round((countEntre / totalTracersCount) * 100);
  const pctStudy = Math.round((countStudy / totalTracersCount) * 100);
  const pctUnemployed = Math.round((countUnemployed / totalTracersCount) * 105);

  // REAL BULK SPREADSHEETS CSV GENERATOR FUNCTION (FR-ADM-09)
  const triggerSpreadsheetDownload = (reportType: 'mahasiswa' | 'alumni' | 'tracer' | 'mitra') => {
    let header = '';
    let rows = '';
    let filename = '';

    if (reportType === 'mahasiswa') {
      header = 'ID,NIM,Nama,Email,Prodi,Fakultas,Semester,Angkatan\n';
      rows = students.map(m => `"${m.id}","${m.nim}","${m.nama}","${m.email}","${m.programStudi}","${m.fakultas}","${m.semester}","${m.angkatan}"`).join('\n');
      filename = 'rekap_mahasiswa_magang_umkendari.csv';
    } else if (reportType === 'alumni') {
      header = 'ID,NIM,Nama,Email,Prodi,Tahun Lulus,Status Kerja,Tempat Kerja\n';
      rows = alumni.map(a => `"${a.id}","${a.nim || '-'}","${a.nama}","${a.email}","${a.programStudi}","${a.tahunLulus}","${a.statusPekerjaan}","${a.instansiKerja || '-'}"`).join('\n');
      filename = 'rekap_alumni_umkendari.csv';
    } else if (reportType === 'tracer') {
      header = 'ID,Nama Alumni,Prodi,Tahun Lulus,Status,Gaji,Kesesuaian Sektor\n';
      rows = tracers.map(t => `"${t.id}","${t.nama}","${t.programStudi}","${t.tahunLulus}","${t.statusPekerjaan}","${t.rangePenghasilan || '-'}","${t.kesesuaianBidang || '-'}"`).join('\n');
      filename = 'rekap_tracer_study_umkendari.csv';
    } else if (reportType === 'mitra') {
      header = 'ID,Nama Perusahaan,Sektor,PIC,Hotline,Situs Web\n';
      rows = mitra.map(m => `"${m.id}","${m.namaInstansi}","${m.bidangIndustri || '-'}","${m.kontakPerson}","${m.phone || '-'}","${m.website || '-'}"`).join('\n');
      filename = 'rekap_mitra_kerja_sama.csv';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('success', `Laporan "${filename}" berhasil digenerate & diunduh (Format Tabel Excel).`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-xs sm:text-sm" id="adm-dashboard">
      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border bg-slate-900 text-white flex items-center gap-2 max-w-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <div>{toast.text}</div>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="bg-slate-950 text-white h-18 sticky top-0 z-40 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-white">CDC OPERATOR CONTROL CENTER</div>
            <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Universitas Muhammadiyah Kendari</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[10px]">ROOT ADMINISTRATOR</span>
          <button 
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* BODY CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8" id="adm-body-grid">
        
        {/* SIDE BAR LAYOUT */}
        <aside className="lg:col-span-3 space-y-6" id="adm-sidebar">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="font-bold text-slate-900 border-b border-slate-50 pb-2 text-xs uppercase tracking-wider text-slate-400">DATA & TRANSAKSI</div>
            
            <nav className="flex flex-col gap-1.5" id="adm-nav-menu">
              {[
                { id: 'ringkasan', label: 'Ringkasan Laporan', icon: Layers },
                { id: 'mahasiswa', label: 'Kelola Mahasiswa', icon: Users },
                { id: 'alumni', label: 'Database Alumni', icon: BookOpen },
                { id: 'mitra', label: 'Daftar Mitra', icon: Building2 },
                { id: 'pengajuan', label: 'Verifikasi Magang', icon: CheckCircle },
                { id: 'tracer', label: 'Rekap Tracer Study', icon: FileText },
                { id: 'konten', label: 'CMS Berita', icon: BookOpen },
                { id: 'laporan', label: 'Export Spreads', icon: Download }
              ].map((menu) => {
                const Icon = menu.icon;
                return (
                  <button
                    key={menu.id}
                    id={`adm-tab-${menu.id}`}
                    onClick={() => setActiveTab(menu.id as any)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-semibold text-xs sm:text-sm transition ${
                      activeTab === menu.id
                        ? 'bg-slate-950 text-white shadow-md shadow-slate-900/10 font-bold'
                        : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {menu.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CORE ANALYTICAL PANEL MAIN BOARD */}
        <main className="lg:col-span-9" id="adm-main">
          
          {/* TAB 1: RINGKASAN */}
          {activeTab === 'ringkasan' && (
            <div id="adm-panel-ringkasan" className="space-y-6">
              
              {/* CORE METRIC SUMMARY GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="adm-stat-cards">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wide">Pendaftar Magang</div>
                  <div className="text-xl font-extrabold text-slate-800">{appls.length} Berkas</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wide">Alumni Ber-Tracer</div>
                  <div className="text-xl font-extrabold text-blue-600">{tracers.length} Anggota</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wide">Mitra Terdaftar</div>
                  <div className="text-xl font-extrabold text-emerald-600">{mitra.length} Instansi</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wide">Menunggu Validasi</div>
                  <div className="text-xl font-extrabold text-amber-600 animate-pulse bg-amber-50 rounded-lg px-2 text-center py-0.5">{appls.filter(a => a.status === 'submitted').length} Berkas</div>
                </div>
              </div>

              {/* INTEGRATED HISTOGRAM SVG GRAPH (Representing visual analysis report of graduates) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="adm-tracer-graphs">
                <div>
                  <h4 className="font-extrabold text-slate-850 text-sm">Visual Pola Penyerapan Alumni (Tracer Study metrics)</h4>
                  <p className="text-slate-400 text-xs">Proporsi diagram lapangan pekerjaan terkini yang dilaporkan alumni secara mandiri.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center pt-2">
                  <div className="space-y-3.5" id="graph-bars">
                    {[
                      { label: 'Bekerja Sektor Swasta / BUMN', pct: pctWorking, color: 'bg-blue-600', count: countWorking },
                      { label: 'Berwirausaha Mandiri / Startup', pct: pctEntre, color: 'bg-emerald-500', count: countEntre },
                      { label: 'Studi Lanjut S2 / S3', pct: pctStudy, color: 'bg-teal-500', count: countStudy },
                      { label: 'Mencari Peluang / Mengabdi', pct: pctUnemployed > 100 ? 100 : pctUnemployed, color: 'bg-rose-400', count: countUnemployed }
                    ].map((stat, i) => (
                      <div key={i} className="space-y-1" id={`bar-${i}`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">{stat.label}</span>
                          <span className="font-extrabold text-slate-900">{stat.pct}% ({stat.count} Orang)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`${stat.color} h-full rounded-full transition-all`} style={{ width: `${stat.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* HIGH-FIDELITY SIMPLE ANALYTICAL DOUGHNUT ACCENT CHOSEN */}
                  <div className="flex flex-col items-center justify-center p-4 border border-slate-50 bg-slate-50/50 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-slate-700 font-sans">Kesesuaian Bidang Keilmuan Lulusan</div>
                    <div className="font-mono text-3xl font-extrabold text-slate-900">
                      {Math.round(((tracers.filter(t => t.kesesuaianBidang === 'sangat_sesuai' || t.kesesuaianBidang === 'sesuai').length) / totalTracersCount) * 100)} %
                    </div>
                    <p className="text-[10px] text-slate-450 text-center max-w-[200px]">Alumni menyatakan pekerjaan saat ini selaras dengan prodi di kampus.</p>
                  </div>
                </div>
              </div>

              {/* RECENT NOTIFICATIONS / ACTIONABLE LOGS */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Dashboard Aktivitas Terkini</h4>
                <div className="divide-y divide-slate-50" id="adm-recent-logs">
                  {appls.slice(0, 3).map((a) => (
                    <div key={a.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{a.namaMahasiswa} ({a.nim})</div>
                        <div className="text-slate-400 text-[11px]">Mengajukan magang ke instansi "{a.tujuanMagang}".</div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold border rounded text-[10px] uppercase whitespace-nowrap">{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DATA MAHASISWA CLIENT MANAGEMENT (FR-ADM-02) */}
          {activeTab === 'mahasiswa' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="adm-panel-mahasiswa">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-905 text-lg">Manajemen Database Mahasiswa</h3>
                  <p className="text-xs text-slate-400">Database sirkulasi mahasiswa aktif mendaftar atau sedang magang legal.</p>
                </div>
                <button 
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  {showAddStudent ? "Sembunyikan Form" : "Import Mahasiswa Baru"}
                </button>
              </div>

              {showAddStudent && (
                <form onSubmit={handleAddStudentSubmit} className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4" id="add-student-form">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">Manual Register Mahasiswa</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        required
                        value={mName}
                        onChange={(e) => setMName(e.target.value)}
                        placeholder="Contoh: Al-Ayyubi"
                        className="w-full px-3.5 py-2 border border-slate-200 bg-white text-sm rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650">NIM *</label>
                      <input 
                        type="text" 
                        required 
                        value={mNim}
                        onChange={(e) => setMNim(e.target.value)}
                        placeholder="202201010"
                        className="w-full px-3.5 py-2 border border-slate-200 bg-white text-sm rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650">Prodi *</label>
                      <select 
                        value={mProdi}
                        onChange={(e) => setMProdi(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 bg-white text-sm rounded-xl"
                      >
                        <option value="Teknik Informatika">Teknik Informatika</option>
                        <option value="Sistem Informasi">Sistem Informasi</option>
                        <option value="Manajemen">Manajemen</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddStudent(false)} className="px-4 py-2 border text-xs rounded-xl hover:bg-slate-100">Batal</button>
                    <button type="submit" className="bg-slate-900 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-sm">Simpan</button>
                  </div>
                </form>
              )}

              {/* MAHASISWA LIST TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Nama Mahasiswa</th>
                      <th className="py-3 px-4">Prodi/Fakultas</th>
                      <th className="py-3 px-4">Angkatan / Sem</th>
                      <th className="py-3 px-4">Email Kampus</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {st.nama}
                          <span className="text-[10px] text-slate-400 font-normal font-mono block">NIM: {st.nim}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{st.programStudi} • <span className="text-slate-400 font-normal">{st.fakultas}</span></td>
                        <td className="py-3.5 px-4">{st.angkatan} / Sm {st.semester}</td>
                        <td className="py-3.5 px-4 text-slate-550 font-mono text-[11px]">{st.email}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={() => handleDeleteEntity('mahasiswa', st.id, st.nama)}
                            className="text-rose-500 hover:text-rose-600 font-bold p-1 hover:bg-rose-50 rounded"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DATA ALUMNI (FR-ADM-03) */}
          {activeTab === 'alumni' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="adm-panel-alumni">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Indeks Database Kependudukan Alumni</h3>
                <p className="text-xs text-slate-400">Database sensus sirkulasi alumni Universitas Muhammadiyah Kendari.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Prodi/Tahun Lulus</th>
                      <th className="py-3 px-4">Sektor Pekerjaan</th>
                      <th className="py-3 px-4">Instansi Tempat Kerja</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-705">
                    {alumni.map((al) => (
                      <tr key={al.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {al.nama}
                          <span className="text-[10px] text-slate-400 font-normal font-mono block">NIM: {al.nim || '-'}</span>
                        </td>
                        <td className="py-4 px-4 font-medium">{al.programStudi} / Kelas {al.tahunLulus}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            al.statusPekerjaan === 'bekerja' 
                              ? 'bg-blue-50 text-blue-700' 
                              : al.statusPekerjaan === 'wirausaha' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {al.statusPekerjaan}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">{al.instansiKerja || '-'}</td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleDeleteEntity('alumni', al.id, al.nama)}
                            className="text-rose-500 hover:text-rose-600 font-bold p-1 hover:bg-rose-50 rounded"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DATA MITRA (FR-ADM-04) */}
          {activeTab === 'mitra' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="adm-panel-mitra">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Direktori Lembaga & Mitra Industri Resmi</h3>
                <p className="text-xs text-slate-400">Arsip profil and penanganan status legal kerja sama mitra eksternal.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Instansi / Perusahaan</th>
                      <th className="py-3 px-4">Sektor Kegiatan</th>
                      <th className="py-3 px-4">PIC / HP</th>
                      <th className="py-3 px-4">Situs Web</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-705">
                    {mitra.map((mr) => (
                      <tr key={mr.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-extrabold text-slate-900">{mr.namaInstansi}</td>
                        <td className="py-4 px-4 font-medium">{mr.bidangIndustri || '-'}</td>
                        <td className="py-4 px-4">
                          <div>{mr.kontakPerson}</div>
                          <span className="text-[10px] text-slate-450 block font-mono">{mr.phone || '-'}</span>
                        </td>
                        <td className="py-4 px-4 text-blue-600 font-mono text-[11px] underline max-w-[150px] truncate">{mr.website || '-'}</td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleDeleteEntity('mitra', mr.id, mr.namaInstansi)}
                            className="text-rose-500 hover:text-rose-600 font-bold p-1 hover:bg-rose-50 rounded"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: VERIFIKASI MAGANG (FR-ADM-06) */}
          {activeTab === 'pengajuan' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="adm-panel-pengajuan">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Pemeriksaan & Validasi Dokumen Magang</h3>
                <p className="text-xs text-slate-400">Verifikasi berkas, evaluasi syarat legal, and terbitkan dekre kelaikan mahasiswa.</p>
              </div>

              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Calon Anggota Magang</th>
                      <th className="py-3 px-4">Tujuan Instansi</th>
                      <th className="py-3 px-4">Diajukan Tanggal</th>
                      <th className="py-3 px-4">Status Verifikasi</th>
                      <th className="py-3 px-4 text-right">Tindakan Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {appls.map((ap) => (
                      <tr key={ap.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {ap.namaMahasiswa}
                          <span className="text-[10px] text-slate-405 font-mono block">NIM: {ap.nim} • {ap.programStudi}</span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-800">{ap.tujuanMagang}</td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">{new Date(ap.createdAt).toLocaleDateString('id-ID')}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            ap.status === 'accepted' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : ap.status === 'rejected' 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          }`}>
                            {ap.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2.5 whitespace-nowrap font-bold">
                          <button 
                            onClick={() => triggerToast('success', `Simulasi download lampiran ${ap.namaMahasiswa}...`)}
                            className="text-slate-500 hover:underline text-xs"
                          >
                            Berkas
                          </button>
                          <span className="text-slate-200">|</span>
                          <button 
                            onClick={() => handleVerifyApplication(ap.id, 'accepted')}
                            className="text-green-600 hover:text-green-700 text-xs"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleVerifyApplication(ap.id, 'rejected')}
                            className="text-rose-500 hover:text-rose-600 text-xs"
                          >
                            Tolak
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: REKAP TRACER (FR-ADM-07) */}
          {activeTab === 'tracer' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="adm-panel-tracer">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Hasil Sensus Data Tracer Study</h3>
                <p className="text-xs text-slate-400">Laporan instrumen mutu pelacakan alumni Universitas Muhammadiyah Kendari.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Nama Alumni</th>
                      <th className="py-3 px-4">Prodi/Tahun Lulus</th>
                      <th className="py-3 px-4">Sektor Pekerjaan</th>
                      <th className="py-3 px-4">Keselarasan Ilmu</th>
                      <th className="py-3 px-4">Saran Kurikulum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {tracers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/40 transition">
                        <td className="py-4 px-4 font-bold text-slate-900">{tr.nama}</td>
                        <td className="py-4 px-4 font-medium">{tr.programStudi} / {tr.tahunLulus}</td>
                        <td className="py-4 px-4">
                          <span className="font-bold">{tr.statusPekerjaan}</span>
                          <span className="text-[10px] text-slate-450 block truncate max-w-[120px]">{tr.namaInstansi || '-'}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-mono text-center text-[10px] uppercase">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            tr.kesesuaianBidang === 'sangat_sesuai' || tr.kesesuaianBidang === 'sesuai'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {tr.kesesuaianBidang ? tr.kesesuaianBidang.replace('_', ' ') : 'belum kerja'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 italic text-xs truncate max-w-[150px]">{tr.saranUntukKampus || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: BERITA & PENGUMUMAN CMS (FR-ADM-08) */}
          {activeTab === 'konten' && (
            <div className="space-y-6" id="adm-panel-content">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-950 text-lg">Hub CMS Berita & Tips Karir</h3>
                  <p className="text-xs text-slate-400">Pusat publikasi konten, tips wawancara, sirkulasi info lowongan umum daerah.</p>
                </div>
                <button 
                  onClick={() => setShowAddNews(!showAddNews)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  {showAddNews ? "Sembunyikan Form" : "Tulis Artikel Berita Baru"}
                </button>
              </div>

              {showAddNews && (
                <form onSubmit={handleAddNewsSubmit} className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4" id="add-news-form">
                  <div className="text-xs font-bold text-slate-800 border-b border-slate-50 pb-2">TERBITKAN ARTIKEL PENUNJANG KARIR</div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-xs text-slate-700">Judul Artikel Berita *</label>
                    <input 
                      type="text" 
                      required
                      value={nTitle}
                      onChange={(e) => setNTitle(e.target.value)}
                      placeholder="Contoh: Kunci Penulisan Curriculum Vitae Profesional"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 font-bold">
                    <label className="text-xs text-slate-700">Konten Artikel Berita (Format Paragraf Lengkap) *</label>
                    <textarea 
                      required
                      value={nContent}
                      onChange={(e) => setNContent(e.target.value)}
                      rows={5}
                      placeholder="Isi rincian tips dan aktivitas..."
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-normal focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddNews(false)} className="px-4 py-2 border text-xs font-bold rounded-xl">Batal</button>
                    <button type="submit" className="bg-emerald-500 text-slate-950 px-5 py-2 text-xs font-bold rounded-xl shadow-sm">Terbitkan Sekarang</button>
                  </div>
                </form>
              )}

              {/* LIST NEWS ARTICLES */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm" id="cms-news-list">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Nama Artikel/Judul</th>
                        <th className="py-3 px-4">Tanggal Rilis</th>
                        <th className="py-3 px-5">Ringkasan Ringkas</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-705">
                      {news.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4 font-bold text-slate-900 leading-snug max-w-[200px]">{item.title}</td>
                          <td className="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                          <td className="py-4 px-5 text-slate-505 max-w-[200px] truncate">{item.excerpt}</td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => handleDeleteEntity('berita', item.id, item.title)}
                              className="text-rose-500 hover:text-rose-600 font-bold p-1 hover:bg-rose-50 rounded"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BULK UNDUH LAPORAN SPREADSHEETS EXCEL (FR-ADM-09) */}
          {activeTab === 'laporan' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="adm-panel-laporan">
              <div>
                <h3 className="font-bold text-slate-905 text-lg">Export Center Data Kampus (Format Excel Sensus)</h3>
                <p className="text-xs text-slate-400">Unduh data rekap keseluruhan instansi, alumni kependudukan, and data mahasiswa aktif magang dalam format tabular CSV/XLS.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="adm-export-cards">
                
                {/* CARD 1: MAHASISWA REPORT */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 hover:shadow-xs transition duration-150">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Laporan Mahasiswa Magang</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Berisi daftar total NIM, nama, program studi, and status penerimaan mahasiswa magang aktif.</p>
                  </div>
                  <button 
                    onClick={() => triggerSpreadsheetDownload('mahasiswa')}
                    className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    Unduh Tabular Excel <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 2: ALUMNI REPORT */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 hover:shadow-xs transition">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-emerald-50 text-emerald-605 text-emerald-600 rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Database Kependudukan Alumni</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Berisi daftar total tahun kelulusan, penempatan instansi kerja, and posisi jabatan alumni.</p>
                  </div>
                  <button 
                    onClick={() => triggerSpreadsheetDownload('alumni')}
                    className="bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    Unduh Tabular Excel <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 3: TRACER STUDY REPORT */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 hover:shadow-xs transition">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Laporan Kuesioner Tracer Study</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Penting bagi BAN-PT. Rekap durasi masa tunggu gaji bulanan, keselarasan sirkulasi kurikulum.</p>
                  </div>
                  <button 
                    onClick={() => triggerSpreadsheetDownload('tracer')}
                    className="bg-white hover:bg-purple-50 text-purple-600 border border-purple-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    Unduh Tabular Excel <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 4: MITRA INDUSTRIAL REPORT */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 hover:shadow-xs transition">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-amber-50 text-amber-705 text-amber-700 rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Laporan Instansi Kemitraan</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Berisi daftar total kerja sama industri, pic penghubung, bidang usaha eksternal.</p>
                  </div>
                  <button 
                    onClick={() => triggerSpreadsheetDownload('mitra')}
                    className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    Unduh Tabular Excel <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
