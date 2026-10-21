<script lang="ts">
  // Yönetim paneli kabuğu: üst çubuk, kenar menüsü ve seçili bölüm. Uygulamada önce oturum denetlenir (giriş yoksa Giris);
  // tarayıcıda yerel arka uç olmadığı için giriş ve oyuncu verisi hiç çizilmez, yalnız içerik özeti görünür (docs/platform-destegi.md).
  import { onMount } from "svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { destekleniyorMu, yonetimCikis, yonetimOturumu } from "$lib/native";
  import { tema } from "$lib/tema.svelte";
  import type { YonetimMenuOgesi, YonetimOturumu, YonetimSekmesi } from "$lib/types";
  import { hataMetni } from "$lib/yonetim";
  import Giris from "./Giris.svelte";
  import Malzemeler from "./Malzemeler.svelte";
  import MusteriTipleri from "./MusteriTipleri.svelte";
  import PanelOzeti from "./PanelOzeti.svelte";

  const m = yonetimSozlugu();
  const arkaUcVar = destekleniyorMu("yonetim");

  const sekmeler: YonetimMenuOgesi[] = [
    { id: "ozet", ikon: "📊" },
    { id: "malzemeler", ikon: "🥞" },
    { id: "musteriler", ikon: "🧑" },
  ];
  let aktif = $state<YonetimSekmesi>("ozet");

  let oturum = $state<YonetimOturumu | null>(null);
  let durum = $state<"yukleniyor" | "giris" | "hazir" | "hata">(arkaUcVar ? "yukleniyor" : "hazir");
  let hata = $state("");

  async function oturumuDenetle() {
    durum = "yukleniyor";
    const s = await yonetimOturumu();
    if (!s.ok) {
      hata = hataMetni(s.hata, m);
      durum = "hata";
      return;
    }
    oturum = s.veri;
    durum = s.veri ? "hazir" : "giris";
  }

  async function cikisYap() {
    await yonetimCikis();
    oturum = null;
    durum = "giris";
  }

  onMount(() => {
    if (arkaUcVar) oturumuDenetle();
  });
</script>

<div class="panel">
  <header class="ust">
    <a class="logo" href="/" aria-label={m.oyunaDon}>pancake<span>flip</span></a>
    <h1>{m.baslik}</h1>
    <div class="araclar">
      {#if oturum}
        <span class="kim" title={`${m.roller}: ${oturum.roles.join(", ")}`}>
          <strong>{oturum.user.name}</strong>
          <small>{oturum.roles.join(", ")}</small>
        </span>
        <button class="arac" type="button" onclick={cikisYap}>{m.cikis}</button>
      {/if}
      <button class="arac" type="button" onclick={() => tema.degistir()} aria-label={m.temaDegistir} title={m.temaDegistir}>
        {tema.mod === "gece" ? "☀️" : "🌙"}
      </button>
      <a class="arac" href="/">{m.oyunaDon}</a>
    </div>
  </header>

  {#if durum === "yukleniyor"}
    <div class="orta"><Yukleniyor metin={m.oturumYukleniyor} satir={3} /></div>
  {:else if durum === "hata"}
    <div class="orta"><HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={oturumuDenetle} /></div>
  {:else if durum === "giris"}
    <div class="orta"><Giris onGiris={(o) => ((oturum = o), (durum = "hazir"))} /></div>
  {:else}
    <div class="govde">
      <nav class="menu" aria-label={m.menuEtiketi}>
        {#each sekmeler as s (s.id)}
          <button type="button" class:secili={aktif === s.id} aria-current={aktif === s.id ? "page" : undefined} onclick={() => (aktif = s.id)}>
            <span aria-hidden="true">{s.ikon}</span>
            {m.menu[s.id]}
          </button>
        {/each}
      </nav>
      <main class="icerik">
        {#if aktif === "ozet"}
          <PanelOzeti oyuncuVerisi={arkaUcVar && oturum !== null} />
        {:else if aktif === "malzemeler"}
          <Malzemeler {oturum} />
        {:else if aktif === "musteriler"}
          <MusteriTipleri {oturum} />
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .panel {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--zemin);
    color: var(--yazi);
  }

  .ust {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--bosluk-3);
    padding: var(--bosluk-3) var(--bosluk-4);
    padding-top: calc(var(--bosluk-3) + env(safe-area-inset-top));
    background: var(--renk-koyu);
    color: var(--ust-yazi);
  }

  .logo {
    font-weight: 900;
    font-size: 18px;
    letter-spacing: -0.3px;
  }

  .logo span {
    color: var(--renk-logo);
  }

  h1 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    opacity: 0.85;
  }

  .araclar {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: var(--bosluk-2);
  }

  .kim {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    text-align: end;
  }

  .kim small {
    opacity: 0.7;
  }

  .arac {
    padding: 6px 12px;
    border: 1px solid color-mix(in srgb, var(--ust-yazi) 30%, transparent);
    border-radius: var(--radius-kucuk);
    background: transparent;
    color: var(--ust-yazi);
    font-size: 13px;
    font-weight: 700;
  }

  .arac:hover {
    background: color-mix(in srgb, var(--ust-yazi) 12%, transparent);
  }

  .orta {
    width: 100%;
    max-width: 440px;
    margin: 48px auto;
    padding: 0 var(--bosluk-4);
  }

  .govde {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .menu {
    display: flex;
    gap: var(--bosluk-1);
    overflow-x: auto;
    padding: var(--bosluk-2) var(--bosluk-4);
    border-bottom: 1px solid var(--kenar);
    background: var(--kart);
  }

  .menu button {
    display: flex;
    align-items: center;
    gap: var(--bosluk-2);
    padding: 10px 12px;
    border: 0;
    border-radius: var(--radius-kucuk);
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--yazi-soluk);
    text-align: start;
  }

  .menu button:hover {
    background: color-mix(in srgb, var(--kenar) 40%, transparent);
    color: var(--yazi);
  }

  .menu button.secili {
    background: color-mix(in srgb, var(--renk-ana) 14%, transparent);
    color: var(--renk-ana);
  }

  .icerik {
    flex: 1;
    min-width: 0;
    padding: var(--bosluk-4);
    padding-bottom: calc(var(--bosluk-4) + env(safe-area-inset-bottom));
  }

  /* Geniş ekranda menü sola yaslanır (mimari-agac.md §3: tablet 768px, masaüstü 1200px) */
  @media (min-width: 768px) {
    .govde {
      flex-direction: row;
    }

    .menu {
      flex-direction: column;
      width: 220px;
      flex-shrink: 0;
      padding: var(--bosluk-4) var(--bosluk-3);
      border-bottom: 0;
      border-inline-end: 1px solid var(--kenar);
    }

    .icerik {
      padding: 24px;
    }
  }

  @media (min-width: 1200px) {
    .icerik {
      padding: 32px;
    }
  }
</style>
