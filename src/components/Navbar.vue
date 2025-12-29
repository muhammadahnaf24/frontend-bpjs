<script setup>
import { ref } from "vue";

// State untuk mengontrol buka/tutup menu di HP
const isMenuOpen = ref(false);
</script>

<template>
  <nav class="bg-black text-white sticky top-0 z-50 border-b border-gray-800">
    <div class="container mx-auto px-6 max-w-7xl">
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-8">
          <router-link to="/" class="flex items-center gap-2 group">
            <span class="font-semibold text-lg tracking-tight">
              VCLAIM <span class="text-gray-500 font-normal">BPJS</span>
            </span>
          </router-link>

          <div class="hidden md:flex items-center gap-1">
            <router-link to="/peserta" class="nav-link"> Peserta </router-link>
            <router-link to="/monitoring" class="nav-link">
              Monitoring
            </router-link>
            <router-link to="/rencana-kontrol" class="nav-link">
              Rencana Kontrol
            </router-link>
            <router-link to="/laporan-bpjs" class="nav-link">
              Laporan BPJS
            </router-link>
          </div>
        </div>

        <div class="md:hidden flex items-center">
          <button
            @click="isMenuOpen = !isMenuOpen"
            class="text-gray-400 hover:text-white focus:outline-none p-2"
          >
            <svg
              v-if="!isMenuOpen"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
            <svg
              v-else
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div
      v-show="isMenuOpen"
      class="md:hidden border-t border-gray-800 bg-black"
    >
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
        <router-link
          to="/peserta"
          class="mobile-link"
          @click="isMenuOpen = false"
        >
          Peserta
        </router-link>
        <router-link
          to="/monitoring"
          class="mobile-link"
          @click="isMenuOpen = false"
        >
          Monitoring
        </router-link>
        <router-link
          to="/rencana-kontrol"
          class="mobile-link"
          @click="isMenuOpen = false"
        >
          Rencana Kontrol
        </router-link>
        <router-link
          to="/laporan-bpjs"
          class="mobile-link"
          @click="isMenuOpen = false"
        >
          Laporan BPJS
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Style untuk Menu Desktop (Vercel Style) */
.nav-link {
  @apply text-sm text-gray-400 px-3 py-4 transition-colors duration-200 relative font-medium;
}

.nav-link:hover {
  @apply text-gray-200;
}

/* Style khusus untuk Menu Mobile (Lebih besar area kliknya) */
.mobile-link {
  @apply block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors;
}

/* Active State (Sama untuk Desktop & Mobile) */
.router-link-active {
  @apply text-white;
}

/* Garis putih di bawah menu aktif (Hanya Desktop) */
@media (min-width: 768px) {
  .router-link-active::after {
    content: "";
    @apply absolute bottom-0 left-0 w-full h-[2px] bg-white;
    animation: slideIn 0.2s ease-out;
  }
}

@keyframes slideIn {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
