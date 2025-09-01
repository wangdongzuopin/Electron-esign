<template>
  <div class="pdf-viewer" ref="container">
    <canvas ref="pageCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineProps, defineEmits } from 'vue';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js';

const props = defineProps<{ src: ArrayBuffer | string | null }>();
const emit = defineEmits<{
  (e: 'loaded', info: { pageCount: number }): void
}>();

const container = ref<HTMLElement | null>(null);
const pageCanvas = ref<HTMLCanvasElement | null>(null);
let pdfDoc: PDFDocumentProxy | null = null;

async function loadPdf(bytes: ArrayBuffer | string) {
  pdfDoc = await pdfjsLib.getDocument(bytes as any).promise;
  const page = await pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 1.25 });
  if (!pageCanvas.value) return;
  const canvas = pageCanvas.value;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  emit('loaded', { pageCount: pdfDoc.numPages });
}

watch(() => props.src, async (v) => {
  if (v) await loadPdf(v as any);
});

onMounted(() => {
  // src 会从父组件传入
});
</script>

<style scoped>
.pdf-viewer canvas { width: 100%; height: auto; display: block; }
</style>
