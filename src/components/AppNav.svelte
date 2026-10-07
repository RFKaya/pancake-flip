<script lang="ts">
  // Adım 3 & 9: Alt menü navigasyonu ve dinamik sepet rozeti
  import { onMount } from "svelte";
  import { sepet } from "$lib/sepet.svelte";

  let { currentPath = "/" } = $props();
  let yol = $state(currentPath);

  const menu = [
    { href: "/", ad: "Bölümler", ikon: "🥞" },
    { href: "/fislerim", ad: "Fişlerim", ikon: "🧾" },
    { href: "/sepet", ad: "Sepet", ikon: "🛒" },
    { href: "/profil", ad: "Profil", ikon: "👤" },
    { href: "/hakkinda", ad: "Rehber", ikon: "📖" },
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
      {#if m.href === "/sepet" && sepet.adet > 0}
        <b class="rozet">{sepet.adet}</b>
      {/if}
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

  .rozet {
    position: absolute;
    top: 4px;
    left: calc(50% + 6px);
    min-width: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: 11px;
    line-height: 18px;
    text-align: center;
  }
</style>
