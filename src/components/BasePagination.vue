<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
});

const emit = defineEmits(["update:modelValue"]);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / props.itemsPerPage))
);

const startItem = computed(
  () => (props.modelValue - 1) * props.itemsPerPage + 1
);
const endItem = computed(() =>
  Math.min(props.modelValue * props.itemsPerPage, props.totalItems)
);

const paginationNumbers = computed(() => {
  const total = totalPages.value;
  const current = props.modelValue;
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i < current + delta + 1)
    ) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
});

// --- ACTIONS ---
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    emit("update:modelValue", page);
  }
};
</script>

<template>
  <div
    v-if="totalItems > 0"
    class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4"
  >
    <div class="text-sm text-slate-500 font-medium">
      Menampilkan
      <span class="text-slate-900 font-bold">{{ startItem }}</span>
      sampai
      <span class="text-slate-900 font-bold">{{ endItem }}</span>
      dari
      <span class="text-slate-900 font-bold">{{ totalItems }}</span>
      data
    </div>

    <div class="flex items-center gap-1">
      <button
        @click="changePage(modelValue - 1)"
        :disabled="modelValue === 1"
        class="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <template v-for="(page, index) in paginationNumbers" :key="index">
        <span v-if="page === '...'" class="px-2 py-2 text-slate-400 text-sm"
          >...</span
        >

        <button
          v-else
          @click="changePage(page)"
          class="px-3.5 py-2 rounded-md text-sm font-bold transition-all border shadow-sm"
          :class="
            modelValue === page
              ? 'bg-slate-800 border-slate-800 text-white'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          "
        >
          {{ page }}
        </button>
      </template>

      <button
        @click="changePage(modelValue + 1)"
        :disabled="modelValue === totalPages"
        class="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>
