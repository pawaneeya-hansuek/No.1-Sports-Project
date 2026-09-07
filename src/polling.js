// Schedule after completion so a slow connection cannot accumulate requests.
export function startPolling(task, delay = 5000) {
  let stopped = false;
  let timer;
  async function tick() {
    try {
      await task();
    } finally {
      if (!stopped) timer = setTimeout(tick, delay);
    }
  }
  timer = setTimeout(tick, delay);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
