// Dokunma ve yukarı kaydırma algılama (Pointer Events: fare ve dokunma birlikte)
interface JestSecenek {
  dokun?: () => void;
  yukari?: () => void;
  px: number;
  ms: number;
}

export function jest(node: HTMLElement, secenek: JestSecenek) {
  let ayar = secenek;
  let bas: { x: number; y: number; t: number } | null = null;

  const asagi = (e: PointerEvent) => {
    bas = { x: e.clientX, y: e.clientY, t: performance.now() };
    node.setPointerCapture?.(e.pointerId);
  };
  const yukariBirak = (e: PointerEvent) => {
    if (!bas) return;
    const dy = bas.y - e.clientY;
    const dx = Math.abs(e.clientX - bas.x);
    const dt = performance.now() - bas.t;
    if (dy >= ayar.px && dy > dx && dt < ayar.ms) ayar.yukari?.();
    else if (Math.hypot(dx, dy) < 14) ayar.dokun?.();
    bas = null;
  };
  const iptal = () => (bas = null);

  node.addEventListener("pointerdown", asagi);
  node.addEventListener("pointerup", yukariBirak);
  node.addEventListener("pointercancel", iptal);
  return {
    update(yeni: JestSecenek) {
      ayar = yeni;
    },
    destroy() {
      node.removeEventListener("pointerdown", asagi);
      node.removeEventListener("pointerup", yukariBirak);
      node.removeEventListener("pointercancel", iptal);
    },
  };
}
