//! Bu uygulamanın tabloları ve kaynak tanımları.
//! Sütun adları `src/` altındaki TypeScript tipleriyle ve tasarım belgelerindeki alan adlarıyla birebir aynıdır.
use crate::backend::crud::{col, req, Entity, Kind};
use crate::backend::error::{AppError, AppResult};
pub use crate::backend::schema_common::*;

/// Kayıt olan (ilk kullanıcı dışındaki) herkese verilen rol; `None` ise rolsüz kalır.
pub const DEFAULT_ROLE: Option<&str> = Some("player");

pub static MALZEME: Entity = Entity {
    resource: "Malzeme",
    table: "malzemeler",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("ad", Kind::Text),
        req("kategori", Kind::Text),
        req("acilis", Kind::Int),
        req("maliyet", Kind::Int),
        req("deger", Kind::Int),
        col("ikon", Kind::Text),
        col("renkDegiskeni", Kind::Text),
        col("tatli", Kind::Bool),
    ],
    search: &["id", "ad"],
    filters: &["kategori", "acilis", "tatli"],
    order_by: "\"acilis\" ASC",
    readonly: false,
};

pub static MUSTERI_TIPI: Entity = Entity {
    resource: "MusteriTipi",
    table: "musteri_tipleri",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("ad", Kind::Text),
        col("ikon", Kind::Text),
        req("acilis", Kind::Int),
        req("agirlik", Kind::Real),
        req("sabir", Kind::Real),
        req("odeme", Kind::Real),
        req("bahsis", Kind::Real),
        req("ceza", Kind::Real),
        col("dKaydirma", Kind::Int),
        col("dMax", Kind::Int),
        col("tatliMi", Kind::Bool),
    ],
    search: &["id", "ad"],
    filters: &["acilis"],
    order_by: "\"acilis\" ASC",
    readonly: false,
};

pub static GAME_CONFIG: Entity = Entity {
    resource: "GameConfig",
    table: "game_configs",
    pk: "key",
    pk_kind: Kind::Text,
    cols: &[
        col("version", Kind::Int),
        req("data", Kind::Json),
        col("updatedAt", Kind::Date),
    ],
    search: &[],
    filters: &[],
    order_by: "\"key\" ASC",
    readonly: false,
};

pub static CONTENT_VERSION: Entity = Entity {
    resource: "ContentVersion",
    table: "content_versions",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("kapsam", Kind::Text),
        req("surum", Kind::Int),
        col("durum", Kind::Text),
        col("yayinlayan", Kind::Text),
        col("yayinTarihi", Kind::Date),
        col("not", Kind::Text),
        req("veri", Kind::Json),
    ],
    search: &[],
    filters: &["kapsam", "durum"],
    order_by: "\"surum\" DESC",
    readonly: false,
};

pub static PLAYER: Entity = Entity {
    resource: "Player",
    table: "players",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("ad", Kind::Text),
        col("eposta", Kind::Text),
        col("kayitTarihi", Kind::Date),
        col("sonOyun", Kind::Date),
        col("durum", Kind::Text),
        col("ilerleme", Kind::Json),
    ],
    search: &["ad", "id"],
    filters: &["durum", "sonOyun"],
    order_by: "\"kayitTarihi\" DESC",
    readonly: false,
};

pub static FIS: Entity = Entity {
    resource: "Fis",
    table: "fisler",
    pk: "kod",
    pk_kind: Kind::Text,
    cols: &[
        col("playerId", Kind::Text),
        req("bolum", Kind::Int),
        col("yildiz", Kind::Int),
        col("net", Kind::Real),
        col("kasa", Kind::Real),
        col("tarih", Kind::Date),
    ],
    search: &["kod"],
    filters: &["playerId", "bolum", "yildiz", "tarih"],
    order_by: "\"tarih\" DESC",
    readonly: false,
};

pub static FRAUD_FLAG: Entity = Entity {
    resource: "FraudFlag",
    table: "fraud_flags",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("playerId", Kind::Text),
        req("neden", Kind::Text),
        col("kanit", Kind::Text),
        col("durum", Kind::Text),
        col("tarih", Kind::Date),
    ],
    search: &[],
    filters: &["playerId", "neden", "durum"],
    order_by: "\"tarih\" DESC",
    readonly: false,
};

pub static PROJECT: &[&Entity] = &[&MALZEME, &MUSTERI_TIPI, &GAME_CONFIG, &CONTENT_VERSION, &PLAYER, &FIS, &FRAUD_FLAG];

/// Bütün kaynaklar: ortak + bu uygulamanınkiler.
pub fn all() -> Vec<&'static Entity> {
    let mut v: Vec<&'static Entity> = vec![&CONTACT_MESSAGE, &CONTENT_PAGE, &AUDIT_LOG];
    v.extend(PROJECT.iter().copied());
    v
}

pub fn entity(resource: &str) -> AppResult<&'static Entity> {
    all().into_iter().find(|e| e.resource == resource)
        .ok_or_else(|| AppError::NotFound(format!("`{resource}` adında bir kaynak yok.")))
}
