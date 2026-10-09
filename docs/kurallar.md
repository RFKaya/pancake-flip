# Kurallar

## Git akışı

Dal, commit ve PR kuralları [`AGENTS.md`](../AGENTS.md) §3'tedir: her iş `feature/…` ya da `fix/…` dalında yapılır, PR ile `master`'a girer; force-push ve geçmiş yeniden yazma yoktur.

## PR güvenliği

- `master` dalı korumalıdır: her değişiklik PR ile girer; force push ve dal silme kapalıdır. Kural seti ("master koruması") depo sahibi tarafından GitHub'da **Settings → Rules → Rulesets** altında etkinleştirilir ([Görev 09.1](tasks/week-4/09-1-master-korumasi.task.md)).
- PR'ı yalnız collaborator'lar merge eder: `RFKaya`, `RedRiveRR` ve eğitmen `keyvanarasteh`.
- Tanımadığımız birinden gelen PR merge edilmeden önce:
  - **Files changed** sekmesinde her dosya okunur.
  - `.github/workflows/`, `package.json` betikleri, `src-tauri/` ve bağımlılık dosyalarındaki (`package.json`, `bun.lock`, `Cargo.toml`, `Cargo.lock`) değişikliklere özellikle bakılır.
  - PR yerelde derlenip denenir (`bun install`, `bun run build`, `bun test`).
- Okunmayan PR merge edilmez.
