<template>
  <div class="sign-positioner" ref="wrap" aria-label="Sign placement area">
    <div class="page" ref="pageEl">
      <slot name="page-canvas"></slot>

      <div
        v-for="item in items"
        :key="item.id"
        class="stamp"
        :style="stampStyle(item)"
        role="img"
        :aria-label="`Stamp ${item.id}`"
        @pointerdown.prevent="onStampPointerDown($event, item)"
        tabindex="0"
      >
        <img :src="item.src" draggable="false" alt="stamp" />
        <div class="handle rotate" @pointerdown.stop.prevent="startRotate($event, item)" aria-hidden="true">⤾</div>
        <button class="btn delete" @click.stop.prevent="removeStamp(item.id)" aria-label="删除印章">✕</button>
        <div class="handle scale" @pointerdown.stop.prevent="startScale($event, item)" aria-hidden="true">⇲</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineExpose } from 'vue';
import type { PropType } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// Strongly-typed stamp item
export interface StampItem {
  id: string;
  src: string; // data URL
  x: number; // px, relative to page's top-left
  y: number; // px
  scale: number;
  rotation: number; // deg
  width: number; // px
  height: number; // px
}

const props = defineProps({
  initial: {
    type: Array as PropType<StampItem[]>,
    default: () => []
  }
});

const items = reactive<StampItem[]>([]);
const wrap = ref<HTMLElement | null>(null);
const pageEl = ref<HTMLElement | null>(null);

onMounted(() => {
  props.initial.forEach(s => items.push({ ...s }));
});

let active: { item: StampItem; offsetX: number; offsetY: number } | null = null;
let rotating: { item: StampItem; centerX: number; centerY: number } | null = null;
let scaling: { item: StampItem; startDist: number; startWidth: number; startHeight: number } | null = null;

function onStampPointerDown(e: PointerEvent, item: StampItem) {
  const rect = (pageEl.value as HTMLElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  active = { item, offsetX: px - item.x, offsetY: py - item.y };
  (e.target as Element).setPointerCapture(e.pointerId);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { once: true });
}

function onPointerMove(e: PointerEvent) {
  const rect = (pageEl.value as HTMLElement).getBoundingClientRect();
  if (active) {
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // keep inside page bounds
    active.item.x = Math.max(0, Math.min(px - active.offsetX, rect.width - active.item.width));
    active.item.y = Math.max(0, Math.min(py - active.offsetY, rect.height - active.item.height));
  } else if (rotating) {
    const cx = rotating.centerX + rect.left;
    const cy = rotating.centerY + rect.top;
    const ang = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    rotating.item.rotation = ang;
  } else if (scaling) {
    // calculate distance from center to pointer
    const centerX = scaling.item.x + scaling.item.width / 2;
    const centerY = scaling.item.y + scaling.item.height / 2;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dx = px - centerX;
    const dy = py - centerY;
    const dist = Math.hypot(dx, dy);
    const ratio = Math.max(0.2, dist / scaling.startDist);
    scaling.item.width = Math.max(16, scaling.startWidth * ratio);
    scaling.item.height = Math.max(16, scaling.startHeight * ratio);
  }
}

function onPointerUp() {
  active = null;
  rotating = null;
  scaling = null;
  window.removeEventListener('pointermove', onPointerMove);
}

function startRotate(e: PointerEvent, item: StampItem) {
  e.stopPropagation();
  const rect = (pageEl.value as HTMLElement).getBoundingClientRect();
  const centerX = item.x + item.width / 2;
  const centerY = item.y + item.height / 2;
  rotating = { item, centerX, centerY };
  (e.target as Element).setPointerCapture(e.pointerId);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { once: true });
}

function startScale(e: PointerEvent, item: StampItem) {
  e.stopPropagation();
  const rect = (pageEl.value as HTMLElement).getBoundingClientRect();
  const centerX = item.x + item.width / 2;
  const centerY = item.y + item.height / 2;
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const startDist = Math.hypot(px - centerX, py - centerY);
  scaling = { item, startDist, startWidth: item.width, startHeight: item.height };
  (e.target as Element).setPointerCapture(e.pointerId);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { once: true });
}

function addStamp(dataUrl: string, x = 20, y = 20, width = 150, height = 60) {
  const id = uuidv4();
  items.push({ id, src: dataUrl, x, y, scale: 1, rotation: 0, width, height });
  return id;
}

function removeStamp(id: string) {
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) items.splice(idx, 1);
}

function stampStyle(item: StampItem) {
  const transform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;
  return {
    transform,
    width: item.width + 'px',
    height: item.height + 'px'
  } as Record<string, string>;
}

function getPlacedItems() {
  return items.map(i => ({ id: i.id, x: i.x, y: i.y, scale: i.scale, rotation: i.rotation, width: i.width, height: i.height, src: i.src }));
}

// expose methods to parent via ref
defineExpose({ addStamp, getPlacedItems, removeStamp });
</script>

<style scoped>
:root {
  --stamp-handle-size: 28px;
  --stamp-border: 1px solid rgba(0,0,0,0.08);
  --accent: #0b5fff;
  --danger: #e55353;
}

.sign-positioner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #fafafa;
  padding: 12px;
  box-sizing: border-box;
}

.page {
  position: relative;
  display: inline-block;
  background: #fff;
  box-shadow: 0 1px 4px rgba(16,24,40,0.06);
}

.stamp {
  position: absolute;
  touch-action: none;
  cursor: grab;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  outline: none;
}

.stamp:focus { box-shadow: 0 0 0 3px rgba(11,95,255,0.12); }

.stamp img { width: 100%; height: 100%; display: block; pointer-events: none; border-radius: 4px; }

.handle {
  position: absolute;
  width: var(--stamp-handle-size);
  height: var(--stamp-handle-size);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  cursor: grab;
  pointer-events: auto;
}

.handle.rotate { right: -14px; top: -14px; }
.handle.scale { left: -14px; bottom: -14px; }

.btn.delete {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: var(--danger);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  pointer-events: auto;
}

.btn.delete:focus { box-shadow: 0 0 0 3px rgba(229,83,83,0.18); }
</style>
