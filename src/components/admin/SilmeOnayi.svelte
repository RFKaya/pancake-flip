<script lang="ts">
  // Silme onayı: kaydı yerel arka uçta siler (crud_destroy); isteğe bağlı neden denetim günlüğüne yazılır.
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { kayitSil } from "$lib/native";
  import type { SilmeOnayiGirdileri } from "$lib/types";
  import { hataMetni } from "$lib/yonetim";
  import Pencere from "./Pencere.svelte";

  let { kaynak, id, ad, onSilindi, onIptal }: SilmeOnayiGirdileri = $props();

  const m = yonetimSozlugu();

  let neden = $state("");
  let siliniyor = $state(false);
  let hata = $state("");

  async function sil(e: SubmitEvent) {
    e.preventDefault();
    siliniyor = true;
    hata = "";
    const s = await kayitSil(kaynak, id, neden.trim() || undefined);
    siliniyor = false;
    if (s.ok) onSilindi();
    else hata = hataMetni(s.hata, m);
  }
</script>

<Pencere baslik={m.silme.baslik} kapatMetni={m.ortak.kapat} onKapat={onIptal}>
  <form onsubmit={sil}>
    <p><strong>{ad}</strong> ({id}) {m.silme.soru}</p>
    <label>
      {m.silme.neden}
      <input type="text" maxlength="200" bind:value={neden} />
    </label>
    {#if hata}<p class="form-hatasi" role="alert">{hata}</p>{/if}
    <div class="dugmeler">
      <button type="button" class="ikincil" onclick={onIptal}>{m.ortak.vazgec}</button>
      <button type="submit" class="btn tehlike" disabled={siliniyor}>{siliniyor ? m.silme.siliniyor : m.ortak.sil}</button>
    </div>
  </form>
</Pencere>

<style>
  p {
    margin: 0;
  }
</style>
