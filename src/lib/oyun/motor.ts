// Tek oyun döngüsü: requestAnimationFrame + dt, arka plana geçince otomatik duraklatma
import type { ServisDurumu } from "./servis.svelte";

export function motorBaslat(servisAl: () => ServisDurumu): () => void {
  let id = 0;
  let son = performance.now();
  const kare = (t: number) => {
    const dt = Math.min(0.1, (t - son) / 1000);
    son = t;
    servisAl().ilerle(dt);
    id = requestAnimationFrame(kare);
  };
  id = requestAnimationFrame(kare);

  const gorunurluk = () => {
    if (document.hidden) servisAl().duraklat();
    son = performance.now();
  };
  document.addEventListener("visibilitychange", gorunurluk);

  return () => {
    cancelAnimationFrame(id);
    document.removeEventListener("visibilitychange", gorunurluk);
  };
}
