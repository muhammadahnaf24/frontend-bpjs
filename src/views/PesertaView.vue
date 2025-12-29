<script setup>
import { ref } from "vue";
import bpjsRepo from "../api/bpjsRepository";
import { formatDateIndo } from "../utils/formatters";

const nik = ref("");
const tglSEP = ref(new Date().toISOString().slice(0, 10));
const peserta = ref(null);
const loading = ref(false);
const errorMsg = ref("");

const cariPeserta = async () => {
  if (!nik.value) return alert("NIK wajib diisi!");
  loading.value = true;
  peserta.value = null;
  errorMsg.value = "";
  try {
    const res = await bpjsRepo.getPeserta(nik.value, tglSEP.value);
    peserta.value = res.data.response?.peserta || null;
    if (!peserta.value) errorMsg.value = "Data peserta tidak ditemukan.";
  } catch (err) {
    errorMsg.value =
      err.response?.data?.metaData?.message ||
      "Gagal terkoneksi ke server BPJS.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-8">
    <div class="text-center md:text-left">
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
        Cek Kepesertaan
      </h1>
      <p class="text-slate-500 mt-2">
        Validasi status aktif dan detail hak kelas peserta.
      </p>
    </div>

    <div
      class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8"
    >
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div class="md:col-span-5">
          <label class="label">NIK / No. KTP</label>
          <div class="relative">
            <input
              v-model="nik"
              type="text"
              placeholder="Masukkan 16 digit NIK..."
              class="form-input pl-10 h-12"
            />
            <svg
              class="w-5 h-5 text-slate-400 absolute left-3 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
          </div>
        </div>
        <div class="md:col-span-4">
          <label class="label">Tanggal SEP</label>
          <div class="relative">
            <input v-model="tglSEP" type="date" class="form-input pl-10 h-12" />
            <svg
              class="w-5 h-5 text-slate-400 absolute left-3 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <div class="md:col-span-3">
          <button
            @click="cariPeserta"
            :disabled="loading"
            class="w-full h-12 rounded-lg font-bold text-white transition-all shadow-lg bg-slate-900 hover:bg-blue-900 shadow-slate-900/20"
          >
            <span v-if="loading" class="loader"></span>
            <span v-else>Cek Status</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm"
    >
      <p class="font-bold text-xs uppercase mb-1">Error</p>
      {{ errorMsg }}
    </div>

    <div
      v-if="peserta"
      class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
    >
      <div
        class="p-8 bg-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h2 class="text-3xl font-bold text-white">{{ peserta.nama }}</h2>
          <div class="flex items-center gap-3 mt-2 text-slate-300">
            <span
              class="font-mono bg-slate-800 px-2 py-1 rounded text-sm font-semibold border border-slate-700"
              >{{ peserta.noKartu }}</span
            >
            <span class="text-sm opacity-50">•</span>
            <span class="text-sm font-medium">{{ peserta.nik }}</span>
          </div>
        </div>

        <div
          class="px-5 py-2 rounded-full font-bold text-sm tracking-wide shadow-lg"
          :class="
            peserta.statusPeserta?.kode === '0'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          "
        >
          {{ peserta.statusPeserta?.keterangan || "STATUS TIDAK DIKETAHUI" }}
        </div>
      </div>

      <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div class="space-y-6">
          <h3
            class="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2"
          >
            Identitas
          </h3>
          <div class="space-y-4">
            <div>
              <p class="text-xs text-slate-500">Tanggal Lahir</p>
              <p class="font-bold text-slate-800 text-lg">
                {{ formatDateIndo(peserta.tglLahir) }}
                <span class="text-xs font-normal text-slate-400"
                  >({{ peserta.umur?.umurSekarang }})</span
                >
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Jenis Kelamin</p>
              <p class="font-bold text-slate-800 text-lg">
                {{ peserta.sex === "L" ? "Laki-laki" : "Perempuan" }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h3
            class="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2"
          >
            Kepesertaan
          </h3>
          <div class="space-y-4">
            <div>
              <p class="text-xs text-slate-500">Jenis Peserta</p>
              <p class="font-bold text-blue-800 text-lg">
                {{ peserta.jenisPeserta?.keterangan }}
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Hak Kelas</p>
              <p class="font-bold text-slate-800 text-lg">
                {{ peserta.hakKelas?.keterangan }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h3
            class="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2"
          >
            Faskes
          </h3>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p class="text-xs font-bold text-slate-400 mb-1">
              Faskes Tingkat 1
            </p>
            <p class="font-bold text-slate-900 leading-tight text-lg">
              {{ peserta.provUmum?.nmProvider }}
            </p>
            <p class="text-xs text-blue-600 mt-1 font-mono">
              Kode: {{ peserta.provUmum?.kdProvider }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
