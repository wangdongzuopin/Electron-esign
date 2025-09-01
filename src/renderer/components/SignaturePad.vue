<template>
  <div class="signature-pad">
    <canvas ref="canvas" class="canvas" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @pointerleave="end"></canvas>
    <div class="controls">
      <button @click="clearCanvas">清除</button>
      <button @click="save">保存签名</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue';

const emit = defineEmits<{
  (e: 'save', dataUrl: string): void;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let drawing = false;

onMounted(() => {
  if (!canvas.value) return;
  const c = canvas.value;
  // 设备像素比处理，提高清晰度
  const dpr = window.devicePixelRatio || 1;
  const width = 800;
  const height = 240;
  c.style.width = width + 'px';
  c.style.height = height + 'px';
  c.width = Math.floor(width * dpr);
  c.height = Math.floor(height * dpr);
  ctx = c.getContext('2d', { desynchronized: true })!;
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
});

function getPos(e: PointerEvent) {
  if (!canvas.value) return { x: 0, y: 0 };
  const r = canvas.value.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function start(e: PointerEvent) {
  if (!canvas.value || !ctx) return;
  drawing = true;
  canvas.value.setPointerCapture(e.pointerId);
  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function move(e: PointerEvent) {
  if (!drawing || !ctx) return;
  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function end(e?: PointerEvent) {
  drawing = false;
  if (ctx) ctx.closePath();
}

function clearCanvas() {
  if (!canvas.value || !ctx) return;
  const c = canvas.value;
  ctx.clearRect(0, 0, c.width, c.height);
  // 重新设置样式缩放，如果需要
}

function save() {
  if (!canvas.value) return;
  // 输出 data URL，适合直接保存为 PNG（透明背景可在样式中处理）
  const dataUrl = canvas.value.toDataURL('image/png');
  emit('save', dataUrl);
}
</script>

<style scoped>
.signature-pad {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.canvas {
  border: 1px solid #e6e6e6;
  touch-action: none; /* 允许 pointer 事件 */
  width: 100%;
  height: 120px;
  display: block;
}
.controls {
  display: flex;
  gap: 8px;
}
</style>
