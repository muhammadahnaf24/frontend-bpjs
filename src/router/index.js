import { createRouter, createWebHistory } from "vue-router";
import PesertaView from "@/views/PesertaView.vue";
import MonitoringView from "@/views/MonitoringView.vue";
import RencanaKontrolView from "@/views/RencanaKontrolView.vue";
import LaporanBPJSView from "@/views/LaporanBPJSView.vue";
import ChartView from "@/views/ChartView.vue";

const routes = [
  { path: "/", redirect: "/peserta" },
  { path: "/laporan-bpjs", component: LaporanBPJSView },
  { path: "/peserta", component: PesertaView },
  { path: "/monitoring", component: MonitoringView },
  { path: "/rencana-kontrol", component: RencanaKontrolView },
  { path: "/chart", component: ChartView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
