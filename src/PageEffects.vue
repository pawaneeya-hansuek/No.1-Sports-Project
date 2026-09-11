<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { ArrowUp } from 'lucide-vue-next';
import { t } from './state';
import { scrollBehavior } from './motion';
const progress = ref(null);
const elevated = ref(false);
let frame = 0;
let resizeObserver;
function update() {
  frame = 0;
  const top = window.scrollY;
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.value?.style.setProperty('--page-progress', distance > 0 ? Math.min(1, Math.max(0, top / distance)) : 0);
  elevated.value = top > 600;
  document.documentElement.classList.toggle('page-scrolled', top > 24);
}
function schedule() { if (!frame) frame = requestAnimationFrame(update); }
function backToTop() {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
  document.querySelector('.site-header .brand')?.focus({ preventScroll: true });
}
onMounted(() => {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);
  }
  update();
});
onUnmounted(() => {
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  resizeObserver?.disconnect();
  cancelAnimationFrame(frame);
  document.documentElement.classList.remove('page-scrolled');
});
</script>
<template>
  <div ref="progress" class="reading-progress" aria-hidden="true"></div>
  <Transition name="float-control">
    <button v-if="elevated" class="back-to-top" type="button" :aria-label="t('กลับด้านบน', 'Back to top')" @click="backToTop"><ArrowUp :size="20" /></button>
  </Transition>
</template>
