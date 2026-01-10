<script setup>
import { onMounted, onUnmounted } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Informasi",
  },
  maxWidth: {
    type: String,
    default: "max-w-6xl",
  },
});

const emit = defineEmits(["close"]);

const handleKeydown = (e) => {
  if (e.key === "Escape" && props.isOpen) {
    emit("close");
  }
};

onMounted(() => document.addEventListener("keydown", handleKeydown));
onUnmounted(() => document.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[999] overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0"
        >
          <div
            class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
            @click="emit('close')"
          ></div>

          <div
            class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full flex flex-col max-h-[90vh]"
            :class="maxWidth"
          >
            <div
              class="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex justify-between items-center sticky top-0 z-10"
            >
              <h3
                class="text-lg font-bold leading-6 text-slate-800"
                id="modal-title"
              >
                {{ title }}
              </h3>

              <button
                type="button"
                class="rounded-md bg-transparent p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                @click="emit('close')"
              >
                <span class="sr-only">Close</span>
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="px-6 py-4 overflow-y-auto custom-scrollbar">
              <slot name="body">
                <p class="text-slate-500">Konten modal belum diisi.</p>
              </slot>
            </div>

            <div
              v-if="$slots.footer"
              class="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-row-reverse gap-3 sticky bottom-0 z-10"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative {
  transition: all 0.3s ease-out;
}
.modal-leave-active .relative {
  transition: all 0.2s ease-in;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
</style>
