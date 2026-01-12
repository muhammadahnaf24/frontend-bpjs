import { createRouter, createWebHistory } from "vue-router";
import PesertaView from "@/views/PesertaView.vue";
import MonitoringView from "@/views/MonitoringView.vue";
import RencanaKontrolView from "@/views/RencanaKontrolView.vue";
import LaporanBPJSView from "@/views/LaporanBPJSView.vue";
import GrafikView from "@/views/GrafikView.vue";

const routes = [
  { path: "/", redirect: "/peserta" },
  { path: "/laporan-bpjs", component: LaporanBPJSView },
  { path: "/peserta", component: PesertaView },
  { path: "/monitoring", component: MonitoringView },
  { path: "/rencana-kontrol", component: RencanaKontrolView },
  { path: "/grafik", component: GrafikView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
