<script lang="ts">
  // Alt menü navigasyonu (sekmeler: docs/mimari-agac.md)
  import { onMount } from "svelte";

  let { currentPath = "/" } = $props();
  let yol = $state(currentPath);

  const menu = [
    { href: "/", ad: "Oyna", ikon: "🥞" },
    { href: "/fislerim", ad: "Fişlerim", ikon: "🧾" },
    { href: "/profil", ad: "Profil", ikon: "👤" },
  ];

  onMount(() => {
    yol = window.location.pathname;
    const handleNav = () => {
      yol = window.location.pathname;
    };
    document.addEventListener("astro:page-load", handleNav);
    window.addEventListener("popstate", handleNav);
    return () => {
      document.removeEventListener("astro:page-load", handleNav);
      window.removeEventListener("popstate", handleNav);
    };
  });
</script>

<nav class="alt-menu" aria-label="Ana menü">
  {#each menu as m}
    {@const aktif = yol === m.href || (m.href !== "/" && yol.startsWith(m.href))}
    <a href={m.href} class:aktif aria-current={aktif ? "page" : undefined}>
      <span class="ikon" aria-hidden="true">{m.ikon}</span>
      <span class="ad">{m.ad}</span>
    </a>
  {/each}
</nav>

<style>
  /* Tezgâh kenarı gibi duran alt menü: seçili sekme karamel bir düğme olarak hafifçe yükselir.
     Yükseklik ~62 px kalır: lobideki OYNA düğmesi menünün hemen üstüne bu yüksekliğe göre yerleşir (Restoran.svelte). */
  .alt-menu {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding: 0 8px env(safe-area-inset-bottom);
    background: var(--kart);
    border-top: 3px solid var(--kenar);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 24px -14px color-mix(in srgb, var(--renk-koyu) 45%, transparent);
    z-index: 20;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  /* Restoran sahnesinde oyun başlayınca menü aşağı kayıp yerini malzeme çubuğuna bırakır */
  :global(body[data-oyunda]) .alt-menu {
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
  }

  .alt-menu a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 59px;
    padding: 6px 0 5px;
    color: var(--yazi-soluk);
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* İkon, basılabilir küçük bir yuvarlak düğmenin içinde */
  .ikon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 34px;
    border-radius: 14px;
    font-size: 20px;
    line-height: 1;
    transition: transform 0.15s ease-out, background 0.2s, box-shadow 0.2s;
  }

  .ad {
    font-size: 11px;
    font-weight: 700;
  }

  .alt-menu a:active .ikon {
    transform: scale(0.88);
  }

  .alt-menu a.aktif {
    color: var(--renk-ana);
  }

  .alt-menu a.aktif .ad {
    font-weight: 900;
  }

  .alt-menu a.aktif .ikon {
    background: linear-gradient(180deg, color-mix(in srgb, var(--renk-ana) 94%, var(--ust-yazi)), var(--renk-ana) 60%);
    box-shadow: 0 3px 0 var(--renk-ana-koyu), 0 8px 14px -8px var(--renk-ana-koyu);
    transform: translateY(-6px);
    animation: sec 0.35s ease-out;
  }

  .alt-menu a.aktif:active .ikon {
    transform: translateY(-3px) scale(0.92);
  }

  @keyframes sec {
    0% { transform: translateY(0) scale(0.8); }
    60% { transform: translateY(-9px) scale(1.08); }
    100% { transform: translateY(-6px) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ikon { transition: none; }
    .alt-menu a.aktif .ikon { animation: none; }
  }
</style>
