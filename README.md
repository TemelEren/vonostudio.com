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
| `SITE_URL` | `https://next.vonostudio.com` | **Derleme zamanında** okunur; canonical adresler, hreflang, site haritası ve paylaşım kartları bundan türetilir |
| `HOST` / `PORT` | `0.0.0.0` / `4321` | Sunucunun dinlediği adres (Docker imajında `8081`) |

`SITE_URL` çalışma anında değil, `npm run build` sırasında gömülür — alan adı
değişirse yeniden derlemek gerekir. `CONTENT_DB` çalışma anında okunur.

## Sunucuda çalıştırma — Docker (önerilen)

```bash
cd docker-compose
cp .env.example .env         # SITE_URL / PORT / BIND_ADDRESS
docker compose up -d --build
```

Bu kadar. İlk açılışta veritabanı volume'u boşsa konteyner `seed/` verisinden
`content.db` dosyasını kendisi oluşturur; sonraki açılışlarda dokunmaz.

- Sunucu konteyner içinde **8081** portunu dinler ve dışarıya varsayılan olarak
  **sadece 127.0.0.1** üzerinden açılır — dış dünyaya HAProxy açar. HAProxy
  başka bir makinedeyse `.env` içinde `BIND_ADDRESS=0.0.0.0` yapın.
- İçerik veritabanı `content` adlı volume'da, konteyner içinde
  `/data/content.db`. Düzenleme arayüzü de aynı volume'u bağlayarak yazar.
- Dosyayı sunucuda düz bir klasörde tutmak isterseniz `compose.yaml` içindeki
  bind mount satırı hazır ve yorumlu duruyor.

Günlük işler:

```bash
docker compose logs -f              # kayıtlar
docker compose up -d --build        # kod veya SITE_URL değişince
docker compose restart              # sadece yeniden başlat
docker compose exec web node scripts/seed.mjs   # içeriği seed'e döndür (üzerine yazar)
```

Veritabanını yedeklemek / dışarı almak:

```bash
docker compose cp web:/data/content.db ./content.db
```

**Not:** `SITE_URL` derleme zamanında gömülür, çalışma anında değil. Alan adı
değişirse `--build` ile yeniden kurmak gerekir. `CONTENT_DB` ise çalışma
anında okunur.

## Sunucuda çalıştırma — Docker'sız

```bash
SITE_URL=https://next.vonostudio.com npm run build
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
    acl host_vono hdr(host) -i next.vonostudio.com
    use_backend vono if host_vono

backend vono
    option forwardfor
    http-request set-header X-Forwarded-Proto https
    server vono1 127.0.0.1:8081 check
```

Site canonical adreslerini `SITE_URL`'den ürettiği için vekil başlıklarına
bağımlı değildir; `X-Forwarded-*` sadece kayıtlar için gerekir.

## Arama motorları

`vonostudio.com` **dışındaki** her alan adı otomatik olarak aramaya kapalıdır:
`robots.txt` her şeyi engeller ve bütün sayfalar `noindex` etiketiyle çıkar.
Böylece `next.vonostudio.com` Google'a düşüp ileride asıl siteyle mükerrer
içerik yarışına giremez. Kuralın tek kaynağı
[`src/seo/site.ts`](src/seo/site.ts) içindeki `PRODUCTION_HOST`.

Canlıya geçerken:

1. `SITE_URL=https://vonostudio.com npm run build` ile derle.
2. `/robots.txt` adresinin `Allow: /` döndüğünü ve sayfalarda `noindex`
   kalmadığını doğrula.
3. `next.vonostudio.com` adresini `vonostudio.com` adresine kalıcı (301)
   yönlendir.
4. [Google Search Console](https://search.google.com/search-console)'a
   `vonostudio.com` adresini ekleyip `https://vonostudio.com/sitemap.xml`
   site haritasını gönder.

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
