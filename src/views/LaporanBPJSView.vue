<script setup>
import { ref, computed, onMounted } from "vue";
import { useLaporanStore } from "../stores/laporanStore";
import { useDokterStore } from "../stores/dokterStore";
import ListLaporan from "../components/ListLaporan.vue";
import bpjsRepo from "../api/bpjsRepository";
import Swal from "sweetalert2";

const laporanStore = useLaporanStore();
const dokterStore = useDokterStore();

const filterT5 = ref("all");
const filterDb = ref("all");

const formLaporanBPJS = ref({
  tglAwal: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
});

const rawData = computed(() => laporanStore.listData);
const loading = computed(() => laporanStore.isLoading);
const message = computed(() => laporanStore.error);

const processedList = computed(() => {
  let result = [...(rawData.value || [])];

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
  return result;
});

const listBelumDilayani = computed(() => {
  if (!rawData.value) return [];
  return rawData.value.filter(
    (item) =>
      (!item.task5 || item.task5 === "") &&
      item.status !== "Batal" &&
      item.status_validasi === "TIDAK"
  );
});

const fetchLaporanBPJS = async () => {
  if (dokterStore.listDokter.length === 0) {
    await dokterStore.fetchDokter();
  }
  laporanStore.fetchLaporan(
    formLaporanBPJS.value.tglAwal,
    formLaporanBPJS.value.tglAkhir,
    true
  );
};

const handleRefresh = () => {
  fetchLaporanBPJS();
};

const handleBatalkanSemua = async () => {
  const jumlah = listBelumDilayani.value.length;
  if (jumlah === 0) return;

  const result = await Swal.fire({
    title: "Batalkan Semua?",
    text: `Anda akan membatalkan ${jumlah} antrean yang belum dilayani.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: `Ya, Batalkan!`,
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  Swal.fire({ title: "Memproses...", didOpen: () => Swal.showLoading() });

  let sukses = 0;
  for (const item of listBelumDilayani.value) {
    try {
      await bpjsRepo.batalAntrean({
        kodebooking: item.kodebooking,
        keterangan: "Batal Kunjungan (System Auto Cancel)",
      });
      sukses++;
    } catch (err) {}
  }

  await fetchLaporanBPJS();

  Swal.fire("Selesai!", `Berhasil membatalkan ${sukses} data.`, "success");
};

onMounted(() => {
  if (laporanStore.listData.length === 0) {
    fetchLaporanBPJS();
  } else if (laporanStore.lastParams.tglAwal) {
    formLaporanBPJS.value.tglAwal = laporanStore.lastParams.tglAwal;
    formLaporanBPJS.value.tglAkhir = laporanStore.lastParams.tglAkhir;
  }
});

const totalT5 = computed(
  () => (rawData.value || []).filter((item) => item.task5).length
);
const totalT5Gagal = computed(
  () => (rawData.value || []).filter((item) => !item.task5).length
);
const statusBatal = computed(
  () => (rawData.value || []).filter((item) => item.status === "Batal").length
);
const persentaseT5 = computed(() => {
  const totalData = (rawData.value || []).length;
  const totalReal = totalData - statusBatal.value;
  if (totalReal <= 0) return 0;
  return ((totalT5.value / totalReal) * 100).toFixed(1);
});
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="text-center md:text-left">
          <h1 class="text-3xl font-extrabold text-slate-900">Laporan BPJS</h1>
          <p class="text-slate-500 mt-1">
            Laporan harian antrean & layanan BPJS
          </p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label class="label text-xs font-bold text-slate-500 uppercase mb-1"
              >Tanggal Awal</label
            >
            <input
              v-model="formLaporanBPJS.tglAwal"
              type="date"
              class="form-input w-full"
            />
          </div>

          <div>
            <label class="label text-xs font-bold text-slate-500 uppercase mb-1"
              >Tanggal Akhir</label
            >
            <input
              v-model="formLaporanBPJS.tglAkhir"
              type="date"
              class="form-input w-full"
            />
          </div>

          <div>
            <label class="label text-xs font-bold text-slate-500 uppercase mb-1"
              >Status T5</label
            >
            <select
              v-model="filterT5"
              class="form-input w-full cursor-pointer bg-slate-50"
            >
              <option value="all">Semua</option>
              <option value="success" class="text-green-600 font-bold">
                T5 Berhasil
              </option>
              <option value="failed" class="text-red-500 font-bold">
                T5 Gagal
              </option>
            </select>
          </div>

          <div>
            <label class="label text-xs font-bold text-slate-500 uppercase mb-1"
              >Validasi DB</label
            >
            <select
              v-model="filterDb"
              class="form-input w-full cursor-pointer bg-slate-50"
            >
              <option value="all">Semua</option>
              <option value="ada" class="text-green-600 font-bold">Ada</option>
              <option value="tidak" class="text-red-500 font-bold">
                Tidak Ada
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

      <div
        v-if="message"
        class="bg-yellow-50 p-4 text-center text-yellow-700 rounded-lg border border-yellow-200"
      >
        {{ message }}
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] overflow-hidden"
      >
        <ListLaporan
          :data-list="processedList"
          :loading="loading"
          :hide-filters="true"
          export-file-name="Laporan_Harian_BPJS"
          @refresh="handleRefresh"
        />
      </div>

      <div
        v-if="listBelumDilayani.length > 0"
        class="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"
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
          <div>
            <h3 class="text-red-700 font-bold text-base">
              Terdeteksi Data Belum Dilayani
            </h3>
            <p class="text-red-600 text-sm">
              Ditemukan
              <span class="font-extrabold"
                >{{ listBelumDilayani.length }} Data</span
              >
              yang belum diselesaikan (T5 Kosong).
            </p>
          </div>
        </div>
        <button
          @click="handleBatalkanSemua"
          class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform active:scale-95 text-sm flex items-center gap-2"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Batalkan Semua ({{ listBelumDilayani.length }})
        </button>
      </div>

      <div class="mt-8">
        <h2
          class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"
        >
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
          RINGKASAN HARI INI
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">T5 Berhasil</p>
              <p class="text-3xl font-extrabold text-slate-800">
                {{ totalT5 }}
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
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">T5 Gagal</p>
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
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">
                Pasien Batal
              </p>
              <p class="text-3xl font-extrabold text-slate-800">
                {{ statusBatal }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative overflow-hidden"
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
  </div>
</template>
