// Progressive enhancement: content remains visible if motion is unavailable.
export const reducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
export const scrollBehavior = () => reducedMotion() ? 'instant' : 'smooth';
const reveals = new WeakMap();
let observer;
export const reveal = {
  mounted(el, { value = 0 }) {
    if (reducedMotion() || !window.IntersectionObserver || !el.animate) return;
    observer ??= new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const state = reveals.get(entry.target);
        if (!state || reducedMotion()) continue;
        state.animation = entry.target.animate(
          [{ opacity: 0, translate: '0 22px' }, { opacity: 1, translate: '0 0' }],
          { duration: 600, delay: state.delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
        );
      }
    }, { threshold: 0.08 });
    reveals.set(el, { delay: Math.min(240, Math.max(0, Number(value) || 0)) });
    observer.observe(el);
  },
  beforeUnmount(el) {
    observer?.unobserve(el);
    reveals.get(el)?.animation?.cancel();
    reveals.delete(el);
  },
};
const spotlights = new WeakMap();
export const spotlight = {
  mounted(el) {
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
    const controller = new AbortController();
    const state = { controller, frame: 0, rect: null, x: 0, y: 0 };
    const reset = () => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      el.style.removeProperty('--light-opacity');
    };
    el.addEventListener('pointerenter', () => { state.rect = el.getBoundingClientRect(); }, { signal: controller.signal });
    el.addEventListener('pointermove', event => {
      if (reducedMotion()) return reset();
      if (!state.rect) state.rect = el.getBoundingClientRect();
      state.x = event.clientX - state.rect.left;
      state.y = event.clientY - state.rect.top;
      if (state.frame) return;
      state.frame = requestAnimationFrame(() => {
        el.style.setProperty('--light-x', state.x + 'px');
        el.style.setProperty('--light-y', state.y + 'px');
        el.style.setProperty('--light-opacity', '.75');
        state.frame = 0;
      });
    }, { signal: controller.signal, passive: true });
    el.addEventListener('pointerleave', reset, { signal: controller.signal });
    window.addEventListener('scroll', () => { state.rect = null; }, { signal: controller.signal, passive: true });
    window.addEventListener('resize', () => { state.rect = null; }, { signal: controller.signal, passive: true });
    spotlights.set(el, state);
  },
  beforeUnmount(el) {
    const state = spotlights.get(el);
    if (!state) return;
    state.controller.abort();
    cancelAnimationFrame(state.frame);
    spotlights.delete(el);
  },
};
