<script setup>
import { ref, computed, watch } from "vue";
import bpjsRepo from "../api/bpjsRepository"; // Sesuaikan path ini jika perlu
import { formatDateIndo, formatTimestamp } from "../utils/formatters";
import BasePagination from "../components/BasePagination.vue";
import Swal from "sweetalert2";

// ================= STATE =================
const loading = ref(false);
const message = ref("");

const currentPage = ref(1);
const itemsPerPage = 10;

const filterT5 = ref("all");
const filterDb = ref("all");

const listLaporanBPJS = ref([]);

const formLaporanBPJS = ref({
  tglAwal: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
});

// ================= HELPER API =================
const handleApiCall = async (apiFunc, onSuccess) => {
  loading.value = true;
  message.value = "";
  currentPage.value = 1;

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

// ================= COMPUTED & LOGIC =================

const filteredAndSortedList = computed(() => {
  if (!Array.isArray(listLaporanBPJS.value)) return [];

  let result = [...listLaporanBPJS.value];

  // 1. Filter T5 (BPJS)
  if (filterT5.value === "success") {
    result = result.filter((item) => item.task5 && item.task5 !== "");
  } else if (filterT5.value === "failed") {
    result = result.filter((item) => !item.task5 || item.task5 === "");
  }

  // 2. Filter DB (Validasi)
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

watch([filterT5, filterDb], () => {
  currentPage.value = 1;
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredAndSortedList.value.slice(start, start + itemsPerPage);
});

// Statistik
const totalT5 = computed(() => {
  if (!Array.isArray(listLaporanBPJS.value)) return 0;
  return listLaporanBPJS.value.filter((item) => item.task5).length;
});

const totalT5Gagal = computed(() => {
  if (!Array.isArray(listLaporanBPJS.value)) return 0;
  return listLaporanBPJS.value.filter((item) => !item.task5).length;
});

const statusBatal = computed(() => {
  if (!Array.isArray(listLaporanBPJS.value)) return 0;
  return listLaporanBPJS.value.filter((item) => item.status === "Batal").length;
});

const persentaseT5 = computed(() => {
  const totalData = listLaporanBPJS.value.length;
  const totalBatal = statusBatal.value;

  const totalReal = totalData - totalBatal;

  if (totalReal <= 0) return 0;

  return ((totalT5.value / totalReal) * 100).toFixed(1);
});

const handleCancelBooking = async (item) => {
  const result = await Swal.fire({
    title: "Batalkan Antrean?",
    text: `Kode Booking: ${item.kodebooking}. Data tidak ditemukan di RS.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Batalkan!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  loading.value = true;

  try {
    await bpjsRepo.batalAntrean({
      kodebooking: item.kodebooking,
      keterangan: "Terjadi perubahan jadwal dokter, silahkan daftar kembali",
    });

    Swal.fire("Berhasil!", "Antrean telah dibatalkan di BPJS.", "success");

    fetchLaporanBPJS();
  } catch (err) {
    Swal.fire("Gagal", err.response?.data?.message || err.message, "error");
  } finally {
    loading.value = false;
  }
};
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
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label class="label">Tanggal Awal</label>
            <input
              v-model="formLaporanBPJS.tglAwal"
              type="date"
              class="form-input"
            />
          </div>

          <div>
            <label class="label">Tanggal Akhir</label>
            <input
              v-model="formLaporanBPJS.tglAkhir"
              type="date"
              class="form-input"
            />
          </div>

          <div>
            <label class="label">Status T5 BPJS</label>
            <select
              v-model="filterT5"
              class="form-input bg-white cursor-pointer"
            >
              <option value="all">Semua</option>
              <option class="text-green-600 font-bold" value="success">
                T5 Berhasil (✓)
              </option>
              <option class="text-slate-500" value="failed">
                T5 Kosong (-)
              </option>
            </select>
          </div>

          <div>
            <label class="label">Validasi DB RS</label>
            <select
              v-model="filterDb"
              class="form-input bg-white cursor-pointer"
            >
              <option value="all">Semua</option>
              <option class="text-green-600 font-bold bg-green-50" value="ada">
                ADA
              </option>
              <option class="text-red-500 bg-red-50" value="tidak">
                TIDAK ADA
              </option>
            </select>
          </div>

          <div>
            <button
              @click="fetchLaporanBPJS"
              :disabled="loading"
              class="w-full h-[42px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Cari Data</span>
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
              <th class="px-4 py-3 bg-slate-800">Layanan</th>
              <th class="px-4 py-3 bg-slate-800">Tanggal</th>
              <th class="px-4 py-3 bg-slate-800">Waktu</th>
              <th class="px-4 py-3 bg-slate-800">Status & Task</th>
              <th class="px-4 py-3 bg-slate-800 text-center">Validasi DB</th>
              <th class="px-4 py-3 bg-slate-800 text-center">Aksi</th>
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
                  <span
                    class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                  >
                    {{ formatDateIndo(item.tanggal) }}
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
                <div>
                  <span class="badge-purple">{{ item.jampraktek }}</span>
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

                <div
                  class="flex items-center gap-1"
                  title="Indikator Task 1 - 7"
                >
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
              <td class="px-4 py-3 align-top text-center">
                <button
                  v-if="
                    (!item.task5 || item.task5 === '') &&
                    item.status_validasi === 'TIDAK'
                  "
                  @click="handleCancelBooking(item)"
                  class="group flex items-center justify-center w-full gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-600 hover:text-white transition-all duration-200"
                  title="Batalkan Antrean di BPJS"
                >
                  <svg
                    class="w-4 h-4 transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                <div
                  v-else-if="item.status_validasi === 'ADA'"
                  class="text-xs text-slate-400 italic"
                ></div>

                <div v-else class="text-center text-slate-300">-</div>
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

      <BasePagination
        v-model="currentPage"
        :total-items="filteredAndSortedList.length"
        :items-per-page="itemsPerPage"
      />
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg
          class="w-6 h-6 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        HASIL TASK 5
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">T5 Berhasil</p>
            <p class="text-3xl font-extrabold text-slate-800">{{ totalT5 }}</p>
            <p class="text-xs text-green-600 font-medium mt-1">
              Pasien Selesai & Ada Obat
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600"
          >
            <svg
              class="w-6 h-6"
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
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">
              T5 Gagal / Missed
            </p>
            <p class="text-3xl font-extrabold text-slate-800">
              {{ totalT5Gagal }}
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">Status Batal</p>
            <p class="text-3xl font-extrabold text-slate-800">
              {{ statusBatal }}
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">
                Success Rate
              </p>
              <p class="text-3xl font-extrabold text-blue-700">
                {{ persentaseT5 }}%
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 mt-2">
            <div
              class="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: persentaseT5 + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
