import { defineStore } from "pinia";
import bpjsRepo from "../api/bpjsRepository";

export const useLaporanStore = defineStore("laporan", {
  state: () => ({
    listData: [],
    isLoading: false,
    error: null,
    lastParams: {
      tglAwal: null,
      tglAkhir: null,
    },
  }),

  actions: {
    async fetchLaporan(tglAwal, tglAkhir, forceRefresh = false) {
      if (
        !forceRefresh &&
        this.listData.length > 0 &&
        this.lastParams.tglAwal === tglAwal &&
        this.lastParams.tglAkhir === tglAkhir
      ) {
        console.log("⚡ Menggunakan Data Cache");
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const res = await bpjsRepo.postAntrean(tglAwal, tglAkhir);
        const rawData = res.data.response;

        this.listData = Array.isArray(rawData) ? rawData : [];

        this.lastParams = { tglAwal, tglAkhir };
      } catch (err) {
        console.error("Error Store:", err);
        this.error = err.message;
        this.listData = [];
      } finally {
        this.isLoading = false;
      }
    },
  },
});
