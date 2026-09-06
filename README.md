# vonostudio.com

Vono Studio'nun ana sitesi. Astro ile yazılmış, **tamamen statik** bir site —
build sonunda `dist/` klasöründe düz HTML/CSS/JS çıkar, çalışması için sunucuda
Node gerekmez.

İçerik düzenlemek için → [CONTENT-GUIDE.md](CONTENT-GUIDE.md)

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm ci` | Bağımlılıkları kurar (Node 20+) |
| `npm run dev` | `http://localhost:4321` adresinde geliştirme sunucusu |
| `npm run check` | Tip ve şablon kontrolü (CI'da da çalışmalı) |
| `npm run build` | Siteyi `dist/` içine üretir |
| `npm run preview` | Üretilmiş `dist/` klasörünü yerelde sunar |

## Alan adı ve yayınlama

Build hangi alan adı için üretildiğini bilmek zorundadır: canonical adresler,
hreflang etiketleri, site haritası ve sosyal medya paylaşım kartları hep buradan
türetilir. Alan adı `SITE_URL` ile verilir:

```bash
# Ön yayın (varsayılan) — next.vonostudio.com
npm run build

# Canlı
SITE_URL=https://vonostudio.com npm run build
```

**Ön yayın alan adları arama motorlarına kapalıdır.** `vonostudio.com` dışındaki
her host için `robots.txt` her şeyi engeller ve tüm sayfalar `noindex` etiketiyle
çıkar. Böylece `next.vonostudio.com` Google'a düşüp ileride asıl siteyle mükerrer
içerik yarışına giremez. Bu kuralın tek kaynağı
[`src/seo/site.ts`](src/seo/site.ts) içindeki `PRODUCTION_HOST`.

Yayınlamak `dist/` klasörünü sunucuya kopyalamaktan ibarettir.

## Sunucu ayarı

Sayfalar dizin biçiminde üretilir (`/projeler/vono-ofis/index.html`), bu yüzden
sunucunun uzantısız adresleri `index.html` dosyasına eşlemesi gerekir. nginx için:

```nginx
server {
    server_name next.vonostudio.com;
    root /var/www/vonostudio/dist;

    location / {
        try_files $uri $uri/index.html $uri.html =404;
    }

    # Bilinmeyen adresler site tasarımındaki 404 sayfasını görsün.
    error_page 404 /404.html;

    # Dosya adlarında hash var, süresiz önbelleğe alınabilirler.
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Caddy, Netlify, Cloudflare Pages gibi statik sunucular bu davranışı zaten
varsayılan olarak sağlar.

## Canlıya geçerken

1. `SITE_URL=https://vonostudio.com npm run build` ile üret.
2. `dist/robots.txt` dosyasının `Allow: /` içerdiğini ve sayfalarda `noindex`
   kalmadığını doğrula.
3. `next.vonostudio.com` adresini `vonostudio.com` adresine kalıcı (301)
   yönlendir — ön yayın kopyası ortada kalmasın.
4. [Google Search Console](https://search.google.com/search-console)'a
   `vonostudio.com` adresini ekleyip `https://vonostudio.com/sitemap-index.xml`
   site haritasını gönder.
