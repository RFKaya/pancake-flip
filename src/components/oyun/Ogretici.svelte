<script lang="ts">
  let { ikon, baslik, metin }: { ikon: string; baslik: string; metin: string } = $props();
</script>

<div class="ogretici" role="status" aria-atomic="true">
  <span class="ikon" aria-hidden="true">{ikon}</span>
  <div class="icerik">
    <strong>{baslik}</strong>
    <p>{metin}</p>
  </div>
</div>

<style>
  .ogretici {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--bosluk-2);
    width: max-content;
    max-width: min(100%, 22rem);
    padding: var(--bosluk-2) var(--bosluk-3) var(--bosluk-2) var(--bosluk-2);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    box-shadow: var(--golge-yuksek);
    color: var(--yazi);
    pointer-events: none;
    text-align: start;
  }

  .ikon {
    display: grid;
    align-self: start;
    place-items: center;
    width: 2.125rem;
    height: 2.125rem;
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--renk-ana) 15%, var(--kart));
    color: var(--renk-ana);
    font-size: 1.125rem;
    font-weight: 850;
    line-height: 1;
  }

  .icerik {
    overflow-wrap: anywhere;
  }

  strong {
    display: block;
    font-size: 0.875rem;
    font-weight: 850;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: var(--yazi-soluk);
    font-size: 0.8125rem;
    line-height: 1.35;
  }

  @media (prefers-reduced-motion: no-preference) {
    .ogretici { animation: belirme 160ms ease-out both; }
  }

  @keyframes belirme {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
