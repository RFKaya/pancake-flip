use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};

/// En yüksek seviye (src/lib/veri/seviye.json → seviyeSiniri ile aynı)
const SEVIYE_SINIRI: u32 = 1_000_000_000;

/// fis_olustur başarı sonucu: yeni adisyon (alanlar src/lib/types/native.ts → Adisyon ile aynı)
#[derive(Debug, Serialize, PartialEq)]
pub struct Adisyon {
    pub kod: String,
    pub seviye: u32,
    pub yildiz: u8,
}

/// fis_coz başarı sonucu: koddan okunan bilgiler (src/lib/types/native.ts → FisBilgisi)
#[derive(Debug, Serialize, PartialEq)]
pub struct FisBilgisi {
    pub kod: String,
    pub seviye: u32,
    pub yildiz: u8,
    /// Kodun sonundaki 6 haneli zaman damgası (hex)
    pub damga: String,
}

/// Komut hataları: ön yüze { "tur": "...", ... } olarak gider (src/lib/types/native.ts → FisHatasi)
#[derive(Debug, Serialize, PartialEq)]
#[serde(tag = "tur")]
pub enum FisHatasi {
    /// Seviye 1..=SEVIYE_SINIRI dışında
    GecersizSeviye { seviye: u32 },
    /// Yıldız 0..=3 dışında
    GecersizYildiz { yildiz: u8 },
    /// Kod boş
    BosKod,
    /// Kod KRP-SSS-YXXXXXX biçiminde değil
    GecersizKod { kod: String },
}

/// Adisyon kodu: KRP-SSS-YXXXXXX (seviye, yıldız, zamandan 6 haneli hex). Biçim: docs/proje-fikri.md §3
fn fis_kodu(seviye: u32, yildiz: u8, zaman: u128) -> String {
    format!("KRP-{:03}-{}{:06X}", seviye, yildiz.min(3), zaman % 0xFF_FFFF)
}

/// Girdileri denetleyip adisyon üretir; geçersiz girdide panik yerine hata döner
fn adisyon_uret(seviye: u32, yildiz: u8, zaman: u128) -> Result<Adisyon, FisHatasi> {
    if seviye == 0 || seviye > SEVIYE_SINIRI {
        return Err(FisHatasi::GecersizSeviye { seviye });
    }
    if yildiz > 3 {
        return Err(FisHatasi::GecersizYildiz { yildiz });
    }
    Ok(Adisyon { kod: fis_kodu(seviye, yildiz, zaman), seviye, yildiz })
}

/// KRP-SSS-YXXXXXX kodunu parçalarına ayırır
fn kod_coz(kod: &str) -> Result<FisBilgisi, FisHatasi> {
    let kod = kod.trim();
    if kod.is_empty() {
        return Err(FisHatasi::BosKod);
    }
    let gecersiz = || FisHatasi::GecersizKod { kod: kod.to_string() };
    let govde = kod.strip_prefix("KRP-").ok_or_else(gecersiz)?;
    let (seviye_metni, kuyruk) = govde.split_once('-').ok_or_else(gecersiz)?;
    if seviye_metni.len() < 3 || !seviye_metni.chars().all(|c| c.is_ascii_digit()) {
        return Err(gecersiz());
    }
    let seviye: u32 = seviye_metni.parse().map_err(|_| gecersiz())?;
    let mut harfler = kuyruk.chars();
    let yildiz = harfler.next().and_then(|c| c.to_digit(10)).ok_or_else(gecersiz)?;
    let damga: String = harfler.collect();
    if yildiz > 3 || damga.len() != 6 || !damga.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(gecersiz());
    }
    if seviye == 0 || seviye > SEVIYE_SINIRI {
        return Err(FisHatasi::GecersizSeviye { seviye });
    }
    Ok(FisBilgisi { kod: kod.to_string(), seviye, yildiz: yildiz as u8, damga: damga.to_uppercase() })
}

fn simdi() -> u128 {
    // Sistem saati 1970'ten önceyse panik yerine 0 kullanılır (kod yine geçerli olur)
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0)
}

/// Seviye adisyonu üretir. Ön yüz yalnız src/lib/native.ts üzerinden çağırır: invoke("fis_olustur", { seviye, yildiz })
#[tauri::command]
fn fis_olustur(seviye: u32, yildiz: u8) -> Result<Adisyon, FisHatasi> {
    adisyon_uret(seviye, yildiz, simdi())
}

/// Adisyon kodunu çözer. Ön yüz: invoke("fis_coz", { kod })
#[tauri::command]
fn fis_coz(kod: String) -> Result<FisBilgisi, FisHatasi> {
    kod_coz(&kod)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fis_olustur, fis_coz])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod testler {
    use super::*;

    #[test]
    fn ornek_bicim() {
        // docs/proje-fikri.md §3 örneği: KRP-007-3A9F1C2
        assert_eq!(fis_kodu(7, 3, 0xA9F1C2), "KRP-007-3A9F1C2");
    }

    #[test]
    fn yildiz_en_fazla_3_ve_hex_6_hane() {
        assert_eq!(fis_kodu(12, 9, 0), "KRP-012-3000000");
        let kod = fis_kodu(150, 2, u128::MAX);
        assert_eq!(kod.len(), "KRP-150-2XXXXXX".len());
        assert!(kod[9..].chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn gecerli_girdi_adisyon_doner() {
        let a = adisyon_uret(10, 3, 0xA9F1C2).unwrap();
        assert_eq!(a, Adisyon { kod: "KRP-010-3A9F1C2".into(), seviye: 10, yildiz: 3 });
    }

    #[test]
    fn gecersiz_girdi_hata_doner_panik_yok() {
        assert_eq!(adisyon_uret(0, 3, 0), Err(FisHatasi::GecersizSeviye { seviye: 0 }));
        assert_eq!(adisyon_uret(5, 9, 0), Err(FisHatasi::GecersizYildiz { yildiz: 9 }));
    }

    #[test]
    fn kod_cozulur_ve_uretilenle_ayni() {
        let b = kod_coz("KRP-007-3A9F1C2").unwrap();
        assert_eq!(b, FisBilgisi { kod: "KRP-007-3A9F1C2".into(), seviye: 7, yildiz: 3, damga: "A9F1C2".into() });
        let a = adisyon_uret(1234, 1, 0xBEEF).unwrap();
        let c = kod_coz(&a.kod).unwrap();
        assert_eq!((c.seviye, c.yildiz), (1234, 1));
    }

    #[test]
    fn bos_ve_bozuk_kod_hata_doner() {
        assert_eq!(kod_coz("   "), Err(FisHatasi::BosKod));
        for k in ["WEB-010-3ABC", "KRP-7-3A9F1C2", "KRP-007-5A9F1C2", "KRP-007-3A9F1", "KRP-007-3A9F1CZ", "KRP-abc-3A9F1C2"] {
            assert!(matches!(kod_coz(k), Err(FisHatasi::GecersizKod { .. })), "{k}");
        }
        assert_eq!(kod_coz("KRP-000-1000000"), Err(FisHatasi::GecersizSeviye { seviye: 0 }));
    }

    #[test]
    fn hata_json_bicimi_on_yuzle_ayni() {
        let j = serde_json::to_string(&FisHatasi::GecersizYildiz { yildiz: 9 }).unwrap();
        assert_eq!(j, r#"{"tur":"GecersizYildiz","yildiz":9}"#);
        assert_eq!(serde_json::to_string(&FisHatasi::BosKod).unwrap(), r#"{"tur":"BosKod"}"#);
    }
}
