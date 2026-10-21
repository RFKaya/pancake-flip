//! Pancake Flip! iş işlevleri: sonsuz seviye eğrisi, gelir hesabı, adisyon (fiş) kesme, oyuncu ilerlemesi,
//! içerik sürümü yayını/geri alma, seviye simülatörü, panel özeti.
//! Formüller `src/lib/oyun/seviye.ts` ve `ekonomi.ts` ile aynıdır; sayılar `game_configs` tablosundaki
//! `seviye` ve `ayarlar` kayıtlarından gelir (başlangıç değerleri `src/lib/veri/*.json` ile aynıdır).
use crate::backend::audit;
use crate::backend::crud;
use crate::backend::error::{AppError, AppResult};
use crate::backend::policy::authorize;
use crate::backend::schema;
use crate::backend::state::AppState;
use crate::backend::util::{new_id, now_iso, NOW_SQL};
use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Map, Value};
use tauri::State;

// ───────────────────────── Seviye ve zorluk ─────────────────────────

fn f(v: &Value) -> f64 {
    v.as_f64().unwrap_or(0.0)
}

pub fn seviye_siniri(cfg: &Value) -> i64 {
    cfg["seviyeSiniri"].as_i64().unwrap_or(1_000_000_000)
}

/// NaN → 1, ondalık → aşağı, [1, seviyeSiniri] aralığına kırpılır.
pub fn seviye_sinirla(x: f64, cfg: &Value) -> i64 {
    if x.is_nan() {
        return 1;
    }
    if x.is_infinite() {
        return if x > 0.0 { seviye_siniri(cfg) } else { 1 };
    }
    (x.floor() as i64).clamp(1, seviye_siniri(cfg))
}

/// Bu seviyeyi geçmek için kaç başarılı müşteri gerekir (noktalar arası log-seviye ölçeğinde doğrusal; tavanlı).
pub fn gerekli_musteri(seviye: i64, cfg: &Value) -> i64 {
    let g = &cfg["gerekenMusteri"];
    let noktalar: Vec<(f64, f64)> = g["noktalar"].as_array().map(|a| a.iter().map(|p| (f(&p[0]), f(&p[1]))).collect()).unwrap_or_default();
    let (ileri, tavan) = (f(&g["ileriArtis"]), g["tavan"].as_i64().unwrap_or(40));
    if noktalar.len() < 2 {
        return 1;
    }
    let l = seviye_sinirla(seviye as f64, cfg) as f64;
    let (son_l, son_y) = noktalar[noktalar.len() - 1];
    let v = if l >= son_l {
        son_y + ileri * (l / son_l).log2()
    } else {
        let mut i = 0;
        while i < noktalar.len() - 2 && l >= noktalar[i + 1].0 {
            i += 1;
        }
        let ((l0, y0), (l1, y1)) = (noktalar[i], noktalar[i + 1]);
        y0 + (y1 - y0) * (l.log2() - l0.log2()) / (l1.log2() - l0.log2())
    };
    ((v + 1e-9).floor() as i64).clamp(1, tavan.max(1))
}

/// Normalize zorluk: seviye 1 → 0; sonsuza giderken 1'e yaklaşır, asla geçmez.
pub fn zorluk(seviye: i64, cfg: &Value) -> f64 {
    1.0 - (-((seviye_sinirla(seviye as f64, cfg) - 1) as f64) / f(&cfg["zorluk"]["olcek"]).max(1e-9)).exp()
}

pub fn egri_degeri(egri: &Value, seviye: i64, cfg: &Value) -> f64 {
    let (kolay, zor) = (f(&egri[0]), f(&egri[1]));
    kolay + (zor - kolay) * zorluk(seviye, cfg)
}

/// Kaliteden servis sonucu
pub fn sonuc_of(kalite: f64, ayar: &Value) -> &'static str {
    if kalite >= f(&ayar["kalite"]["perfect"]) {
        "perfect"
    } else if kalite >= f(&ayar["kalite"]["great"]) {
        "great"
    } else if kalite >= f(&ayar["kalite"]["good"]) {
        "good"
    } else {
        "olmadi"
    }
}

/// Müşterinin sabır oranına göre ruh hali (yüz, bahşiş oranı)
pub fn ruh_hali(sabir_orani: f64, ayar: &Value) -> (String, f64) {
    let liste = ayar["ruhHali"].as_array().cloned().unwrap_or_default();
    let secilen = liste.iter().find(|r| sabir_orani >= f(&r["esik"])).or_else(|| liste.last());
    secilen.map(|r| (r["yuz"].as_str().unwrap_or("").to_string(), f(&r["bahsis"]))).unwrap_or_default()
}

pub fn combo_carpani(combo: i64, seviye: i64, ayar: &Value) -> f64 {
    if seviye >= ayar["combo"]["baslangicSeviye"].as_i64().unwrap_or(15) {
        f(&ayar["combo"]["max"]).min(f(&ayar["combo"]["adim"]) * (combo - 1) as f64)
    } else {
        0.0
    }
}

/// Bir servisin geliri (maliyet servis sırasında malzeme konurken ayrıca düşülür).
pub fn gelir_hesapla(fiyat: f64, sonuc: &str, tip_odeme: f64, tip_bahsis: f64, sabir_orani: f64, combo: i64, seviye: i64, ayar: &Value) -> Value {
    let odeme = fiyat * f(&ayar["odemeCarpani"][sonuc]) * tip_odeme;
    let bahsis = fiyat * ruh_hali(sabir_orani, ayar).1 * tip_bahsis;
    let combo_kazanc = (odeme + bahsis) * combo_carpani(combo, seviye, ayar);
    let bonus = if sonuc == "perfect" { f(&ayar["perfectBonus"]) } else { 0.0 };
    json!({ "odeme": odeme, "bahsis": bahsis, "combo": combo_kazanc, "bonus": bonus, "toplam": odeme + bahsis + combo_kazanc + bonus })
}

/// Adisyon kazancı: önceki fişten bu yana kasaya giren coin (kasa azaldıysa yeni kasanın tamamı; negatif yazılmaz).
pub fn fis_neti(kasa: f64, onceki_kasa: Option<f64>) -> f64 {
    let k = kasa.max(0.0).round();
    match onceki_kasa {
        Some(o) if k >= o => k - o,
        _ => k,
    }
}

/// Ham kayıt ilerleme kırpması: seviye atlamaya en fazla "gereken − 1" kalır.
pub fn ilerleme_kirp(seviye: i64, ilerleme: f64, cfg: &Value) -> f64 {
    if seviye >= seviye_siniri(cfg) {
        0.0
    } else {
        ilerleme.min((gerekli_musteri(seviye, cfg) - 1).max(0) as f64)
    }
}

fn config(c: &Connection, key: &str) -> AppResult<Value> {
    let s: Option<String> = c.query_row("SELECT data FROM game_configs WHERE key = ?1", [key], |r| r.get(0)).optional()?;
    let s = s.ok_or_else(|| AppError::NotFound(format!("`{key}` ayarı tanımlı değil.")))?;
    Ok(serde_json::from_str(&s)?)
}

fn player_id(uid: i64) -> String {
    format!("u{uid}")
}

fn ensure_player(c: &Connection, uid: i64) -> AppResult<String> {
    let id = player_id(uid);
    let ad: String = c.query_row("SELECT name FROM users WHERE id = ?1", [uid], |r| r.get(0))?;
    c.execute("INSERT OR IGNORE INTO players (id, ad) VALUES (?1, ?2)", params![id, ad])?;
    Ok(id)
}

fn num(v: &Value, k: &str) -> f64 {
    v.get(k).and_then(Value::as_f64).filter(|x| x.is_finite() && *x >= 0.0).unwrap_or(0.0)
}

/// Oyuncu kendi ilerlemesini kaydeder (`surum: 1`); bozuk sayılar 0'a, ilerleme kırpılarak çözülür.
pub fn do_player_save_progress(app: &AppState, ham: &Value) -> AppResult<Value> {
    let uid = app.user().ok_or(AppError::Unauthenticated)?;
    if ham.get("surum").and_then(Value::as_i64) != Some(1) {
        return Err(AppError::validation("surum", "Kayıt sürümü desteklenmiyor (surum: 1 olmalı)."));
    }
    app.db.with(|c| {
        let cfg = config(c, "seviye")?;
        let pid = ensure_player(c, uid)?;
        let seviye = seviye_sinirla(num(ham, "seviye").max(1.0), &cfg);
        let en_yuksek = seviye.max(seviye_sinirla(num(ham, "enYuksekSeviye").max(1.0), &cfg));
        let temiz = json!({
            "surum": 1, "seviye": seviye, "ilerleme": ilerleme_kirp(seviye, num(ham, "ilerleme"), &cfg),
            "toplamMusteri": num(ham, "toplamMusteri"), "toplamCoin": num(ham, "toplamCoin"), "enYuksekSeviye": en_yuksek,
            "enIyiSeri": num(ham, "enIyiSeri").floor(), "toplamMukemmel": num(ham, "toplamMukemmel").floor(),
        });
        crud::update(c, &schema::PLAYER, &json!(pid), &json!({ "ilerleme": temiz, "sonOyun": now_iso(c)? }))?;
        Ok(temiz)
    })
}

/// Servis sonu adisyonu: kodu Rust üretir (`KRP-BBB-YXXXXXX`), kazanç önceki fişin kasasından hesaplanır.
/// `girdi`: `{ bolum, yildiz, kasa }`
pub fn do_fis_kes(app: &AppState, girdi: &Value) -> AppResult<Value> {
    let uid = app.user().ok_or(AppError::Unauthenticated)?;
    let bolum = girdi.get("bolum").and_then(Value::as_i64).filter(|b| *b >= 1).ok_or_else(|| AppError::validation("bolum", "Seviye 1 ya da daha büyük olmalı."))?;
    let yildiz = girdi.get("yildiz").and_then(Value::as_i64).filter(|y| (0..=3).contains(y)).ok_or_else(|| AppError::validation("yildiz", "Yıldız 0–3 olmalı."))?;
    let kasa = girdi.get("kasa").and_then(Value::as_f64).filter(|k| k.is_finite() && *k >= 0.0).ok_or_else(|| AppError::validation("kasa", "Kasa 0 ya da daha büyük olmalı."))?;
    app.db.with(|c| {
        let cfg = config(c, "seviye")?;
        if bolum > seviye_siniri(&cfg) {
            return Err(AppError::validation("bolum", "Seviye sınırın üstünde."));
        }
        let pid = ensure_player(c, uid)?;
        let onceki: Option<f64> = c
            .query_row("SELECT kasa FROM fisler WHERE playerId = ?1 AND kasa IS NOT NULL ORDER BY tarih DESC, rowid DESC LIMIT 1", [&pid], |r| r.get(0))
            .optional()?;
        let net = fis_neti(kasa, onceki);
        let adisyon = crate::adisyon_uret(bolum as u32, yildiz as u8, crate::simdi()).map_err(|e| AppError::validation("bolum", &format!("{e:?}")))?;
        // Şüpheli sıçrama: kayıtlı en yüksek seviyenin 1'den fazla üstü
        let en_yuksek: i64 = c.query_row("SELECT COALESCE(json_extract(ilerleme, '$.enYuksekSeviye'), 1) FROM players WHERE id = ?1", [&pid], |r| r.get(0))?;
        if bolum > en_yuksek + 1 {
            c.execute(
                "INSERT INTO fraud_flags (id, playerId, neden, kanit, durum) VALUES (?1, ?2, 'imkansiz-seviye-atlama', ?3, 'acik')",
                params![new_id(), pid, format!("Kayıtlı en yüksek seviye {en_yuksek}, fiş seviyesi {bolum}.")],
            )?;
        }
        let kayit = json!({ "kod": adisyon.kod, "playerId": pid, "bolum": bolum, "yildiz": yildiz, "net": net, "kasa": kasa, "tarih": now_iso(c)? });
        let fis = crud::insert(c, &schema::FIS, &kayit)?;
        c.execute(
            "UPDATE players SET sonOyun = ?2, ilerleme = json_set(ilerleme, '$.toplamCoin', ?3, '$.enYuksekSeviye', MAX(COALESCE(json_extract(ilerleme, '$.enYuksekSeviye'), 1), ?4)) WHERE id = ?1",
            params![pid, now_iso(c)?, kasa, bolum],
        )?;
        Ok(fis)
    })
}

/// Oyuncu seviyesini elle ayarlar (`SetLevel:Player`; neden zorunlu, denetim kaydına yazılır).
pub fn do_player_set_level(app: &AppState, player_id: &str, seviye: i64, neden: &str) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "SetLevel:Player")?;
        if neden.trim().chars().count() < 5 {
            return Err(AppError::validation("neden", "Neden en az 5 karakter olmalı."));
        }
        let cfg = config(c, "seviye")?;
        let once = crud::find(c, &schema::PLAYER, &json!(player_id))?;
        let s = seviye_sinirla(seviye as f64, &cfg);
        let mut il = once["ilerleme"].as_object().cloned().unwrap_or_default();
        il.insert("seviye".into(), json!(s));
        il.insert("ilerleme".into(), json!(0));
        let en = il.get("enYuksekSeviye").and_then(Value::as_i64).unwrap_or(1).max(s);
        il.insert("enYuksekSeviye".into(), json!(en));
        let sonra = crud::update(c, &schema::PLAYER, &json!(player_id), &json!({ "ilerleme": Value::Object(il) }))?;
        audit::record(c, Some(uid), "Player.setLevel", "Player", player_id, Some(neden.trim()), Some(&once["ilerleme"]), Some(&sonra["ilerleme"]))?;
        Ok(sonra)
    })
}

// ───────────────────────── İçerik sürümleri ─────────────────────────

/// Yayın öncesi doğrulama: seviye eğrisi monoton artmalı; kalite eşikleri sıralı olmalı.
pub fn dogrula_icerik(kapsam: &str, veri: &Value) -> AppResult<()> {
    match kapsam {
        "seviye" => {
            let n = veri["gerekenMusteri"]["noktalar"].as_array().ok_or_else(|| AppError::validation("veri", "Kontrol noktaları eksik."))?;
            let mut onceki = (0.0, 0.0);
            for p in n {
                let (l, y) = (f(&p[0]), f(&p[1]));
                if l <= onceki.0 || y < onceki.1 {
                    return Err(AppError::validation("veri", "Kontrol noktaları seviye ve müşteri sayısı bakımından artan olmalı."));
                }
                onceki = (l, y);
            }
            if veri["gerekenMusteri"]["tavan"].as_f64().unwrap_or(0.0) < onceki.1 {
                return Err(AppError::validation("veri", "Tavan son kontrol noktasından küçük olamaz."));
            }
            if veri["seviyeSiniri"].as_i64().unwrap_or(0) < 1 {
                return Err(AppError::validation("veri", "seviyeSiniri en az 1 olmalı."));
            }
        }
        "ayarlar" => {
            let k = &veri["kalite"];
            if !(f(&k["perfect"]) >= f(&k["great"]) && f(&k["great"]) >= f(&k["good"])) {
                return Err(AppError::validation("veri", "Kalite eşikleri perfect ≥ great ≥ good olmalı."));
            }
        }
        "malzemeler" | "musteriler" => {
            if !veri.is_array() {
                return Err(AppError::validation("veri", "Liste bekleniyor."));
            }
        }
        _ => return Err(AppError::validation("kapsam", "Kapsam geçersiz.")),
    }
    Ok(())
}

fn uygula_surum(c: &Connection, kapsam: &str, surum: i64, veri: &Value) -> AppResult<()> {
    match kapsam {
        "seviye" | "ayarlar" => {
            c.execute(
                &format!("INSERT INTO game_configs (key, version, data, updatedAt) VALUES (?1, ?2, ?3, {NOW_SQL}) ON CONFLICT(key) DO UPDATE SET version = ?2, data = ?3, updatedAt = {NOW_SQL}"),
                params![kapsam, surum, veri.to_string()],
            )?;
        }
        "malzemeler" | "musteriler" => {
            let e = if kapsam == "malzemeler" { &schema::MALZEME } else { &schema::MUSTERI_TIPI };
            for item in veri.as_array().cloned().unwrap_or_default() {
                let id = item.get("id").cloned().unwrap_or(Value::Null);
                if crud::find(c, e, &id).is_ok() {
                    crud::update(c, e, &id, &item)?;
                } else {
                    crud::insert(c, e, &item)?;
                }
            }
        }
        _ => {}
    }
    Ok(())
}

/// Sürümü yayınlar (`Publish:ContentVersion`): doğrulanır, canlı ayara yazılır, aynı kapsamın önceki yayını "geri-alindi" olur.
pub fn do_content_publish(app: &AppState, id: &str, not: Option<&str>) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Publish:ContentVersion")?;
        let v = crud::find(c, &schema::CONTENT_VERSION, &json!(id))?;
        let kapsam = v["kapsam"].as_str().unwrap_or("").to_string();
        dogrula_icerik(&kapsam, &v["veri"])?;
        uygula_surum(c, &kapsam, v["surum"].as_i64().unwrap_or(1), &v["veri"])?;
        c.execute("UPDATE content_versions SET durum = 'geri-alindi' WHERE kapsam = ?1 AND durum = 'yayinda' AND id <> ?2", params![kapsam, id])?;
        let sonra = crud::update(c, &schema::CONTENT_VERSION, &json!(id), &json!({ "durum": "yayinda", "yayinlayan": uid.to_string(), "yayinTarihi": now_iso(c)?, "not": not }))?;
        audit::record(c, Some(uid), "ContentVersion.publish", "ContentVersion", id, not, Some(&v), Some(&sonra))?;
        Ok(sonra)
    })
}

/// Yayını geri alır: bir önceki sürümü yeniden canlıya alır, şimdikini "geri-alindi" yapar.
pub fn do_content_rollback(app: &AppState, kapsam: &str, neden: &str) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Publish:ContentVersion")?;
        if neden.trim().is_empty() {
            return Err(AppError::validation("neden", "Geri alma nedeni zorunlu."));
        }
        let (cur_id, cur_surum): (String, i64) = c
            .query_row("SELECT id, surum FROM content_versions WHERE kapsam = ?1 AND durum = 'yayinda'", [kapsam], |r| Ok((r.get(0)?, r.get(1)?)))
            .optional()?
            .ok_or_else(|| AppError::NotFound("Bu kapsamda yayında sürüm yok.".into()))?;
        let prev_id: String = c
            .query_row("SELECT id FROM content_versions WHERE kapsam = ?1 AND surum < ?2 ORDER BY surum DESC LIMIT 1", params![kapsam, cur_surum], |r| r.get(0))
            .optional()?
            .ok_or_else(|| AppError::Conflict("Geri dönülecek önceki sürüm yok.".into()))?;
        let prev = crud::find(c, &schema::CONTENT_VERSION, &json!(prev_id))?;
        uygula_surum(c, kapsam, prev["surum"].as_i64().unwrap_or(1), &prev["veri"])?;
        c.execute("UPDATE content_versions SET durum = 'geri-alindi' WHERE id = ?1", [&cur_id])?;
        let sonra = crud::update(c, &schema::CONTENT_VERSION, &json!(prev_id), &json!({ "durum": "yayinda", "yayinlayan": uid.to_string(), "yayinTarihi": now_iso(c)? }))?;
        audit::record(c, Some(uid), "ContentVersion.rollback", "ContentVersion", &cur_id, Some(neden.trim()), None, Some(&json!({ "to": prev_id })))?;
        Ok(sonra)
    })
}

// ───────────────────────── Simülatör ve panel ─────────────────────────

/// Bir seviyenin hesaplanan oyun parametreleri (yönetim paneli simülatörü).
pub fn do_simulate_level(app: &AppState, seviye: i64) -> AppResult<Value> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:GameConfig")?;
        let cfg = config(c, "seviye")?;
        let l = seviye_sinirla(seviye as f64, &cfg);
        let mut egriler = Map::new();
        if let Some(e) = cfg["egriler"].as_object() {
            for (k, v) in e {
                egriler.insert(k.clone(), json!(egri_degeri(v, l, &cfg)));
            }
        }
        let kademe = cfg["kademeler"].as_array().and_then(|k| k.iter().filter(|x| x["seviye"].as_i64().unwrap_or(0) <= l).last().cloned()).unwrap_or(Value::Null);
        let mekanikler: Vec<Value> = cfg["mekanikler"].as_array().map(|m| m.iter().filter(|x| x["seviye"].as_i64().unwrap_or(0) <= l).cloned().collect()).unwrap_or_default();
        let menu: Vec<String> = {
            let mut st = c.prepare("SELECT id FROM malzemeler WHERE kategori <> 'krep' AND acilis <= ?1 ORDER BY acilis")?;
            let rows = st.query_map([l], |r| r.get::<_, String>(0))?;
            rows.collect::<Result<Vec<_>, _>>()?
        };
        let tipler: Vec<String> = {
            let mut st = c.prepare("SELECT id FROM musteri_tipleri WHERE acilis <= ?1 ORDER BY acilis")?;
            let rows = st.query_map([l], |r| r.get::<_, String>(0))?;
            rows.collect::<Result<Vec<_>, _>>()?
        };
        Ok(json!({
            "seviye": l, "zorluk": zorluk(l, &cfg), "gerekenMusteri": gerekli_musteri(l, &cfg), "egriler": egriler,
            "kademe": kademe, "mekanikler": mekanikler, "menu": menu, "musteriTipleri": tipler,
            "ipucu": l <= cfg["ipucuSeviyesi"].as_i64().unwrap_or(5),
        }))
    })
}

/// Panel özeti: oyuncu sayısı, seviye istatistikleri, PERFECT oranı, seviye aralığı dağılımı.
pub fn do_pancake_dashboard(app: &AppState) -> AppResult<Value> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:Player")?;
        let (n, ort, en, servis, mukemmel): (i64, Option<f64>, Option<i64>, f64, f64) = c.query_row(
            "SELECT COUNT(*), AVG(json_extract(ilerleme, '$.seviye')), MAX(json_extract(ilerleme, '$.enYuksekSeviye')),
                    COALESCE(SUM(json_extract(ilerleme, '$.toplamMusteri')), 0), COALESCE(SUM(json_extract(ilerleme, '$.toplamMukemmel')), 0) FROM players",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
        )?;
        let mut seviyeler: Vec<i64> = {
            let mut st = c.prepare("SELECT COALESCE(json_extract(ilerleme, '$.seviye'), 1) FROM players ORDER BY 1")?;
            let rows = st.query_map([], |r| r.get::<_, i64>(0))?;
            rows.collect::<Result<Vec<_>, _>>()?
        };
        seviyeler.sort();
        let medyan = if seviyeler.is_empty() { Value::Null } else { json!(seviyeler[seviyeler.len() / 2]) };
        let kova = |lo: i64, hi: i64| seviyeler.iter().filter(|s| **s >= lo && **s <= hi).count();
        Ok(json!({
            "oyuncu": n, "ortalamaSeviye": ort, "medyanSeviye": medyan, "enYuksekSeviye": en, "toplamServis": servis,
            "perfectOrani": if servis > 0.0 { mukemmel / servis } else { 0.0 },
            "dagilim": [
                { "aralik": "1–9", "sayi": kova(1, 9) }, { "aralik": "10–49", "sayi": kova(10, 49) }, { "aralik": "50–99", "sayi": kova(50, 99) },
                { "aralik": "100–499", "sayi": kova(100, 499) }, { "aralik": "500+", "sayi": kova(500, i64::MAX) },
            ],
        }))
    })
}

// ───────────────────────── Tauri komutları ─────────────────────────

#[tauri::command]
pub fn player_save_progress(state: State<'_, AppState>, ham: Value) -> AppResult<Value> {
    do_player_save_progress(&state, &ham)
}
#[tauri::command]
pub fn fis_kes(state: State<'_, AppState>, girdi: Value) -> AppResult<Value> {
    do_fis_kes(&state, &girdi)
}
#[tauri::command]
pub fn player_set_level(state: State<'_, AppState>, player_id: String, seviye: i64, neden: String) -> AppResult<Value> {
    do_player_set_level(&state, &player_id, seviye, &neden)
}
#[tauri::command]
pub fn content_publish(state: State<'_, AppState>, id: String, not: Option<String>) -> AppResult<Value> {
    do_content_publish(&state, &id, not.as_deref())
}
#[tauri::command]
pub fn content_rollback(state: State<'_, AppState>, kapsam: String, neden: String) -> AppResult<Value> {
    do_content_rollback(&state, &kapsam, &neden)
}
#[tauri::command]
pub fn simulate_level(state: State<'_, AppState>, seviye: i64) -> AppResult<Value> {
    do_simulate_level(&state, seviye)
}
#[tauri::command]
pub fn pancake_dashboard(state: State<'_, AppState>) -> AppResult<Value> {
    do_pancake_dashboard(&state)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::backend::boot_memory;
    use crate::backend::controllers as c;

    fn cfgs(app: &AppState) -> (Value, Value) {
        app.db.with(|cn| Ok((config(cn, "seviye")?, config(cn, "ayarlar")?))).unwrap()
    }

    #[test]
    fn seviye_vektorleri() {
        let app = boot_memory().unwrap();
        let (cfg, _) = cfgs(&app);
        assert_eq!(gerekli_musteri(1, &cfg), 1);
        assert_eq!(gerekli_musteri(10, &cfg), 4);
        assert_eq!(gerekli_musteri(50, &cfg), 8);
        assert_eq!(gerekli_musteri(1000, &cfg), 25);
        assert_eq!(gerekli_musteri(i64::MAX, &cfg), 40); // tavan
        assert_eq!(zorluk(1, &cfg), 0.0);
        assert!(zorluk(500, &cfg) < 1.0 && zorluk(1_000_000, &cfg) <= 1.0); // asimptot: büyük seviyede 1,0'a yuvarlanır, geçmez
        assert_eq!(seviye_sinirla(f64::NAN, &cfg), 1);
        assert_eq!(seviye_sinirla(f64::INFINITY, &cfg), 1_000_000_000);
        // kolay uçta çevirme penceresi 0,4; zorluk arttıkça 0,08'e yaklaşır
        assert!((egri_degeri(&cfg["egriler"]["cevirPencere"], 1, &cfg) - 0.4).abs() < 1e-9);
    }

    #[test]
    fn gelir_ve_fis_neti() {
        let app = boot_memory().unwrap();
        let (_, ayar) = cfgs(&app);
        // fiyat 6, perfect, normal müşteri, sabır %85 (😋 → bahşiş 0,3), combo 1, seviye 20
        let g = gelir_hesapla(6.0, "perfect", 1.0, 1.0, 0.85, 1, 20, &ayar);
        assert!((g["toplam"].as_f64().unwrap() - 12.8).abs() < 1e-9);
        // seviye 15 öncesi combo yok; sonrası (combo 3 → +%20)
        assert_eq!(combo_carpani(3, 14, &ayar), 0.0);
        assert!((combo_carpani(3, 15, &ayar) - 0.2).abs() < 1e-9);
        assert_eq!(sonuc_of(100.0, &ayar), "perfect");
        assert_eq!(sonuc_of(79.0, &ayar), "good");
        assert_eq!(sonuc_of(10.0, &ayar), "olmadi");
        assert_eq!(fis_neti(120.0, Some(100.0)), 20.0);
        assert_eq!(fis_neti(50.0, Some(100.0)), 50.0); // kasa azaldı: yeni kasa
        assert_eq!(fis_neti(75.0, None), 75.0);
    }

    #[test]
    fn fis_ve_surum_akisi() {
        let app = boot_memory().unwrap();
        c::auth_register(&app, "Yönetici", "y@ornek.com", "gizli-parola-1").unwrap();
        let f1 = do_fis_kes(&app, &json!({ "bolum": 1, "yildiz": 3, "kasa": 100 })).unwrap();
        assert!(f1["kod"].as_str().unwrap().starts_with("KRP-001-3"));
        assert_eq!(f1["net"], json!(100.0));
        let f2 = do_fis_kes(&app, &json!({ "bolum": 2, "yildiz": 2, "kasa": 130 })).unwrap();
        assert_eq!(f2["net"], json!(30.0));
        assert!(do_fis_kes(&app, &json!({ "bolum": 0, "yildiz": 2, "kasa": 1 })).is_err());
        // bölüm sıçraması şüpheli kayıt üretir
        do_fis_kes(&app, &json!({ "bolum": 50, "yildiz": 1, "kasa": 140 })).unwrap();
        let sup = c::crud_index(&app, "FraudFlag", Default::default()).unwrap();
        assert_eq!(sup.total, 1);
        // ilerleme kaydı
        let il = do_player_save_progress(&app, &json!({ "surum": 1, "seviye": 3, "ilerleme": 99, "toplamMusteri": 10, "toplamCoin": 5, "enYuksekSeviye": 2 })).unwrap();
        assert_eq!(il["ilerleme"], json!(1.0)); // seviye 3 için gereken 2 → en fazla 1
        assert_eq!(il["enYuksekSeviye"], json!(3));
        assert!(do_player_save_progress(&app, &json!({ "surum": 2 })).is_err());
        // seviye elle ayarlama neden ister
        assert!(do_player_set_level(&app, "u1", 10, "x").is_err());
        assert_eq!(do_player_set_level(&app, "u1", 10, "destek talebi").unwrap()["ilerleme"]["seviye"], json!(10));
        // simülatör ve panel
        let sim = do_simulate_level(&app, 20).unwrap();
        assert_eq!(sim["gerekenMusteri"], json!(5));
        assert!(sim["menu"].as_array().unwrap().len() >= 4);
        let d = do_pancake_dashboard(&app).unwrap();
        assert_eq!(d["oyuncu"], json!(1));
        // içerik sürümü: bozuk eğri yayınlanamaz
        let bozuk = c::crud_store(&app, "ContentVersion", &json!({ "kapsam": "seviye", "surum": 2, "veri": { "seviyeSiniri": 10, "gerekenMusteri": { "noktalar": [[5, 3], [3, 2]], "ileriArtis": 2, "tavan": 40 } } })).unwrap();
        assert!(do_content_publish(&app, bozuk["id"].as_str().unwrap(), None).is_err());
    }
}
