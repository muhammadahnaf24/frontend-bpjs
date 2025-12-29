<script setup>
import { ref, computed } from "vue";
import bpjsRepo from "../api/bpjsRepository";
import { formatDateIndo } from "../utils/formatters";

// STATE
const activeTab = ref("kartu");
const loading = ref(false);
const message = ref("");
const listRencana = ref([]);

// PAGINATION STATE
const currentPage = ref(1);
const itemsPerPage = 15;

// FORM STATE
const formKartu = ref({
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  noKartu: "",
  filter: "2", // Default: Tgl Rencana
});

const formTanggal = ref({
  tglAwal: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
  filter: "2", // Default: Tgl Rencana
});

// COMPUTED: Cek Filter mana yang sedang aktif
const currentFilter = computed(() => {
  if (activeTab.value === "kartu") {
    return formKartu.value.filter;
  } else {
    return formTanggal.value.filter;
  }
});

// COMPUTED: 1. SORTING SEMUA DATA (TANPA LIMIT)
const sortedList = computed(() => {
  return [...listRencana.value].sort((a, b) => {
    let dateA, dateB;
    if (currentFilter.value === "1") {
      dateA = new Date(a.tglTerbitKontrol || a.tglEntri || a.tglTerbit);
      dateB = new Date(b.tglTerbitKontrol || b.tglEntri || b.tglTerbit);
    } else {
      dateA = new Date(a.tglRencanaKontrol);
      dateB = new Date(b.tglRencanaKontrol);
    }
    return dateB - dateA; // Descending (Terbaru diatas)
  });
});

// COMPUTED: 2. TOTAL HALAMAN
const totalPages = computed(() => {
  return Math.ceil(sortedList.value.length / itemsPerPage);
});

// COMPUTED: 3. DATA YANG DITAMPILKAN PER HALAMAN (SLICE)
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedList.value.slice(start, end);
});

// FUNCTIONS PAGINATION
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

// FUNCTIONS API
const cariData = async () => {
  loading.value = true;
  listRencana.value = [];
  message.value = "";
  currentPage.value = 1;

  try {
    let res;
    if (activeTab.value === "kartu") {
      if (!formKartu.value.noKartu) throw new Error("Nomor Kartu wajib diisi");
      const bulanFmt = String(formKartu.value.bulan).padStart(2, "0");

      res = await bpjsRepo.getRencanaKontrolByKartu(
        bulanFmt,
        formKartu.value.tahun,
        formKartu.value.noKartu,
        formKartu.value.filter
      );
    } else {
      res = await bpjsRepo.getRencanaKontrolByTanggal(
        formTanggal.value.tglAwal,
        formTanggal.value.tglAkhir,
        formTanggal.value.filter
      );
    }

    listRencana.value = res.data.response?.list || [];
    if (!listRencana.value.length) message.value = "Data tidak ditemukan.";
  } catch (err) {
    console.error(err);
    message.value =
      err.response?.data?.metaData?.message || err.message || "Error server.";
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
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
          Rencana Kontrol
        </h1>
        <p class="text-slate-500 mt-1">
          Kelola surat kontrol rawat jalan dan inap.
        </p>
      </div>

      <div
        class="bg-white p-1 rounded-xl inline-flex border border-slate-200 shadow-sm"
      >
        <button
          v-for="tab in ['kartu', 'tanggal']"
          :key="tab"
          @click="
            activeTab = tab;
            listRencana = [];
            message = '';
          "
          class="px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 capitalize"
          :class="
            activeTab === tab
              ? 'bg-slate-900 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          "
        >
          Via {{ tab }}
        </button>
      </div>
    </div>

    <div
      class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col"
    >
      <div class="p-6 bg-slate-50/50 border-b border-slate-200">
        <div
          v-if="activeTab === 'kartu'"
          class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
        >
          <div class="md:col-span-2">
            <label class="label">No Kartu</label>
            <input
              v-model="formKartu.noKartu"
              type="text"
              placeholder="Masukkan No Kartu"
              class="form-input"
            />
          </div>
          <div class="md:col-span-1">
            <label class="label">Bulan</label>
            <select v-model="formKartu.bulan" class="form-select">
              <option v-for="i in 12" :key="i" :value="i">{{ i }}</option>
            </select>
          </div>
          <div class="md:col-span-1">
            <label class="label">Tahun</label>
            <input v-model="formKartu.tahun" type="number" class="form-input" />
          </div>

          <div class="md:col-span-1">
            <label class="label">Filter</label>
            <select v-model="formKartu.filter" class="form-select">
              <option value="1">Tgl Entri</option>
              <option value="2">Tgl Rencana</option>
            </select>
          </div>

          <div class="md:col-span-1">
            <button
              @click="cariData"
              :disabled="loading"
              class="w-full h-[40px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Cari</span>
            </button>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="md:col-span-1">
            <label class="label">Tgl Mulai</label>
            <input
              v-model="formTanggal.tglAwal"
              type="date"
              class="form-input"
            />
          </div>
          <div class="md:col-span-1">
            <label class="label">Tgl Akhir</label>
            <input
              v-model="formTanggal.tglAkhir"
              type="date"
              class="form-input"
            />
          </div>
          <div class="md:col-span-1">
            <label class="label">Filter</label>
            <select v-model="formTanggal.filter" class="form-select">
              <option value="1">Tgl Entri</option>
              <option value="2">Tgl Rencana</option>
            </select>
          </div>
          <div class="md:col-span-1">
            <button
              @click="cariData"
              :disabled="loading"
              class="w-full h-[40px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Cari</span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="message"
        class="bg-yellow-50 p-4 text-center text-yellow-700 font-medium text-sm border-b border-yellow-100"
      >
        {{ message }}
      </div>

      <div class="overflow-x-auto flex-1">
        <table class="w-full text-sm text-left">
          <thead
            class="bg-slate-900 text-white font-bold uppercase text-xs tracking-wider"
          >
            <tr>
              <th class="px-6 py-4">No Surat</th>
              <th class="px-6 py-4">No Kartu</th>
              <th class="px-6 py-4">Pelayanan</th>
              <th class="px-6 py-4">
                {{ currentFilter === "1" ? "Tgl Entri" : "Tgl Rencana" }}
              </th>
              <th class="px-6 py-4">Dokter</th>
              <th class="px-6 py-4">Poli</th>
              <th class="px-6 py-4">SEP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in paginatedList"
              :key="item.noSuratKontrol"
              class="hover:bg-blue-50/50 transition-colors even:bg-slate-50/50"
            >
              <td class="px-6 py-4 font-bold text-blue-700">
                {{ item.noSuratKontrol }}
              </td>
              <td class="px-6 py-4 text-slate-800">{{ item.noKartu }}</td>
              <td class="px-6 py-4 text-slate-800">{{ item.jnsPelayanan }}</td>
              <td class="px-6 py-4 font-medium text-slate-900">
                {{
                  currentFilter === "1"
                    ? formatDateIndo(item.tglTerbitKontrol)
                    : formatDateIndo(item.tglRencanaKontrol)
                }}
              </td>
              <td class="px-6 py-4 font-bold text-slate-800">
                {{ item.namaDokter }}
              </td>
              <td class="px-6 py-4 text-slate-600">
                {{ item.namaPoliTujuan }}
              </td>
              <td class="px-6 py-4">
                <span
                  :class="
                    item.terbitSEP === 'Sudah' ? 'badge-green' : 'badge-red'
                  "
                >
                  {{ item.terbitSEP }}
                </span>
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

      <div
        v-if="sortedList.length > 0"
        class="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between"
      >
        <div class="text-sm text-slate-500">
          Menampilkan
          <span class="font-bold text-slate-800"
            >{{ (currentPage - 1) * itemsPerPage + 1 }} -
            {{ Math.min(currentPage * itemsPerPage, sortedList.length) }}</span
          >
          dari
          <span class="font-bold text-slate-800">{{ sortedList.length }}</span>
          data
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-4 py-2 bg-white border border-slate-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          <div
            class="px-4 py-2 bg-slate-200 rounded text-sm font-bold text-slate-700"
          >
            {{ currentPage }}
          </div>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 bg-white border border-slate-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
