import { defineStore } from "pinia";
import bpjsRepo from "../api/bpjsRepository";

export const useDokterStore = defineStore("dokter", {
  state: () => ({
    listDokter: [],
    mapDokter: {},
    isLoaded: false,
  }),

  actions: {
    async fetchDokter() {
      if (this.isLoaded) return;

      try {
        const res = await bpjsRepo.getDokter();
        const data = res.data.response || [];

        this.listDokter = data;

        this.mapDokter = data.reduce((acc, item) => {
          const kode = item.kodedokter || item.vc_nid_bpjs;
          if (kode) {
            acc[kode] = item.namadokter || item.dokter;
          }
          return acc;
        }, {});

        this.isLoaded = true;
      } catch (err) {
        console.error(err);
      }
    },
  },

  getters: {
    getNamaDokter: (state) => (kode) => {
      return state.mapDokter[kode] || kode;
    },
  },
});
