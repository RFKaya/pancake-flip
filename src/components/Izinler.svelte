<script lang="ts">
  import { onMount } from "svelte";
  import { bildirimGonder, destekleniyorMu, izinDurumu, izinIste } from "$lib/native";
  import type { IzinDurumu } from "$lib/types";

  let izinler = $state<IzinDurumu[]>([]);
  let native = $state(false);
  let mesaj = $state("");

  const etiket: Record<string, string> = {
    granted: "izin verildi",
    denied: "reddedildi",
    prompt: "henüz sorulmadı",
    unsupported: "bu platformda yok",
    unknown: "bilinmiyor",
  };

  async function yenile() {
    const s = await izinDurumu();
    izinler = s.ok ? s.veri : [];
  }
  async function iste(id: string) {
    const s = await izinIste(id);
    if (s.ok) izinler = s.veri;
    else mesaj = "İzin istenemedi.";
  }
  async function test() {
    const s = await bildirimGonder("Pancake Flip", "Günlük krep hatırlatması / oyun bildirimi");
    mesaj = s.ok ? "Bildirim gönderildi (izin verildiyse görürsünüz)." : "Bildirim gönderilemedi.";
  }
  onMount(() => {
    native = destekleniyorMu("izin");
    if (native) yenile();
  });
</script>

<section class="izinler">
  <h1>İzinler</h1>
  <p class="aciklama">Bu uygulama yalnız gerçekten kullandığı izni ister. Açıklayamadığımız bir izni istemeyiz.</p>
  {#if !native}
    <p class="not">İzinler yalnız uygulama (Tauri) içinde görünür; tarayıcı önizlemesinde sistem izni yoktur.</p>
  {:else}
    {#if izinler.length === 0}<p class="not">Tanımlı izin yok.</p>{/if}
    <ul>
      {#each izinler as izin (izin.id)}
        <li>
          <div class="ust"><strong>{izin.title}</strong><span class="rozet rozet-{izin.status}">{etiket[izin.status] ?? izin.status}</span></div>
          <p class="notlar">{izin.notes}</p>
          {#if izin.can_request}<button onclick={() => iste(izin.id)}>İzin iste</button>{/if}
        </li>
      {/each}
    </ul>
    <button class="test" onclick={test}>Test bildirimi gönder</button>
  {/if}
  {#if mesaj}<p class="mesaj">{mesaj}</p>{/if}
</section>

<style>
  .izinler { max-width: 640px; margin: 0 auto; padding: var(--bosluk-4); display: flex; flex-direction: column; gap: var(--bosluk-3); }
  .aciklama, .not { color: var(--yazi-soluk); }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bosluk-3); }
  li { border: 1px solid var(--kenar); background: var(--kart); border-radius: var(--radius); padding: var(--bosluk-3); display: flex; flex-direction: column; gap: var(--bosluk-2); }
  .ust { display: flex; justify-content: space-between; align-items: center; gap: var(--bosluk-2); }
  .rozet { font-size: 0.8rem; padding: 0.1rem var(--bosluk-2); border-radius: 999px; border: 1px solid var(--kenar); }
  .rozet-granted { color: var(--basari); }
  .rozet-denied { color: var(--vurgu); }
  .notlar { margin: 0; color: var(--yazi-soluk); font-size: 0.9rem; }
  button { align-self: flex-start; padding: var(--bosluk-2) var(--bosluk-4); border-radius: var(--radius-kucuk); border: 1px solid var(--renk-ana); background: var(--renk-ana); color: var(--renk-ana-yazi); cursor: pointer; }
  .mesaj { color: var(--yazi-soluk); font-size: 0.9rem; }
</style>
