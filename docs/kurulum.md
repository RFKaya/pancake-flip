# Kurulum ve Çalıştırma

### Ön Gereksinimler
- [Bun](https://bun.sh/) kurulu olmalıdır (`curl -fsSL https://bun.sh/install | bash`).
- [Rust & Cargo](https://rustup.rs/) kurulu olmalıdır.
- İşletim sisteminize göre [Tauri Önkoşulları](https://v2.tauri.app/start/prerequisites/) tamamlanmış olmalıdır.

### Adım Adım Çalıştırma

1. **Depoyu klonlayın:**
```bash
git clone https://github.com/RFKaya/pancake-flip.git
cd pancake-flip
```

2. **Bağımlılıkları yükleyin:**
```bash
bun install
```

3. **Web geliştirme sunucusunu başlatın:**
```bash
bun run dev
```
> Tarayıcınızda [http://127.0.0.1:1420](http://127.0.0.1:1420) adresinde açılır.

4. **Tauri masaüstü/mobil penceresinde çalıştırın:**
```bash
bun run tauri dev
```

5. **Üretim sürümünü statik olarak derleyin:**
```bash
bun run build
```
> Çıktılar `dist/` klasörüne üretilir ve Tauri tarafından paketlenir.

---
