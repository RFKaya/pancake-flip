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

<nav class="alt-menu">
  {#each menu as m}
    <a
      href={m.href}
      class:aktif={yol === m.href || (m.href !== "/" && yol.startsWith(m.href))}
    >
      <span class="ikon">{m.ikon}</span>
      {m.ad}
    </a>
  {/each}
</nav>

<style>
  .alt-menu {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--kart);
    border-top: 1px solid var(--kenar);
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
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 0;
    font-size: 11px;
    color: var(--yazi-soluk);
    text-decoration: none;
  }

  .alt-menu a.aktif {
    color: var(--renk-ana);
    font-weight: 600;
  }

  .ikon {
    font-size: 20px;
  }
</style>
