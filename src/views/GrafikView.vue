<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDokterStore } from "../stores/dokterStore";
import { useLaporanStore } from "../stores/laporanStore";
import BasePagination from "../components/BasePagination.vue";
import BaseModal from "../components/BaseModal.vue";
import ListLaporan from "../components/ListLaporan.vue";

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const dokterStore = useDokterStore();
const laporanStore = useLaporanStore();

// --- STATE ---
const loading = computed(() => laporanStore.isLoading);
const filters = ref({
  tglAwal: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
});

// --- MODAL STATE ---
const showModal = ref(false);
const selectedDoctorName = ref("");
const selectedDoctorData = ref([]);

// --- CHART DATA GENERATOR ---
const chartData = computed(() => {
  const sourceData = laporanStore.listData || [];

  const failedT5 = sourceData.filter(
    (item) => !item.task5 || item.task5 === ""
  );

  const grouped = failedT5.reduce((acc, item) => {
    const kode = item.kodedokter || "UNKNOWN";
    acc[kode] = (acc[kode] || 0) + 1;
    return acc;
  }, {});

  const labels = [];
  const realNames = [];
  const realCodes = [];
  const dataValues = [];
  const backgroundColors = [];

  const sortedEntries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

  sortedEntries.forEach(([kode, jumlah], index) => {
    const nama = dokterStore.getNamaDokter(kode);
    labels.push(index + 1);
    realNames.push(nama);
    realCodes.push(kode);
    dataValues.push(jumlah);
    backgroundColors.push(jumlah > 10 ? "#991b1b" : "#f87171");
  });

  return {
    labels: labels,
    datasets: [
      {
        label: "Jumlah T5 Gagal",
        backgroundColor: backgroundColors,
        data: dataValues,
        borderRadius: 6,
        originalNames: realNames,
        originalCodes: realCodes,
      },
    ],
  };
});

// --- HANDLE CHART CLICK ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const dataset = chartData.value.datasets[0];
      const doctorCode = dataset.originalCodes[index];
      const doctorName = dataset.originalNames[index];

      openDetailModal(doctorCode, doctorName);
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (tooltipItems) => {
          const index = tooltipItems[0].dataIndex;
          const dataset = tooltipItems[0].dataset;
          return dataset.originalNames[index];
        },
        label: (context) => `Gagal: ${context.raw} Pasien`,
      },
    },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
    x: { ticks: { autoSkip: true, maxRotation: 0 } },
  },
};

// --- LOGIC MODAL ---
const openDetailModal = (kodeDokter, namaDokter) => {
  selectedDoctorName.value = namaDokter;
  const allData = laporanStore.listData || [];

  selectedDoctorData.value = allData.filter((item) => {
    const isDoctorMatch = String(item.kodedokter) === String(kodeDokter);
    const isFailed = !item.task5 || item.task5 === "";
    return isDoctorMatch && isFailed;
  });

  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  setTimeout(() => {
    selectedDoctorData.value = [];
  }, 300);
};

// --- PAGINATION MAIN TABLE ---
const currentPage = ref(1);
const itemsPerPage = 5;

const paginatedList = computed(() => {
  const labels = chartData.value.labels || [];
  const dataset = chartData.value.datasets[0] || {};
  const names = dataset.originalNames || [];
  const codes = dataset.originalCodes || [];
  const values = dataset.data || [];

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const slicedLabels = labels.slice(start, end);

  return slicedLabels.map((nomor, index) => {
    const realIndex = start + index;
    return {
      nomor: nomor,
      nama: names[realIndex],
      kode: codes[realIndex],
      jumlah: values[realIndex],
    };
  });
});

const totalFailures = computed(() => {
  const dataset = chartData.value.datasets[0];
  if (!dataset || !dataset.data) return 0;
  return dataset.data.reduce((a, b) => a + b, 0);
});

// --- FETCH ---
const fetchData = async () => {
  try {
    await dokterStore.fetchDokter();
    await laporanStore.fetchLaporan(
      filters.value.tglAwal,
      filters.value.tglAkhir
    );
  } catch (err) {
    console.error(err);
  }
};

watch(chartData, () => {
  currentPage.value = 1;
});

onMounted(() => {
  if (laporanStore.lastParams.tglAwal) {
    filters.value.tglAwal = laporanStore.lastParams.tglAwal;
    filters.value.tglAkhir = laporanStore.lastParams.tglAkhir;
  }
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row justify-between items-center md:items-center gap-4"
    >
      <div class="text-center md:text-left">
        <h1 class="text-3xl font-extrabold text-slate-900">Grafik BPJS</h1>
        <p class="text-slate-500 mt-1">Statistik T5 Gagal</p>
      </div>
    </div>
    <div
      class="bg-white rounded-2xl shadow-sm border min-h-[500px] flex flex-col"
    >
      <div
        class="p-6 bg-slate-50/50 border-b border-slate-200 rounded-lg shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label class="label">Tanggal Awal</label>
            <input v-model="filters.tglAwal" type="date" class="form-input" />
          </div>
          <div>
            <label class="label">Tanggal Akhir</label>
            <input v-model="filters.tglAkhir" type="date" class="form-input" />
          </div>
          <div class="md:col-start-5">
            <button
              @click="fetchData"
              :disabled="loading"
              class="w-full h-[42px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Cari Data</span>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <!-- Grafik -->
        <div
          class="bg-white p-6 shadow-sm border border-slate-200 min-h-[400px]"
        >
          <h3 class="font-bold text-slate-700 mb-4">
            Grafik (Klik batang untuk detail)
          </h3>
          <div class="h-[350px] w-full">
            <Bar
              v-if="chartData.labels.length > 0"
              :data="chartData"
              :options="chartOptions"
            />
            <div
              v-else
              class="h-full flex items-center justify-center text-slate-400"
            >
              <span v-if="loading">Sedang memuat data...</span>
              <div v-else>
                <div
                  class="flex flex-col items-center justify-center opacity-40"
                >
                  <svg
                    class="w-16 h-16 text-slate-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p class="text-slate-600 font-bold">
                    Tidak ada data ditampilkan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Grafik -->
        <!-- Data -->
        <div
          class="bg-white shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden"
        >
          <div
            class="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50"
          >
            <div>
              <h3 class="font-bold text-slate-800 text-lg">Data Kegagalan</h3>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-slate-400 uppercase"
                >Total Gagal</span
              >
              <div class="text-2xl font-extrabold text-red-600">
                {{ totalFailures }}
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead
                class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold"
              >
                <tr>
                  <th class="px-6 py-4 w-[60px] text-center">#</th>
                  <th class="px-6 py-4">Dokter</th>
                  <th class="px-6 py-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(item, idx) in paginatedList"
                  :key="item.nomor"
                  class="hover:bg-blue-50/30 transition-colors"
                  @click="openDetailModal(item.kode, item.nama)"
                >
                  <td class="px-6 py-4 text-center">
                    <div
                      class="w-8 h-8 mx-auto rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs"
                    >
                      {{ item.nomor }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex flex-col">
                        <span
                          class="font-bold text-slate-800 text-sm line-clamp-1"
                          >{{ item.nama }}</span
                        >

                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span
                            class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 font-bold"
                            >ID: {{ item.kode }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span
                      class="inline-block bg-red-50 text-red-600 px-3 py-1 rounded-md font-extrabold text-base border border-red-100 shadow-sm"
                      >{{ item.jumlah }}</span
                    >
                  </td>
                </tr>
                <tr v-if="paginatedList.length === 0">
                  <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                    <div
                      class="flex flex-col items-center justify-center opacity-40"
                    >
                      <svg
                        class="w-16 h-16 text-slate-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <p class="text-slate-600 font-bold">
                        Tidak ada data ditampilkan
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-4 border-t border-slate-100 bg-slate-50">
            <BasePagination
              v-model="currentPage"
              :total-items="chartData.labels.length"
              :items-per-page="itemsPerPage"
            />
          </div>
        </div>
        <!-- Data -->
      </div>
    </div>

    <BaseModal
      :is-open="showModal"
      :title="'Detail Pasien Gagal: ' + selectedDoctorName"
      max-width="max-w-6xl"
      @close="closeModal"
    >
      <template #body>
        <ListLaporan
          :data-list="selectedDoctorData"
          :hide-filters="true"
          @refresh="fetchData"
        />
      </template>

      <template #footer>
        <button
          @click="closeModal"
          class="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition shadow-sm text-sm"
        >
          Tutup
        </button>
      </template>
    </BaseModal>
  </div>
</template>
