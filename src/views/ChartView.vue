<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDokterStore } from "../stores/dokterStore";
import { useLaporanStore } from "../stores/laporanStore";
import BasePagination from "../components/BasePagination.vue";
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

const loading = computed(() => laporanStore.isLoading);

const filters = ref({
  tglAwal: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
});

const currentPage = ref(1);
const itemsPerPage = 5;

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

const totalFailures = computed(() => {
  const dataset = chartData.value.datasets[0];
  if (!dataset || !dataset.data) return 0;
  return dataset.data.reduce((a, b) => a + b, 0);
});

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

watch(chartData, () => {
  currentPage.value = 1;
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 },
    },
    x: {
      ticks: { autoSkip: true, maxRotation: 0 },
    },
  },
};

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

    <div class="p-6 bg-slate-50/50 border-b border-slate-200">
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
            <span v-else>Filter</span>
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <div
        class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]"
      >
        <h3 class="font-bold text-slate-700 mb-4">Grafik</h3>
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
            <span v-if="laporanStore.isLoading">Sedang memuat data...</span>
            <span v-else>Tidak ada data T5 Gagal pada periode ini.</span>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden"
      >
        <div
          class="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50"
        >
          <div>
            <h3 class="font-bold text-slate-800 text-lg">
              Detail Kegagalan T5
            </h3>
            <p class="text-sm text-slate-500">
              Data terurut dari jumlah kegagalan terbanyak
            </p>
          </div>
          <div class="text-right">
            <span
              class="text-xs font-bold text-slate-400 uppercase tracking-wider"
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
              class="bg-slate-900 text-white uppercase text-xs tracking-wider font-bold"
            >
              <tr>
                <th class="px-6 py-4 w-[50px] text-center">#</th>
                <th class="px-6 py-4">Nama Dokter</th>
                <th class="px-6 py-4">ID</th>
                <th class="px-6 py-4 text-right">Jumlah Gagal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(item, idx) in paginatedList"
                :key="item.nomor"
                class="hover:bg-slate-100 transition-colors group"
              >
                <td class="px-6 py-4 text-center">
                  <div
                    class="w-8 h-8 mx-auto rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs"
                  >
                    {{ item.nomor }}
                  </div>
                </td>

                <td class="px-6 py-4">
                  <div class="font-bold text-slate-700 text-sm">
                    {{ item.nama }}
                  </div>
                </td>

                <td class="px-6 py-4">
                  <div class="font-bold text-slate-700 text-sm">
                    {{ item.kode }}
                  </div>
                </td>

                <td class="px-6 py-4 text-right">
                  <span
                    class="inline-block bg-red-50 text-red-700 px-4 py-1.5 rounded-lg font-bold text-sm border border-red-100 min-w-[60px] text-center"
                  >
                    {{ item.jumlah }}
                  </span>
                </td>
              </tr>

              <tr v-if="paginatedList.length === 0">
                <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                  <div class="flex flex-col items-center">
                    <svg
                      class="w-12 h-12 mb-3 opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <span class="font-medium"
                      >Tidak ada data untuk ditampilkan</span
                    >
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
    </div>
  </div>
</template>
