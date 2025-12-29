<script setup>
import { ref, computed } from "vue";
import bpjsRepo from "../api/bpjsRepository";
import { formatDateIndo, formatTimestamp } from "../utils/formatters";
import BasePagination from "../components/BasePagination.vue"; // Pastikan path import benar

// ================= STATE =================
const loading = ref(false);
const message = ref("");

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 10;

// Data
const listLaporanBPJS = ref([]);

// Form
const formLaporanBPJS = ref({
  tglAwal: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
});

// ================= HELPER API =================
const handleApiCall = async (apiFunc, onSuccess) => {
  loading.value = true;
  message.value = "";
  currentPage.value = 1; // Reset ke halaman 1 saat ambil data baru

  try {
    const res = await apiFunc();
    onSuccess(res);
  } catch (err) {
    console.error("API Error:", err);
    message.value =
      err?.response?.data?.metaData?.message ||
      err?.message ||
      "Gagal memuat data.";
  } finally {
    loading.value = false;
  }
};

// ================= FETCH =================
const fetchLaporanBPJS = () => {
  handleApiCall(
    () =>
      bpjsRepo.postAntrean(
        formLaporanBPJS.value.tglAwal,
        formLaporanBPJS.value.tglAkhir
      ),
    (res) => {
      const rawData = res.data.response;
      listLaporanBPJS.value = Array.isArray(rawData) ? rawData : [];

      if (!listLaporanBPJS.value.length) {
        message.value = "Data laporan BPJS tidak ditemukan.";
      }
    }
  );
};

// ================= COMPUTED =================
// 1. Sorting Data
const sortedList = computed(() => {
  if (!Array.isArray(listLaporanBPJS.value)) return [];

  return [...listLaporanBPJS.value].sort((a, b) => {
    const tglA = a.tglSep || a.tglKunjungan || a.tanggal || 0;
    const tglB = b.tglSep || b.tglKunjungan || b.tanggal || 0;
    return new Date(tglB) - new Date(tglA);
  });
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return sortedList.value.slice(start, start + itemsPerPage);
});
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row justify-between items-center md:items-center gap-4"
    >
      <div class="text-center md:text-left">
        <h1 class="text-3xl font-extrabold text-slate-900">Laporan BPJS</h1>
        <p class="text-slate-500 mt-1">Laporan harian antrean & layanan BPJS</p>
      </div>
    </div>

    <div
      class="bg-white rounded-2xl shadow-sm border min-h-[500px] flex flex-col"
    >
      <div class="p-6 bg-slate-50/50 border-b border-slate-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="md:col-span-1">
            <label class="label">Tanggal Awal</label>
            <input
              v-model="formLaporanBPJS.tglAwal"
              type="date"
              class="form-input"
            />
          </div>

          <div class="md:col-span-1">
            <label class="label">Tanggal Akhir</label>
            <input
              v-model="formLaporanBPJS.tglAkhir"
              type="date"
              class="form-input"
            />
          </div>

          <div class="md:col-span-1 md:col-start-4">
            <button
              @click="fetchLaporanBPJS"
              :disabled="loading"
              class="w-full h-[40px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Tampilkan Data</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="message" class="bg-yellow-50 p-4 text-center text-yellow-700">
        {{ message }}
      </div>

      <div class="overflow-x-auto flex-1">
        <table class="w-full text-sm text-left whitespace-nowrap">
          <thead
            class="bg-slate-900 text-white font-bold uppercase text-xs tracking-wider"
          >
            <tr>
              <th class="px-4 py-3 bg-slate-800">Booking Info</th>
              <th class="px-4 py-3 bg-slate-800">Pasien</th>
              <th class="px-4 py-3 bg-slate-800">Layanan</th>
              <th class="px-4 py-3 bg-slate-800">Tanggal</th>
              <th class="px-4 py-3 bg-slate-800">Waktu</th>
              <th class="px-4 py-3 bg-slate-800">Status & Task</th>
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
                    >{{ item.sumberdata }}</span
                  >
                  <span
                    class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                    >{{ formatDateIndo(item.tanggal) }}</span
                  >
                </div>
              </td>

              <td class="px-4 py-3 align-top">
                <div class="font-bold text-slate-800">
                  {{ item.norekammedis }}
                </div>
                <div class="text-xs text-slate-500 font-mono">
                  NIK: {{ item.nik }}
                </div>
                <div class="text-xs text-slate-500 font-mono">
                  JKN: {{ item.nokapst }}
                </div>
                <div
                  class="text-xs text-slate-600 mt-1 flex items-center gap-1"
                >
                  <svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  {{ item.nohp }}
                </div>
                <div
                  v-if="item.ispeserta"
                  class="mt-1 text-[10px] text-green-600 font-bold"
                >
                  ✓ Peserta Aktif
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
                    <span class="block text-xl font-extrabold text-blue-800">{{
                      item.noantrean
                    }}</span>
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

              <td class="font-bold text-slate-800 px- py-4 align-top">
                {{ formatDateIndo(item.tanggal) }}
              </td>

              <td class="px-4 py-3 align-top text-xs">
                <div class="mb-1">
                  <span class="text-slate-400">Dibuat:</span><br />
                  <span class="font-mono text-slate-700">{{
                    formatTimestamp(item.createdtime)
                  }}</span>
                </div>
                <div class="mb-1">
                  <span class="text-slate-400">Estimasi:</span><br />
                  <span class="font-mono text-slate-700">{{
                    formatTimestamp(item.estimasidilayani)
                  }}</span>
                </div>
                <div>
                  <span class="badge-purple">{{ item.jampraktek }}</span>
                </div>
              </td>

              <td class="px-4 py-3 align-top">
                <div class="mb-2">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-bold border"
                    :class="
                      item.status === 'Belum dilayani'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    "
                  >
                    {{ item.status }}
                  </span>
                </div>

                <div
                  class="grid grid-cols-4 gap-1 text-[10px] font-mono w-[200px]"
                >
                  <div
                    v-for="n in 7"
                    :key="n"
                    class="bg-slate-100 p-1 rounded text-center"
                    :title="'Task ' + n"
                  >
                    <span class="block text-slate-400 font-bold">T{{ n }}</span>
                    <span
                      :class="
                        item['task' + n] ? 'text-green-600' : 'text-slate-300'
                      "
                      >{{ item["task" + n] ? "✓" : "-" }}</span
                    >
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="!paginatedList.length && !loading">
              <td colspan="6" class="px-6 py-20 text-center opacity-40">
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

      <BasePagination
        v-model="currentPage"
        :total-items="sortedList.length"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>
