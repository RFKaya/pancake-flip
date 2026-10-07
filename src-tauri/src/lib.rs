use std::time::{SystemTime, UNIX_EPOCH};

/// Adisyon kodu: KRP-BBB-YXXXXXX (bölüm, yıldız, zamandan 6 haneli hex). Biçim: docs/proje-fikri.md §3
fn fis_kodu(bolum_id: u32, yildiz: u8, zaman: u128) -> String {
    format!("KRP-{:03}-{}{:06X}", bolum_id, yildiz.min(3), zaman % 0xFF_FFFF)
}

// Ön yüz invoke("fis_olustur", { bolumId, yildiz }) ile çağırır
#[tauri::command]
fn fis_olustur(bolum_id: u32, yildiz: u8) -> String {
    let zaman = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    fis_kodu(bolum_id, yildiz, zaman)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fis_olustur])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod testler {
    use super::fis_kodu;

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
}
