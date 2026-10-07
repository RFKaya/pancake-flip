<script lang="ts">
  // Adım 15: Ortak başlık ve gece / gündüz modu düğmesi
  import { tema } from "$lib/tema.svelte";
</script>

<header class="ust">
  <a href="/" class="logo" aria-label="Pancake Flip ana sayfa">
    <span class="kule" aria-hidden="true"><i></i><i></i><i></i></span><span>pancake<span class="flip">flip</span></span>
  </a>
  <button
    class="tema-dugme"
    onclick={() => tema.degistir()}
    aria-label={tema.mod === "gece" ? "Gündüz moduna geç" : "Gece moduna geç"}
  >
    {tema.mod === "gece" ? "☀️" : "🌙"}
  </button>
</header>

<style>
  /* Dükkân tabelası: koyu ahşap bar + altında karamel / krem çizgili, dalgalı kenarlı tente */
  .ust {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
    padding: calc(10px + env(safe-area-inset-top)) 16px 10px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--renk-koyu) 88%, var(--renk-ana)), var(--renk-koyu));
  }

  .ust::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    height: 14px;
    background: repeating-linear-gradient(90deg, var(--renk-ana) 0 22px, color-mix(in srgb, var(--ust-yazi) 90%, var(--renk-ana)) 22px 44px);
    -webkit-mask: radial-gradient(11px 9px at 11px 0, var(--renk-koyu) 98%, transparent) 0 0 / 22px 100% repeat-x;
    mask: radial-gradient(11px 9px at 11px 0, var(--renk-koyu) 98%, transparent) 0 0 / 22px 100% repeat-x;
    filter: drop-shadow(0 3px 2px color-mix(in srgb, var(--renk-koyu) 35%, transparent));
    pointer-events: none;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ust-yazi);
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.5px;
    text-decoration: none;
  }

  .logo .flip {
    color: var(--renk-logo);
  }

  /* Mini krep kulesi (logo.svg'deki sembolün CSS hâli) */
  .kule {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 26px;
  }

  .kule i {
    width: 24px;
    height: 7px;
    margin-top: -2px;
    border-radius: 50%;
    background: var(--krep-orta);
    box-shadow: inset 0 -2px 0 var(--krep-iyi);
  }

  .kule i:first-child {
    width: 20px;
    background: var(--renk-logo);
    box-shadow: inset 0 -2px 0 var(--renk-ana);
  }

  .tema-dugme {
    width: 40px;
    height: 40px;
    border: 1px solid color-mix(in srgb, var(--ust-yazi) 20%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--ust-yazi) 10%, transparent);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--ust-yazi) 12%, transparent);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.08s ease-out, box-shadow 0.08s ease-out;
  }

  .tema-dugme:active {
    transform: translateY(2px) rotate(-20deg);
    box-shadow: 0 1px 0 color-mix(in srgb, var(--ust-yazi) 12%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .tema-dugme { transition: none; }
  }
</style>
