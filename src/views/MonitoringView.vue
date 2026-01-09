<script setup>
import { ref, computed } from "vue";
import bpjsRepo from "../api/bpjsRepository";
import { formatDateIndo } from "../utils/formatters";
import BasePagination from "../components/BasePagination.vue";

const activeTab = ref("kunjungan");
const loading = ref(false);
const message = ref("");

const currentPage = ref(1);
const itemsPerPage = 10;

const tglMonitor = ref(new Date().toISOString().slice(0, 10));
const jenisLayanan = ref("2");
const listKunjungan = ref([]);

const formHistori = ref({
  noKartu: "",
  tglMulai: new Date().toISOString().slice(0, 10),
  tglAkhir: new Date().toISOString().slice(0, 10),
});
const listHistori = ref([]);

const handleApiCall = async (apiFunc, onSuccess) => {
  loading.value = true;
  message.value = "";
  currentPage.value = 1;
  try {
    const res = await apiFunc();
    onSuccess(res);
  } catch (err) {
    console.error(err);
    message.value =
      err.response?.data?.metaData?.message ||
      err.message ||
      "Gagal memuat data.";
  } finally {
    loading.value = false;
  }
};

const fetchKunjungan = () => {
  listKunjungan.value = [];
  handleApiCall(
    () => bpjsRepo.getMonitoringKunjungan(tglMonitor.value, jenisLayanan.value),
    (res) => {
      const data = res.data.data || res.data.response?.sep || [];
      listKunjungan.value = Array.isArray(data) ? data : [];

      if (!listKunjungan.value.length)
        message.value = "Data Kunjungan tidak ditemukan.";
    }
  );
};

const fetchHistori = () => {
  if (!formHistori.value.noKartu)
    return (message.value = "Nomor kartu wajib diisi!");

  listHistori.value = [];
  handleApiCall(
    () =>
      bpjsRepo.getHistoriPelayanan(
        formHistori.value.noKartu,
        formHistori.value.tglMulai,
        formHistori.value.tglAkhir
      ),
    (res) => {
      const data = res.data.response?.histori || [];
      listHistori.value = Array.isArray(data) ? data : [];

      if (!listHistori.value.length)
        message.value = "Histori Pasien tidak ditemukan.";
    }
  );
};

const currentList = computed(() => {
  return activeTab.value === "kunjungan"
    ? listKunjungan.value
    : listHistori.value;
});

const sortedList = computed(() => {
  const list = currentList.value;
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const dateA = new Date(a.tglSep || a.tglPlgSep || 0);
    const dateB = new Date(b.tglSep || b.tglPlgSep || 0);
    return dateB - dateA;
  });
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return sortedList.value.slice(start, start + itemsPerPage);
});

const switchTab = (tabName) => {
  activeTab.value = tabName;
  message.value = "";
  currentPage.value = 1;
};
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row justify-between items-center md:items-center gap-4"
    >
      <div class="text-center md:text-left">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
          Monitoring BPJS
        </h1>
        <p class="text-slate-500 mt-1">
          Pantau kunjungan harian dan histori pelayanan pasien.
        </p>
      </div>

      <div
        class="bg-white p-1 rounded-xl inline-flex border border-slate-200 shadow-sm"
      >
        <button
          v-for="tab in ['kunjungan', 'histori']"
          :key="tab"
          @click="switchTab(tab)"
          class="px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 capitalize"
          :class="
            activeTab === tab
              ? 'bg-slate-900 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          "
        >
          {{ tab === "kunjungan" ? "Data Kunjungan" : "Histori Pasien" }}
        </button>
      </div>
    </div>

    <div
      class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col"
    >
      <div class="p-6 bg-slate-50/50 border-b border-slate-200">
        <div
          v-if="activeTab === 'kunjungan'"
          class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div class="md:col-span-1">
            <label class="label">Tanggal Monitor</label>
            <input v-model="tglMonitor" type="date" class="form-input" />
          </div>
          <div class="md:col-span-1">
            <label class="label">Jenis Layanan</label>
            <select v-model="jenisLayanan" class="form-select">
              <option value="1">Rawat Inap</option>
              <option value="2">Rawat Jalan</option>
            </select>
          </div>
          <div class="md:col-start-4">
            <button
              @click="fetchKunjungan"
              :disabled="loading"
              class="w-full h-[40px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Tampilkan Data</span>
            </button>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="md:col-span-1">
            <label class="label">No Kartu</label>
            <input
              v-model="formHistori.noKartu"
              type="text"
              placeholder="000123456789"
              class="form-input"
            />
          </div>
          <div class="md:col-span-1">
            <label class="label">Mulai</label>
            <input
              v-model="formHistori.tglMulai"
              type="date"
              class="form-input"
            />
          </div>
          <div class="md:col-span-1">
            <label class="label">Akhir</label>
            <input
              v-model="formHistori.tglAkhir"
              type="date"
              class="form-input"
            />
          </div>
          <div class="md:col-span-1">
            <button
              @click="fetchHistori"
              :disabled="loading"
              class="w-full h-[40px] rounded-md font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-md flex items-center justify-center"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>Cari Histori</span>
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
              <th
                v-for="head in activeTab === 'kunjungan'
                  ? [
                      'No SEP',
                      'No Rujukan',
                      'Kartu',
                      'Nama',
                      'Poli',
                      'Kelas',
                      'Diagnosa',
                      'Pulang',
                    ]
                  : ['Tgl SEP', 'No SEP', 'Layanan', 'Poli', 'Diagnosa', 'PPK']"
                :key="head"
                class="px-6 py-4"
              >
                {{ head }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-if="activeTab === 'kunjungan'">
              <tr
                v-for="(item, idx) in paginatedList"
                :key="item.noSep || idx"
                class="hover:bg-blue-50/50 transition-colors even:bg-slate-50/50"
              >
                <td class="px-6 py-4 font-bold text-blue-700">
                  {{ item.noSep }}
                </td>
                <td class="px-6 py-4 text-slate-800">
                  {{ item.noRujukan }}
                </td>
                <td class="px-6 py-4 font-mono text-slate-600">
                  {{ item.noKartu }}
                </td>
                <td class="px-6 py-4 font-bold text-slate-800">
                  {{ item.nama }}
                </td>
                <td class="px-6 py-4">
                  <span v-if="item.poli" class="badge-blue">{{
                    item.poli
                  }}</span>
                </td>
                <td class="px-6 py-4 text-slate-800">
                  {{ item.kelasRawat }}
                </td>
                <td
                  class="px-6 py-4 max-w-[200px] truncate text-slate-500"
                  :title="item.diagnosa"
                >
                  {{ item.diagnosa }}
                </td>
                <td class="px-6 py-4">{{ formatDateIndo(item.tglPlgSep) }}</td>
              </tr>
            </template>

            <template v-else>
              <tr
                v-for="(item, idx) in paginatedList"
                :key="item.noSep || idx"
                class="hover:bg-green-50/50 transition-colors even:bg-slate-50/50"
              >
                <td class="px-6 py-4 text-slate-600">
                  {{ formatDateIndo(item.tglSep) }}
                </td>
                <td class="px-6 py-4 font-bold text-blue-700">
                  {{ item.noSep }}
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="
                      item.jnsPelayanan === '1' ? 'badge-purple' : 'badge-green'
                    "
                  >
                    {{ item.jnsPelayanan === "1" ? "Inap" : "Jalan" }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-800">{{ item.poli }}</td>
                <td class="px-6 py-4 max-w-[200px] truncate text-slate-500">
                  {{ item.diagnosa }}
                </td>
                <td class="px-6 py-4 font-bold text-slate-600">
                  {{ item.ppkPelayanan }}
                </td>
              </tr>
            </template>

            <tr v-if="!paginatedList.length && !loading">
              <td colspan="8" class="px-6 py-20 text-center opacity-40">
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
