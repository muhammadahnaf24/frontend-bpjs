<script setup>
import { ref, computed, watch } from "vue";
import { formatDateIndo, formatTimestamp } from "../utils/formatters";
import BasePagination from "./BasePagination.vue";
import * as XLSX from "xlsx";
import { useDokterStore } from "../stores/dokterStore";

const dokterStore = useDokterStore();
const props = defineProps({
  dataList: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  hideFilters: {
    type: Boolean,
    default: false,
  },
  exportFileName: {
    type: String,
    default: "Data_Pasien_Gagal",
  },
});

const emit = defineEmits(["refresh"]);

const currentPage = ref(1);
const itemsPerPage = 10;
const filterT5 = ref("all");
const filterDb = ref("all");

// --- FILTER & SORT ---
const filteredAndSortedList = computed(() => {
  let result = [...props.dataList];

  if (filterT5.value === "success") {
    result = result.filter((item) => item.task5 && item.task5 !== "");
  } else if (filterT5.value === "failed") {
    result = result.filter((item) => !item.task5 || item.task5 === "");
  }

  if (filterDb.value === "ada") {
    result = result.filter((item) => item.status_validasi === "ADA");
  } else if (filterDb.value === "tidak") {
    result = result.filter((item) => item.status_validasi === "TIDAK");
  }

  return result.sort((a, b) => {
    const tglA = a.tglSep || a.tglKunjungan || a.tanggal || 0;
    const tglB = b.tglSep || b.tglKunjungan || b.tanggal || 0;
    return new Date(tglB) - new Date(tglA);
  });
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredAndSortedList.value.slice(start, start + itemsPerPage);
});

watch([filterT5, filterDb, () => props.dataList], () => {
  currentPage.value = 1;
});

// --- EXPORT FUNCTION ---
const exportToExcel = () => {
  if (filteredAndSortedList.value.length === 0) return;

  const dataToExport = filteredAndSortedList.value.map((item) => {
    const realDoctorName =
      item.namadokter ||
      dokterStore.getNamaDokter(item.kodedokter) ||
      item.kodedokter ||
      "Tanpa Nama";

    return {
      "Nama Dokter": realDoctorName,
      "Kode Dokter": item.kodedokter,
      "No Antrean": item.noantrean,
      "No Referensi": item.nomorreferensi,
      "Dibuat Pada": formatTimestamp(item.createdtime),
      "Kode Booking": item.kodebooking,
      "No Rekam Medis": item.norekammedis,
      Tanggal: formatDateIndo(item.tanggal),
      Poli: item.kodepoli,
      "Sumber Data": item.sumberdata,
      "Status BPJS": item.status,
      "Validasi RS": item.status_validasi,
      "Task 1": item.task1 ? item.task1 : "-",
      "Task 2": item.task2 ? item.task2 : "-",
      "Task 3": item.task3 ? item.task3 : "-",
      "Task 4": item.task4 ? item.task5 : "-",
      "Task 6": item.task6 ? item.task6 : "-",
      "Task 7": item.task7 ? item.task7 : "-",
    };
  });

  let namaDokter = dataToExport[0]?.["Nama Dokter"] || "Dokter";
  namaDokter = namaDokter.trim();

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pasien");

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
  const fileName = `${props.exportFileName} - ${namaDokter} - ${timestamp}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <div
      class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4"
    >
      <div v-if="!hideFilters" class="flex gap-4 w-full md:w-auto">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase"
            >Status T5</label
          >
          <select
            v-model="filterT5"
            class="form-input py-1 text-sm cursor-pointer mt-1"
          >
            <option value="all">Semua</option>
            <option value="success">Berhasil</option>
            <option value="failed">Gagal</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase"
            >Validasi DB</label
          >
          <select
            v-model="filterDb"
            class="form-input py-1 text-sm cursor-pointer mt-1"
          >
            <option value="all">Semua</option>
            <option value="ada">ADA</option>
            <option value="tidak">TIDAK ADA</option>
          </select>
        </div>
      </div>

      <div v-else class="text-sm text-slate-600">
        Menampilkan <b>{{ filteredAndSortedList.length }}</b> data terpilih.
      </div>

      <button
        @click="exportToExcel"
        :disabled="filteredAndSortedList.length === 0"
        class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-sm transition-all"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Excel
      </button>
    </div>

    <div class="overflow-x-auto flex-1">
      <table class="w-full text-sm text-left whitespace-nowrap">
        <thead
          class="bg-slate-900 text-white font-bold uppercase text-xs tracking-wider"
        >
          <tr>
            <th class="px-4 py-3 bg-slate-800">Booking Info</th>
            <th class="px-4 py-3 bg-slate-800">Layanan</th>
            <th class="px-4 py-3 bg-slate-800">Tanggal</th>
            <th class="px-4 py-3 bg-slate-800">Waktu</th>
            <th class="px-4 py-3 bg-slate-800 text-center">Status</th>
            <th class="px-4 py-3 bg-slate-800 text-center">Validasi DB</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="(item, idx) in paginatedList"
            :key="item.kodebooking || idx"
            class="hover:bg-blue-50/50 transition-colors even:bg-slate-50/50"
          >
            <td class="px-4 py-3 align-top">
              <div class="font-bold text-blue-700 text-base">
                {{ item.kodebooking }}
              </div>
              <div class="text-xs text-slate-500 mb-1">
                Ref: {{ item.nomorreferensi }}
              </div>
              <div class="flex gap-2 mt-1">
                <span
                  class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                >
                  {{ item.sumberdata }}
                </span>
              </div>
            </td>

            <td class="px-4 py-3 align-top">
              <div class="flex items-center gap-3 mb-1">
                <div
                  class="text-center bg-blue-100 p-2 rounded-lg min-w-[40px]"
                >
                  <span
                    class="block text-[10px] text-blue-600 uppercase font-bold"
                    >No</span
                  >
                  <span class="block text-xl font-extrabold text-blue-800">
                    {{ item.noantrean }}
                  </span>
                </div>
                <div>
                  <div class="font-bold text-slate-700">
                    Poli: {{ item.kodepoli }}
                  </div>
                  <div class="text-xs text-slate-500">
                    Dr. ID: {{ item.kodedokter }}
                  </div>
                  <div class="text-xs text-slate-500">
                    Jns Kunj: {{ item.jeniskunjungan }}
                  </div>
                </div>
              </div>
            </td>

            <td class="font-bold text-slate-800 px-4 py-4 align-top">
              {{ formatDateIndo(item.tanggal) }}
            </td>

            <td class="px-4 py-3 align-top text-xs">
              <div class="mb-1">
                <span class="text-slate-400">Dibuat:</span><br />
                <span class="font-mono text-slate-700">
                  {{ formatTimestamp(item.createdtime) }}
                </span>
              </div>
              <div class="mb-1">
                <span class="text-slate-400">Estimasi:</span><br />
                <span class="font-mono text-slate-700">
                  {{ formatTimestamp(item.estimasidilayani) }}
                </span>
              </div>
            </td>

            <td class="px-4 py-3 align-top">
              <div class="mb-2">
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border"
                  :class="
                    item.status === 'Belum dilayani'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  "
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="
                      item.status === 'Belum dilayani'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    "
                  >
                  </span>
                  {{ item.status }}
                </span>
              </div>

              <div class="flex items-center gap-1" title="Indikator Task 1 - 7">
                <div
                  v-for="n in 7"
                  :key="n"
                  class="h-1.5 w-full max-w-[24px] rounded-full transition-all duration-300"
                  :class="item['task' + n] ? 'bg-green-500' : 'bg-slate-200'"
                  :title="
                    'Task ' +
                    n +
                    ': ' +
                    (item['task' + n] ? item['task' + n] : 'Belum')
                  "
                ></div>
              </div>

              <div
                class="flex justify-between mt-1 text-[9px] text-slate-400 font-mono"
              >
                <span>T1</span>
                <span>T7</span>
              </div>
            </td>

            <td class="px-4 py-3 align-top text-center">
              <div
                v-if="item.status_validasi === 'ADA'"
                class="flex flex-col items-center justify-center"
              >
                <div
                  class="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-600 shadow-sm mb-1"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div
                v-else-if="item.status_validasi === 'TIDAK'"
                class="flex flex-col items-center justify-center opacity-60"
              >
                <div
                  class="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-400 mb-1"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div
                v-else
                class="flex flex-col items-center justify-center h-full pt-2"
              >
                <span class="text-slate-300 font-bold text-xl">-</span>
              </div>
            </td>
          </tr>

          <tr v-if="!paginatedList.length && !loading">
            <td colspan="7" class="px-6 py-20 text-center opacity-40">
              <div class="flex flex-col items-center justify-center">
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
        :total-items="filteredAndSortedList.length"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>
