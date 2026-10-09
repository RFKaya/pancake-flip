// Bilgi sayfaları için dil yardımcıları (tr varsayılan, en, ar, fa)
export const diller = ["tr", "en", "ar", "fa"] as const;
export type Dil = (typeof diller)[number];

export const dilAdi: Record<Dil, string> = {
  tr: "Türkçe",
  en: "English",
  ar: "العربية",
  fa: "فارسی",
};

export const yon = (dil: Dil): "ltr" | "rtl" => (dil === "ar" || dil === "fa" ? "rtl" : "ltr");

const dilMi = (s: string | undefined): s is Dil => (diller as readonly string[]).includes(s ?? "");

/** URL yolundan dili bulur: /en/hakkinda -> en, /hakkinda -> tr */
export function dilBul(yol: string): Dil {
  const ilk = yol.split("/").filter(Boolean)[0];
  return dilMi(ilk) ? ilk : "tr";
}

/** URL yolundan sayfa adını bulur: /en/hakkinda -> hakkinda */
export function sayfaBul(yol: string): string {
  const parcalar = yol.split("/").filter(Boolean);
  if (dilMi(parcalar[0])) parcalar.shift();
  return parcalar[0] ?? "";
}

export const sayfaYolu = (dil: Dil, sayfa: string) => (dil === "tr" ? `/${sayfa}` : `/${dil}/${sayfa}`);

export const iletisimMetni: Record<
  Dil,
  { baslik: string; giris: string; ad: string; eposta: string; konu: string; mesaj: string; gonder: string; basari: string; eksik: string }
> = {
  tr: {
    baslik: "İletişim",
    giris: "Görüş ve önerilerini yaz. Bu bir ders projesidir; mesaj hiçbir yere gönderilmez.",
    ad: "Ad Soyad",
    eposta: "E-posta",
    konu: "Konu",
    mesaj: "Mesaj",
    gonder: "Gönder",
    basari: "Mesajınız iletildi. Teşekkürler!",
    eksik: "Lütfen tüm alanları doldurun (geçerli bir e-posta ile).",
  },
  en: {
    baslik: "Contact",
    giris: "Write your feedback and ideas. This is a course project; the message is not sent anywhere.",
    ad: "Full name",
    eposta: "Email",
    konu: "Subject",
    mesaj: "Message",
    gonder: "Send",
    basari: "Your message was sent. Thank you!",
    eksik: "Please fill in all fields (with a valid email).",
  },
  ar: {
    baslik: "اتصل بنا",
    giris: "اكتب ملاحظاتك واقتراحاتك. هذا مشروع دراسي، ولا يتم إرسال الرسالة إلى أي مكان.",
    ad: "الاسم الكامل",
    eposta: "البريد الإلكتروني",
    konu: "الموضوع",
    mesaj: "الرسالة",
    gonder: "إرسال",
    basari: "تم إرسال رسالتك. شكراً لك!",
    eksik: "يرجى ملء جميع الحقول (مع بريد إلكتروني صالح).",
  },
  fa: {
    baslik: "تماس با ما",
    giris: "نظرات و پیشنهادهای خود را بنویسید. این یک پروژه درسی است و پیام به هیچ جا ارسال نمی‌شود.",
    ad: "نام و نام خانوادگی",
    eposta: "ایمیل",
    konu: "موضوع",
    mesaj: "پیام",
    gonder: "ارسال",
    basari: "پیام شما ارسال شد. سپاسگزاریم!",
    eksik: "لطفاً همه فیلدها را (با ایمیل معتبر) پر کنید.",
  },
};

export const krepMetni: Record<Dil, { ipucu: string; sayac: (n: number) => string }> = {
  tr: { ipucu: "Krepi çevirmek için dokun!", sayac: (n) => `${n} kez çevirdin` },
  en: { ipucu: "Tap to flip the pancake!", sayac: (n) => `You flipped it ${n} times` },
  ar: { ipucu: "المس لتقلب الفطيرة!", sayac: (n) => `قلبتها ${n} مرة` },
  fa: { ipucu: "برای برگرداندن پنکیک لمس کنید!", sayac: (n) => `${n} بار برگرداندید` },
};

export const dilEtiketi: Record<Dil, string> = { tr: "Dil", en: "Language", ar: "اللغة", fa: "زبان" };

/** Malzeme rehberi metinleri (/rehber ve /rehber/<id>, dört dilde) */
export const rehberMetni: Record<
  Dil,
  { baslik: string; giris: string; acik: string; seviye: (n: number) => string; liste: string }
> = {
  tr: { baslik: "Malzeme rehberi", giris: "Oyundaki bütün malzemeler ve açıldıkları seviye.", acik: "Açık", seviye: (n) => `Seviye ${n}`, liste: "Malzemeler" },
  en: { baslik: "Ingredient guide", giris: "Every ingredient in the game and the level it unlocks at.", acik: "Unlocked", seviye: (n) => `Level ${n}`, liste: "Ingredients" },
  ar: { baslik: "دليل المكونات", giris: "جميع مكونات اللعبة والمستوى الذي تُفتح فيه.", acik: "مفتوح", seviye: (n) => `المستوى ${n}`, liste: "المكونات" },
  fa: { baslik: "راهنمای مواد", giris: "همه مواد بازی و سطحی که در آن باز می‌شوند.", acik: "باز", seviye: (n) => `سطح ${n}`, liste: "مواد" },
};

/** Malzeme adları (kimlik → ad); Türkçe adlar malzemeler.json ile aynıdır */
export const malzemeAdlari: Record<Dil, Record<string, string>> = {
  tr: { krep: "Krep", cikolata: "Çikolata", "cilek-dilimi": "Çilek dilimi", "cilek-sosu": "Çilek sosu", tereyagi: "Tereyağı", muz: "Muz", bal: "Bal", findik: "Fındık" },
  en: { krep: "Crepe", cikolata: "Chocolate", "cilek-dilimi": "Strawberry slices", "cilek-sosu": "Strawberry sauce", tereyagi: "Butter", muz: "Banana", bal: "Honey", findik: "Hazelnut" },
  ar: { krep: "كريب", cikolata: "شوكولاتة", "cilek-dilimi": "شرائح الفراولة", "cilek-sosu": "صلصة الفراولة", tereyagi: "زبدة", muz: "موز", bal: "عسل", findik: "بندق" },
  fa: { krep: "کرپ", cikolata: "شکلات", "cilek-dilimi": "برش توت‌فرنگی", "cilek-sosu": "سس توت‌فرنگی", tereyagi: "کره", muz: "موز", bal: "عسل", findik: "فندق" },
};

/** Malzeme kategorisi adları */
export const kategoriAdlari: Record<Dil, Record<"krep" | "dolgu" | "sos" | "topping", string>> = {
  tr: { krep: "Krep", dolgu: "Dolgu", sos: "Sos", topping: "Süsleme" },
  en: { krep: "Crepe", dolgu: "Filling", sos: "Sauce", topping: "Topping" },
  ar: { krep: "كريب", dolgu: "حشوة", sos: "صلصة", topping: "إضافة" },
  fa: { krep: "کرپ", dolgu: "مغزی", sos: "سس", topping: "رویه" },
};

/** Liste durumlarının metinleri (Yukleniyor, BosDurum, HataDurumu; dört dilde) */
export const durumMetni: Record<
  Dil,
  {
    yukleniyor: string;
    hataBaslik: string;
    hataMesaji: string;
    tekrar: string;
    bosBaslik: string;
    bosAciklama: string;
    ara: string;
    aramaBosBaslik: string;
    aramaBosAciklama: (q: string) => string;
    temizle: string;
    oyna: string;
  }
> = {
  tr: {
    yukleniyor: "Yükleniyor…",
    hataBaslik: "Bir şeyler ters gitti",
    hataMesaji: "Liste yüklenemedi. Bağlantını kontrol edip yeniden dene.",
    tekrar: "Tekrar dene",
    bosBaslik: "Burada henüz bir şey yok",
    bosAciklama: "Liste boş. Oyna, yeni şeyler burada birikir.",
    ara: "Malzeme ara",
    aramaBosBaslik: "Sonuç bulunamadı",
    aramaBosAciklama: (q) => `"${q}" ile eşleşen malzeme yok.`,
    temizle: "Aramayı temizle",
    oyna: "🥞 Oyna",
  },
  en: {
    yukleniyor: "Loading…",
    hataBaslik: "Something went wrong",
    hataMesaji: "The list could not be loaded. Check your connection and try again.",
    tekrar: "Try again",
    bosBaslik: "Nothing here yet",
    bosAciklama: "The list is empty. Play, and new things will collect here.",
    ara: "Search ingredients",
    aramaBosBaslik: "No results",
    aramaBosAciklama: (q) => `No ingredient matches "${q}".`,
    temizle: "Clear search",
    oyna: "🥞 Play",
  },
  ar: {
    yukleniyor: "جارٍ التحميل…",
    hataBaslik: "حدث خطأ ما",
    hataMesaji: "تعذّر تحميل القائمة. تحقّق من الاتصال وحاول مجددًا.",
    tekrar: "حاول مجددًا",
    bosBaslik: "لا يوجد شيء هنا بعد",
    bosAciklama: "القائمة فارغة. العب، وستتجمّع الأشياء الجديدة هنا.",
    ara: "ابحث عن مكوّن",
    aramaBosBaslik: "لا توجد نتائج",
    aramaBosAciklama: (q) => `لا يوجد مكوّن يطابق «${q}».`,
    temizle: "مسح البحث",
    oyna: "🥞 العب",
  },
  fa: {
    yukleniyor: "در حال بارگذاری…",
    hataBaslik: "مشکلی پیش آمد",
    hataMesaji: "فهرست بارگذاری نشد. اتصال را بررسی کنید و دوباره تلاش کنید.",
    tekrar: "تلاش دوباره",
    bosBaslik: "هنوز چیزی اینجا نیست",
    bosAciklama: "فهرست خالی است. بازی کنید تا موارد تازه اینجا جمع شوند.",
    ara: "جستجوی مواد",
    aramaBosBaslik: "نتیجه‌ای پیدا نشد",
    aramaBosAciklama: (q) => `هیچ ماده‌ای با «${q}» مطابقت ندارد.`,
    temizle: "پاک کردن جستجو",
    oyna: "🥞 بازی کن",
  },
};
