<script lang="ts">
  // Olmayan adres (404): dili adresten bulur, HataDurumu ile "bulunamadı" ve rehbere dönüş bağlantısı gösterir
  import { onMount } from "svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import { detayMetni, dilBul, sayfaYolu, type Dil } from "$lib/i18n";

  let dil = $state<Dil>("tr");
  onMount(() => {
    dil = dilBul(window.location.pathname);
    document.documentElement.lang = dil;
    document.documentElement.dir = dil === "ar" || dil === "fa" ? "rtl" : "ltr";
  });
  const dm = $derived(detayMetni[dil]);
</script>

<HataDurumu baslik={dm.bulunamadiBaslik} mesaj={dm.bulunamadiMesaj} />
<a class="btn" href={sayfaYolu(dil, "rehber")}>← {dm.rehbereDon}</a>

<style>
  .btn {
    text-decoration: none;
  }
</style>
