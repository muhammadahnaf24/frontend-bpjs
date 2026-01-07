import axios from "axios";

// Sesuaikan port backend kamu (misal 3000)
const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default {
  // 1. GET Peserta
  getPeserta(nik, tglSEP) {
    return apiClient.get(`/bpjs/peserta/${nik}/${tglSEP}`);
  },

  // 2. GET Monitoring Kunjungan
  getMonitoringKunjungan(tglMonitor, jenisLayanan) {
    return apiClient.get(
      `/bpjs/monitoring/kunjungan/${tglMonitor}/${jenisLayanan}`
    );
  },

  // 3. GET Histori Pelayanan
  getHistoriPelayanan(noKP, tglMulai, tglAkhir) {
    return apiClient.get(
      `/bpjs/monitoring/historipelayanan/${noKP}/${tglMulai}/${tglAkhir}`
    );
  },

  // 4. GET Rencana Kontrol (By No Kartu)
  getRencanaKontrolByKartu(bulan, tahun, noKP, filter) {
    return apiClient.get(
      `/bpjs/rencanakontrol/nokp/${bulan}/${tahun}/${noKP}/${filter}`
    );
  },

  // 5. GET Rencana Kontrol (By Tanggal)
  getRencanaKontrolByTanggal(tglAwal, tglAkhir, filter) {
    return apiClient.get(
      `/bpjs/rencanakontrol/${tglAwal}/${tglAkhir}/${filter}`
    );
  },

  // 6. POST Antrean (Report)
  postAntrean(tglAwal, tglAkhir) {
    return apiClient.post(`/bpjs/antrean/${tglAwal}/${tglAkhir}`);
  },

  batalAntrean(payload) {
    return apiClient.post("/bpjs/batal", payload);
  },
};
