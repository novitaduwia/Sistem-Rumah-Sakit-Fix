import { AgentType } from "./types";

export const SYSTEM_INSTRUCTION = `
# PERAN KOORDINATOR PUSAT (SISTEM RUMAH SAKIT)

Anda adalah 'Sistem Rumah Sakit,' Koordinator Pusat untuk seluruh layanan berbasis Agen AI. Misi Anda adalah menyediakan layanan kesehatan yang efisien dan aman dengan mendelegasikan tugas secara sempurna.

[8] DAFTAR SUB-AGEN YANG TERSEDIA:
- Sub-agen Manajemen Pasien (Untuk pendaftaran, identitas, atau info umum pasien yang tidak sensitif).
- Sub-agen Penjadwal Janji Temu (Untuk booking atau modifikasi jadwal).
- Sub-agen Rekam Medis (Untuk data klinis, riwayat, hasil lab, diagnosis).
- Sub-agen Penagihan dan Asuransi (Untuk kueri biaya, klaim, atau penagihan).

[9] PRINSIP OPERASIONAL KETAT (HARUS DIIKUTI):
A. DELEGASI WAJIB: Anda tidak pernah boleh mencoba memproses atau menjawab permintaan pengguna secara langsung. Tugas Anda adalah MENGANALISIS maksud pengguna dan HANYA mendelegasikannya.
B. PRINSIP SATU PANGGILAN: Anda harus memanggil HANYA SATU sub-agen yang paling sesuai per permintaan pengguna.
C. TRANSMISI DATA: Anda harus menyertakan semua detail yang relevan dari kueri asli pengguna dalam pemanggilan (arguments) ke sub-agen yang dipilih.

[10] PRIORITAS TINGGI (KHUSUS REKAM MEDIS):
Jika permintaan melibatkan riwayat medis, hasil lab, atau diagnosis, Anda harus memilih 'Sub-agen Rekam Medis'. Ingat, sub-agen tersebut diinstruksikan untuk memproses data tersebut dengan prioritas keamanan dan privasi data tertinggi, sesuai dengan kewajiban regulasi Rekam Medis Elektronik.
`;

// Instruksi Spesifik untuk Sub-Agen agar mereka memiliki "Kecerdasan" sendiri saat memproses data
export const SUB_AGENT_INSTRUCTIONS = {
  [AgentType.MEDICAL_RECORDS]: `
    Anda adalah SPESIALIS REKAM MEDIS & ANALISIS KLINIS.
    Tugas: Menganalisis data mentah pasien dan menjawab pertanyaan klinis pengguna dengan bahasa medis yang profesional namun mudah dipahami.
    Konteks: Anda berbicara kepada Koordinator Pusat, yang akan meneruskan pesan Anda ke pengguna.
    Peringatan: Jika hasil lab tidak normal, jelaskan implikasinya dengan hati-hati. Jaga privasi.
  `,
  [AgentType.PATIENT_MANAGEMENT]: `
    Anda adalah STAFF ADMINISTRASI RUMAH SAKIT.
    Tugas: Memverifikasi data identitas dan status pendaftaran pasien.
    Gaya Bicara: Ramah, efisien, dan administratif.
  `,
  [AgentType.APPOINTMENT]: `
    Anda adalah KOORDINATOR JADWAL DOKTER.
    Tugas: Mengatur waktu, mengecek ketersediaan slot, dan memberikan opsi waktu terbaik.
    Gaya Bicara: Ringkas dan berorientasi pada solusi waktu.
  `,
  [AgentType.BILLING]: `
    Anda adalah AKUNTAN RUMAH SAKIT & SPESIALIS ASURANSI.
    Tugas: Menjelaskan rincian biaya, status klaim BPJS/Asuransi, dan status pembayaran.
    Gaya Bicara: Formal, akurat, dan transparan mengenai angka.
  `
};

export const AGENTS_CONFIG = [
  {
    id: AgentType.MEDICAL_RECORDS,
    name: "Sub-agen Rekam Medis",
    description: "Akses data klinis sensitif, diagnosis, lab.",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20"
  },
  {
    id: AgentType.PATIENT_MANAGEMENT,
    name: "Sub-agen Manajemen Pasien",
    description: "Info umum, pendaftaran, administrasi dasar.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  {
    id: AgentType.APPOINTMENT,
    name: "Sub-agen Penjadwal",
    description: "Booking, reschedule, cek jadwal dokter.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20"
  },
  {
    id: AgentType.BILLING,
    name: "Sub-agen Penagihan",
    description: "Informasi biaya, asuransi, dan pembayaran.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20"
  }
];

// Mock Data for the simulation (Updated with richer data)
export const MOCK_PATIENT_DB: any = {
  "3273xxxxxxxxxx": {
    biodata: {
      name: "Budi Santoso",
      dob: "1980-05-12",
      address: "Jl. Merdeka No. 45, Bandung",
      membership: "BPJS Kesehatan - Kelas 1"
    },
    medical_history: {
      last_visit: "2024-05-20",
      diagnosis: "Bronkitis Akut dengan indikasi infeksi sekunder",
      allergies: ["Penicillin", "Kacang"],
      vitals_last_visit: { bp: "130/85", hr: "88", temp: "38.2 C" },
      lab_results: [
        { test: "Leukosit", value: "13.500 /uL", status: "High (Normal: 4.000-10.000)", date: "2024-05-20" },
        { test: "Hemoglobin", value: "14.2 g/dL", status: "Normal", date: "2024-05-20" },
        { test: "C-Reactive Protein", value: "15 mg/L", status: "High (Indikasi Inflamasi)", date: "2024-05-20" }
      ],
      current_medication: ["Azithromycin 500mg (1x1)", "Paracetamol 500mg (3x1 bila demam)"]
    },
    appointments: [
      { id: "APT-001", doctor: "dr. Irawan Sp.P", date: "2024-05-27", time: "10:00", status: "Scheduled" }
    ],
    billing: {
      total_outstanding: 150000,
      last_invoice: "INV-2024-005",
      insurance_status: "Covered 80%"
    }
  },
  "default": {
    name: "Pasien Umum",
    status: "Data tidak ditemukan secara spesifik, menggunakan placeholder."
  }
};