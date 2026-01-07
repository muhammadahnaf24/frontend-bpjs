<script setup>
import Navbar from "./components/Navbar.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />

    <main class="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </main>

    <footer
      class="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm"
    >
      &copy; 2025 Bridging BPJS System.
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
