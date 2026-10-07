<script lang="ts">
  // Bölümler ekranı (geçici sürüm): bölüm ızgarası, yıldızlar, kilit
  import { onMount } from "svelte";
  import { kayit } from "$lib/kayit.svelte";
  import { BOLUMLER } from "$lib/oyun/servis.svelte";

  onMount(() => kayit.yukle());
</script>

<div class="sayfa">
  <h1>🥞 Bölümler</h1>
  <p class="giris">
    Tavaya <b>dokun</b> (hamur dökülür), krep pişince <b>yukarı kaydır</b> (tabağa düşer), malzemeleri koy,
    sonra müşteriye <b>dokun</b>.
  </p>
  <div class="izgara">
    {#each BOLUMLER as b (b.id)}
      {@const acik = kayit.acik(b.id)}
      {@const yildiz = kayit.yildiz(b.id)}
      <a class="kart bolum" class:kilitli={!acik} href={acik ? `/servis/${b.id}` : undefined} aria-disabled={!acik}>
        <span class="no">{acik ? b.id : "🔒"}</span>
        <span class="yildiz">{"⭐".repeat(yildiz)}{"☆".repeat(3 - yildiz)}</span>
        <span class="yeni">{b.yeni}</span>
      </a>
    {/each}
  </div>
  <p class="coin">🪙 {kayit.veri.coin}</p>
</div>

<style>
  h1 {
    margin: 0;
    font-size: 24px;
  }

  .giris {
    margin: 0;
    color: var(--yazi-soluk);
    font-size: 14px;
    line-height: 1.5;
  }

  .izgara {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (min-width: 768px) {
    .izgara { grid-template-columns: repeat(3, 1fr); }
  }

  @media (min-width: 1200px) {
    .sayfa { max-width: 1100px; margin: 0 auto; }
    .izgara { grid-template-columns: repeat(4, 1fr); }
  }

  .bolum {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 8px;
    text-align: center;
  }

  .no {
    font-size: 30px;
    font-weight: 800;
    color: var(--renk-ana);
  }

  .yildiz {
    font-size: 16px;
  }

  .yeni {
    min-height: 32px;
    color: var(--yazi-soluk);
    font-size: 12px;
  }

  .kilitli {
    opacity: 0.55;
    pointer-events: none;
  }

  .coin {
    margin: 0;
    text-align: center;
    font-weight: 700;
  }
</style>
