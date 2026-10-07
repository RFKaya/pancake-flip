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
