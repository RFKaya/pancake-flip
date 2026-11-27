// Bun + kurulu Chrome/Chromium; ek npm bağımlılığı veya kullanıcının tarayıcı profili kullanılmaz.
// Kullanım ve teslim kapsamı: docs/teslim.md → Vize teslimi.
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const output = join(root, 'screenshots');
const sizes = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = [
  process.env.CHROME_PATH,
  process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
  process.env['PROGRAMFILES(X86)'] && join(process.env['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'),
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => p && existsSync(p));
if (!chrome) throw new Error('Chrome bulunamadı. CHROME_PATH ortam değişkenine Chromium tarayıcısının yolunu yazın.');

// Her çalıştırma güncel kaynakları derler; eski dist görüntüleri teslim edilmez.
const build = Bun.spawnSync([process.execPath, 'run', 'build'], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (build.exitCode !== 0) throw new Error('Derleme başarısız, ekran görüntüleri alınmadı.');

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const lists = await Promise.all(entries.map((e) => e.isDirectory()
    ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
  return lists.flat().sort();
}

const routes = (await htmlFiles(dist)).map((file) => {
  let url = file.slice(dist.length).replaceAll('\\', '/');
  if (url.endsWith('index.html')) url = url.slice(0, -10);
  return { name: url === '/' ? 'home' : url.replace(/^\/|\/$/g, '').replaceAll('/', '-').replace(/\.html$/, ''), url };
});
const scenarios = [...routes,
  { name: 'oyun', url: '/', click: '.oyna', ready: 'document.body.hasAttribute("data-oyunda") && !!document.querySelector(".fis")', delay: 1100 },
  ...['Malzemeler', 'Müşteri Tipleri', 'Seviye Eğrisi', 'Kilometre Taşları', 'Simülatör', 'Denge Ayarları']
    .map((label, i) => ({ name: `admin-${['malzemeler', 'musteriler', 'egri', 'kilometre', 'simulator', 'denge'][i]}`, url: '/admin/', menu: label })),
  ...['ornek', 'hata', 'yukleniyor'].map((state) => ({ name: `fislerim-${state}`, url: `/fislerim/?durum=${state}` })),
  ...['', 'en/', 'ar/', 'fa/'].flatMap((lang) => ['bos', 'hata', 'yukleniyor'].map((state) => ({
    name: `${lang.replace('/', '-') }rehber-${state}`, url: `/${lang}rehber/?durum=${state}`,
  }))),
];
if (new Set(scenarios.map((s) => s.name)).size !== scenarios.length) throw new Error('Çakışan görüntü adları var.');

await mkdir(output, { recursive: true });
// Yalnız bu otomasyonun önceki çıktısını temizle; başka klasörlere dokunma.
for (const name of await readdir(output)) {
  if (/^[a-z0-9-]+-(phone|tablet|desktop)\.png$/.test(name) || name === 'rapor.json') {
    await rm(join(output, name));
  }
}
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
  const path = decodeURIComponent(new URL(req.url).pathname);
  const target = resolve(dist, `.${path.endsWith('/') ? path + 'index.html' : path}`);
  if (!target.startsWith(dist + sep)) return new Response('Forbidden', { status: 403 });
  const file = Bun.file(target);
  return await file.exists() ? new Response(file) : new Response('Not found', { status: 404 });
} });
const profile = await mkdtemp(join(tmpdir(), 'pancakeflip-capture-'));
let browser;
let socket;
let sequence = 0;
const pending = new Map();
let pageErrors = [];
let resourceErrors = [];
const report = { createdAt: new Date().toISOString(), sizes, routes: routes.length, screenshots: [], excluded: [
  'Tauri yerel arka ucuna bağlı giriş, Sürümler, Oyuncular, Fişler, Şüpheli Kayıtlar ve Denetim Günlüğü web sürümünde görünmez; bu script gerçek Tauri ekranlarını yakalamaz.',
  'Fişlerim-ornek, uygulamanın mevcut ?durum=ornek test verisidir; gerçek oyuncu kaydı değildir.',
], complete: false };
report.sourceCommit = Bun.spawnSync(['git', 'rev-parse', 'HEAD'], { cwd: root }).stdout.toString().trim();
report.workingTreeDirty = Bun.spawnSync(['git', 'status', '--porcelain'], { cwd: root }).stdout.toString().trim().length > 0;

function cdp(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP zaman aşımı: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const res = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
  return res.result.value;
}
async function waitFor(expression, label) {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (await evaluate(expression)) return;
    await sleep(80);
  }
  throw new Error(`Sayfa hazır olmadı: ${label}`);
}

try {
  browser = Bun.spawn([chrome, '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio', 'about:blank'],
  { stdout: 'ignore', stderr: 'ignore' });
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !existsSync(portFile); i++) {
    if (browser.exitCode !== null) throw new Error('Chrome başlatılamadı.');
    await sleep(100);
  }
  if (!existsSync(portFile)) throw new Error('Chrome hata ayıklama portu açılmadı.');
  const port = readFileSync(portFile, 'utf8').split('\n')[0].trim();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((t) => t.type === 'page');
  if (!target) throw new Error('Chrome sayfası bulunamadı.');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id); clearTimeout(p.timer);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.text);
    else if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
      resourceErrors.push(`${msg.params.response.status} ${msg.params.response.url}`);
    }
  };
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'localStorage.clear(); localStorage.setItem("tema", "gunduz");' });
  for (const scenario of scenarios) for (const [size, [width, height]] of Object.entries(sizes)) {
    pageErrors = []; resourceErrors = [];
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    const url = `${server.url.origin}${scenario.url}`;
    const nav = await cdp('Page.navigate', { url });
    if (nav.errorText) throw new Error(nav.errorText);
    await waitFor(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && !!document.body && !document.querySelector('astro-island[ssr]')`, scenario.name);
    await evaluate('document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))))');
    if (scenario.menu) {
      await waitFor('!!document.querySelector(".menu button")', scenario.name);
      await evaluate(`(() => { const button = [...document.querySelectorAll('.menu button')].find(b => b.textContent.trim().endsWith(${JSON.stringify(scenario.menu)})); if (!button) throw Error('Sekme bulunamadı'); button.scrollIntoView({block:'nearest',inline:'center'}); button.click(); })()`);
      await waitFor(`document.querySelector('.menu button[aria-current="page"]')?.textContent.trim().endsWith(${JSON.stringify(scenario.menu)})`, scenario.name);
    }
    if (scenario.click) {
      await evaluate(`document.querySelector(${JSON.stringify(scenario.click)}).click()`);
      await waitFor(scenario.ready, scenario.name);
    }
    // Geçişlerin tamamlanması; oyun animasyonları ve ürün CSS'i değiştirilmez.
    await sleep(scenario.delay ?? 350);
    await evaluate('window.scrollTo(0, 0)');
    const audit = await evaluate(`(() => {
      const visible = e => { const r=e.getBoundingClientRect(), s=getComputedStyle(e); return r.width>0 && r.height>0 && s.visibility==='visible' && s.opacity!=='0' && !e.closest('[aria-hidden="true"], .gizli'); };
      const clipped = [...document.querySelectorAll('h1,h2,h3,h4,p,label,button,a,th,td,dt,dd,small')].filter(e => visible(e) && e.textContent.trim() && e.scrollWidth>e.clientWidth+2 && ['hidden','clip'].includes(getComputedStyle(e).overflowX)).map(e => ({tag:e.tagName,text:e.textContent.trim().slice(0,100)}));
      return { viewport: {width:innerWidth,height:innerHeight}, documentWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth, clippedText:clipped, title:document.title, textLength:document.body.innerText.trim().length };
    })()`);
    const metrics = await cdp('Page.getLayoutMetrics');
    const captureHeight = Math.max(height, Math.ceil(metrics.cssContentSize.height));
    // Tam sayfa PNG'de sabit alt menü ara satırların üstüne gelmesin. Sayfanın akışını
    // veya viewport'unu değiştirmeden, yalnız çekimde menüyü belgenin sonuna sabitle.
    const footerMoved = captureHeight > height && await evaluate(`(() => {
      const nav = document.querySelector('.alt-menu');
      if (!nav || getComputedStyle(nav).position !== 'fixed') return false;
      const y = ${captureHeight} - nav.getBoundingClientRect().height;
      document.body.style.position = 'relative';
      Object.assign(nav.style, {position:'absolute',top:y+'px',bottom:'auto'});
      return true;
    })()`);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true,
      clip: { x: 0, y: 0, width, height: captureHeight, scale: 1 } });
    const filename = `${scenario.name}-${size}.png`;
    await Bun.write(join(output, filename), Buffer.from(shot.data, 'base64'));
    const entry = { file: filename, url: scenario.url, size, width, height: captureHeight, footerMoved: !!footerMoved, ...audit, pageErrors: [...pageErrors], resourceErrors: [...resourceErrors] };
    report.screenshots.push(entry);
    console.log(`${report.screenshots.length}/${scenarios.length * 3} ${filename} (${width}x${captureHeight})`);
    if (audit.viewport.width !== width || audit.viewport.height !== height || audit.documentWidth > width + 1 || audit.bodyWidth > width + 1 || audit.textLength < 10 || pageErrors.length || resourceErrors.length) {
      throw new Error(`Görüntü denetimi başarısız: ${filename}. screenshots/rapor.json dosyasına bakın.`);
    }
  }
  report.complete = true;
  console.log(`Tamam: ${report.screenshots.length} PNG. Metin kesilmesi uyarıları: ${report.screenshots.reduce((n, s) => n + s.clippedText.length, 0)}. Görsel inceleme yapın.`);
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await Bun.write(join(output, 'rapor.json'), JSON.stringify(report, null, 2) + '\n');
  if (socket?.readyState === WebSocket.OPEN) {
    await cdp('Browser.close').catch(() => {});
    socket.close();
  }
  if (browser) {
    await Promise.race([browser.exited, sleep(2000)]);
    if (browser.exitCode === null) { browser.kill(); await browser.exited; }
  }
  for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('Tarayıcı kapandı.')); }
  server.stop(true);
  const cleanupPath = resolve(profile);
  const tempRoot = resolve(tmpdir()) + sep;
  if (!cleanupPath.startsWith(tempRoot + 'pancakeflip-capture-')) throw new Error('Geçici profil yolu beklenen kökün dışında.');
  await rm(cleanupPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
