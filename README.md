# vonostudio.com

Vono Studio'nun ana sitesi. Astro ile yazılmış, **Node üzerinde çalışan** bir
sunucu: her sayfa içeriğini istek anında bir SQLite dosyasından okur, yani
içerik değişince site anında değişir — yeniden derleme yok.

Bu uygulama veritabanına **sadece okuma** yapar. Düzenleme ayrı bir arayüzün
işidir; ikisinin paylaştığı şema → [DATA-MODEL.md](DATA-MODEL.md)

## Hızlı başlangıç

```bash
npm ci
npm run db:seed     # seed/ klasöründen content.db üretir
npm run dev         # http://localhost:4321
```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm ci` | Bağımlılıkları kurar (**Node 22+ gerekir**, `node:sqlite` için) |
| `npm run db:seed` | `seed/` içindeki dosyalardan `content.db` üretir (tabloları sıfırlar) |
| `npm run dev` | Geliştirme sunucusu |
| `npm run check` | Tip ve şablon kontrolü |
| `npm run build` | Sunucuyu `dist/` içine derler |
| `npm start` | Derlenmiş sunucuyu çalıştırır |

## Ayarlar (ortam değişkenleri)

| Değişken | Varsayılan | Ne işe yarar |
|---|---|---|
| `CONTENT_DB` | `content.db` | İçerik veritabanının yolu |
| `SITE_URL` | `https://vonostudio.com` | **Derleme zamanında** okunur; canonical adresler, hreflang, site haritası ve paylaşım kartları bundan türetilir |
| `HOST` / `PORT` | `0.0.0.0` / `4321` | Sunucunun dinlediği adres (Docker imajında `8081`) |

`SITE_URL` çalışma anında değil, `npm run build` sırasında gömülür — alan adı
değişirse yeniden derlemek gerekir. `CONTENT_DB` çalışma anında okunur.

## Sunucuda çalıştırma — Docker (önerilen)

```bash
cd docker-compose
cp .env.example .env         # SITE_URL / PORT / BIND_ADDRESS
docker compose up -d --build
```

Bu kadar. Veritabanı klasörü boşsa konteyner `seed/` verisinden `content.db`
dosyasını kendisi oluşturur; dosya zaten varsa ona hiç dokunmaz.

- Sunucu konteyner içinde **8081** portunu dinler ve dışarıya varsayılan olarak
  **sadece 127.0.0.1** üzerinden açılır — dış dünyaya HAProxy açar. HAProxy
  başka bir makinedeyse `.env` içinde `BIND_ADDRESS=0.0.0.0` yapın.
- İçerik veritabanı `docker-compose/data/content.db` dosyasıdır; konteyner
  içinde `/data/content.db` olarak görünür.

### Veritabanı dosyasının yeri

Elinizdeki `content.db` dosyasını `docker-compose/data/` klasörüne koyun:

```bash
cd docker-compose
mkdir -p data && mv content.db data/
docker compose up -d
```

Klasör dolu olduğu için konteyner seed çalıştırmaz, doğrudan bu dosyayı kullanır.
Başka bir yerde tutmak isterseniz `.env` içinde `DB_DIR=/var/lib/vono` gibi bir
yol verin.

**Neden tek dosya değil de klasör mount ediliyor?** SQLite çalışırken veritabanının
yanında `content.db-wal` ve `content.db-shm` dosyaları açar; ayrıca düzenleme
arayüzü dosyayı yerinden değiştirebilir (yeni dosya yazıp üzerine taşımak yaygın
bir yöntemdir). Tek dosya mount edilirse yan dosyalar konteynerin içinde kalır ve
dosya değiştirildiğinde konteyner eski dosyaya bakmaya devam eder — ikisi de
sessizce yanlış davranışa yol açar. Klasör mount edildiğinde ikisi de doğru çalışır.

**İzinler.** Konteyner `RUN_AS` (varsayılan `1000:1000`) kullanıcısıyla çalışır;
`DB_DIR` klasörünün ve içindeki dosyanın bu kullanıcıya ait olması gerekir:

```bash
sudo chown -R 1000:1000 data       # ya da .env içinde RUN_AS=$(id -u):$(id -g)
```

Site veritabanına sadece okuma yapar, ama klasörün yazılabilir olması gerekir:
WAL modundaki bir veritabanını okumak için SQLite yanına `-shm` dosyası açar.

Düzenleme arayüzü ayrı bir konteynerse aynı klasörü ona da bağlayın — iki
konteyner aynı dosyayı paylaşır, site değişikliği ilk istekte görür.

Günlük işler:

```bash
docker compose logs -f              # kayıtlar
docker compose up -d --build        # kod veya SITE_URL değişince
docker compose restart              # sadece yeniden başlat
docker compose exec web node scripts/seed.mjs   # içeriği seed'e döndür (üzerine yazar)
```

Veritabanı doğrudan sunucuda durduğu için yedeklemek dosyayı kopyalamaktır:

```bash
sqlite3 data/content.db ".backup data/content-$(date +%F).db"
```

**Not:** `SITE_URL` derleme zamanında gömülür, çalışma anında değil. Alan adı
değişirse `--build` ile yeniden kurmak gerekir. `CONTENT_DB` ise çalışma
anında okunur.

## Sunucuda çalıştırma — Docker'sız

```bash
SITE_URL=https://vonostudio.com npm run build
CONTENT_DB=/var/lib/vono/content.db PORT=8081 npm start
```

Sunucuya `dist/`, `package.json`, `package-lock.json`, `scripts/`, `seed/` ve
hedefte `npm ci --omit=dev` ile kurulmuş `node_modules` gider. `content.db`
veridir, kod değildir — depoya girmez, sunucuda kalıcı bir yerde durur.

```ini
[Service]
WorkingDirectory=/srv/vono
Environment=CONTENT_DB=/var/lib/vono/content.db
Environment=PORT=8081
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Restart=always
```

## HAProxy

```haproxy
frontend https-in
    bind :443 ssl crt /etc/haproxy/certs/
    acl host_vono hdr(host) -i vonostudio.com www.vonostudio.com
    use_backend vono if host_vono

backend vono
    option forwardfor
    http-request set-header X-Forwarded-Proto https
    server vono1 127.0.0.1:8081 check
```

Site canonical adreslerini `SITE_URL`'den ürettiği için vekil başlıklarına
bağımlı değildir; `X-Forwarded-*` sadece kayıtlar için gerekir.

## Arama motorları

Site `vonostudio.com` adresinde yayındadır ve `SITE_URL`'in varsayılanı budur.
Eski önizleme alanı `next.vonostudio.com` artık yoktur (2026-09-13).

`vonostudio.com` **dışındaki** her alan adı (ör. bir deneme sunucusu) otomatik
olarak aramaya kapalıdır: `robots.txt` her şeyi engeller ve bütün sayfalar
`noindex` etiketiyle çıkar. Böylece sitenin bir kopyası Google'a düşüp asıl
siteyle mükerrer içerik yarışına giremez. Kuralın tek kaynağı
[`src/seo/site.ts`](src/seo/site.ts) içindeki `PRODUCTION_HOST`. Deneme
sunucusu derlerken `SITE_URL`'e o sunucunun kendi adresini verin.

Kontrol:

1. `/robots.txt` adresinin `Allow: /` döndüğünü ve sayfalarda `noindex`
   olmadığını doğrula.
2. [Google Search Console](https://search.google.com/search-console)'da
   `https://vonostudio.com/sitemap.xml` site haritasının gönderildiğini doğrula.

## Klasörler

| Yol | İçerik |
|---|---|
| `src/db/` | SQLite okuma katmanı ve veri tipleri |
| `src/middleware.ts` | İstek başına bağlantı; görselleri veritabanından sunar |
| `src/components/`, `src/layouts/` | Arayüz |
| `src/seo/` | Site haritası, JSON-LD yapısal veri, indeksleme kuralı |
| `seed/` | `content.db`'yi ilk kez doldurmak için başlangıç verisi |
| `docker-compose/` | Sunucuda çalıştırmak için Dockerfile + compose dosyası |
| `scripts/seed.mjs` | Şemayı kuran ve seed'i içe aktaran betik |
