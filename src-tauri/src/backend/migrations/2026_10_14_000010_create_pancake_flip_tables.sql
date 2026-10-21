-- pancake-flip tabloları. Sütun adları ön yüz tipleriyle birebir (camelCase); tablo adları snake_case.

CREATE TABLE "malzemeler" (
    "id" TEXT PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "kategori" TEXT NOT NULL CHECK ("kategori" IN ('krep', 'dolgu', 'sos', 'topping')),
    "acilis" INTEGER NOT NULL,
    "maliyet" INTEGER NOT NULL,
    "deger" INTEGER NOT NULL,
    "ikon" TEXT NOT NULL DEFAULT '',
    "renkDegiskeni" TEXT NOT NULL DEFAULT '--yazi',
    "tatli" INTEGER NOT NULL DEFAULT 0 CHECK ("tatli" IN (0, 1))
);

CREATE TABLE "musteri_tipleri" (
    "id" TEXT PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "ikon" TEXT NOT NULL DEFAULT '',
    "acilis" INTEGER NOT NULL,
    "agirlik" REAL NOT NULL,
    "sabir" REAL NOT NULL,
    "odeme" REAL NOT NULL,
    "bahsis" REAL NOT NULL,
    "ceza" REAL NOT NULL,
    "dKaydirma" INTEGER NOT NULL DEFAULT 0,
    "dMax" INTEGER,
    "tatliMi" INTEGER NOT NULL DEFAULT 0 CHECK ("tatliMi" IN (0, 1))
);

CREATE TABLE "game_configs" (
    "key" TEXT PRIMARY KEY,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CHECK ("key" IN ('seviye', 'ayarlar'))
);

CREATE TABLE "content_versions" (
    "id" TEXT PRIMARY KEY,
    "kapsam" TEXT NOT NULL CHECK ("kapsam" IN ('malzemeler', 'musteriler', 'seviye', 'ayarlar')),
    "surum" INTEGER NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'taslak' CHECK ("durum" IN ('taslak', 'yayinda', 'geri-alindi')),
    "yayinlayan" TEXT,
    "yayinTarihi" TEXT,
    "not" TEXT,
    "veri" TEXT NOT NULL,
    UNIQUE ("kapsam", "surum")
);

CREATE TABLE "players" (
    "id" TEXT PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "eposta" TEXT,
    "kayitTarihi" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    "sonOyun" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'aktif' CHECK ("durum" IN ('aktif', 'engelli', 'supheli')),
    "ilerleme" TEXT NOT NULL DEFAULT '{"surum":1,"seviye":1,"ilerleme":0,"toplamMusteri":0,"toplamCoin":0,"enYuksekSeviye":1,"enIyiSeri":0,"toplamMukemmel":0}'
);

CREATE TABLE "fisler" (
    "kod" TEXT PRIMARY KEY,
    "playerId" TEXT REFERENCES "players" ("id") ON DELETE CASCADE,
    "bolum" INTEGER NOT NULL,
    "yildiz" INTEGER NOT NULL DEFAULT 0 CHECK ("yildiz" IN (0, 1, 2, 3)),
    "net" REAL NOT NULL DEFAULT 0.0,
    "kasa" REAL,
    "tarih" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX fisler_playerId_index ON "fisler" ("playerId");

CREATE TABLE "fraud_flags" (
    "id" TEXT PRIMARY KEY,
    "playerId" TEXT NOT NULL REFERENCES "players" ("id") ON DELETE CASCADE,
    "neden" TEXT NOT NULL CHECK ("neden" IN ('imkansiz-seviye-atlama', 'fis-tutarsizligi', 'kasa-azalmasi-suresiz', 'surum-uyumsuz')),
    "kanit" TEXT NOT NULL DEFAULT '',
    "durum" TEXT NOT NULL DEFAULT 'acik' CHECK ("durum" IN ('acik', 'temiz', 'yaptirim')),
    "tarih" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
