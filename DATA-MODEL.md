# İçerik veritabanı (content.db)

Sitedeki **bütün yazılar, projeler ve görseller** tek bir SQLite dosyasından
okunur. Bu site o dosyaya sadece **okuma** yapar; yazma işini düzenleme arayüzü
üstlenir. Bu belge ikisinin arasındaki sözleşmedir.

Site her isteği yeni bir bağlantıyla karşılar: veritabanına yazdığınız an
sitede görünür, yeniden başlatmak ya da derlemek gerekmez.

## Tablolar

```sql
-- Tekil belgeler: settings, about, services, references, strings.tr, strings.en
CREATE TABLE content (
  key  TEXT PRIMARY KEY,
  data TEXT NOT NULL          -- JSON
);

-- Her proje bir satır. 'position' sitedeki sırayı belirler (küçükten büyüğe).
CREATE TABLE projects (
  slug     TEXT PRIMARY KEY,  -- adresteki ad: /projeler/<slug>
  position INTEGER NOT NULL,
  data     TEXT NOT NULL      -- JSON
);

-- Eskiden /public altında duran her dosya, URL adresiyle.
CREATE TABLE assets (
  path    TEXT PRIMARY KEY,   -- '/projects/vono-ofis.jpg' — başında / var
  mime    TEXT NOT NULL,      -- 'image/jpeg'
  bytes   BLOB NOT NULL,
  updated INTEGER NOT NULL    -- unix ms; ETag üretmek için kullanılır
);
```

Bu şemayı `seed/` klasöründeki dosyalardan üreten betik:
`npm run db:seed` → [scripts/seed.mjs](scripts/seed.mjs). Betik tabloları
**silip yeniden kurar**, yani boş bir ortamı sıfırdan hazırlamak içindir.

## `content` satırları

### `settings`

```jsonc
{
  "siteName": "Vono Studio",
  "legalName": "Vono Design Studio Mimarlık İnşaat",
  "founded": "2021",
  "email": "info@vonostudio.com",
  "phone": "+90 555 035 66 55",
  "address": { "tr": "...", "en": "..." },
  "seo": {
    "ogImage": "/about/team.jpg",   // link paylaşınca çıkan görsel (assets yolu)
    "addressLocality": "Sarıyer",   // Google işletme kartı alanları
    "addressRegion": "İstanbul",
    "postalCode": "34460",
    "addressCountry": "TR",
    "priceRange": "$$$",
    "areaServed": { "tr": "Türkiye", "en": "Turkey" }
  },
  "social": [{ "name": "Instagram", "link": "https://..." }],
  "stats":  [{ "value": "12+", "label": { "tr": "Proje", "en": "Projects" } }]
}
```

`social` listesi Google'a "bu hesaplar bu firmaya aittir" diye bildirilir
(`sameAs`), o yüzden güncel tutmak SEO açısından önemlidir.

### `about`

```jsonc
{
  "photo": "/about/team.jpg",
  "intro":   { "tr": ["paragraf", "paragraf"], "en": [...] },
  "vision":  { "tr": "...", "en": "..." },
  "mission": { "tr": "...", "en": "..." },
  "values":  [{ "title": {...}, "description": {...} }],
  "awards":  [{ "year": "2019", "name": {...}, "prize": {...} }],
  "team":    [{ "name": "Ad Soyad", "role": {...}, "bio": {...} }]
}
```

### `services`

```jsonc
[{ "title": { "tr": "Mimarlık", "en": "Architecture" }, "description": { "tr": "...", "en": "..." } }]
```

### `references`

```jsonc
[{ "name": "SOCAR", "logo": "/references/socar.png" }]
```

### `strings.tr` / `strings.en`

Menü, başlık ve etiket yazıları — düz anahtar/değer sözlüğü. İki dilin anahtar
listesi **birebir aynı** olmalıdır. Anahtar isimleri kodda geçtiği için
düzenleme arayüzü yeni anahtar uydurmamalı, var olanların değerini değiştirmeli.

Arama sonuçlarında görünen yazılar burada: `meta.title` (~60 karakteri
geçmesin) ve `meta.description` (~155 karakter).

## `projects` satırları

```jsonc
{
  "slug": "vono-ofis",              // satırın slug sütunuyla aynı olmalı
  "title": "Vono Ofis",
  "year": "2021",
  "area": "120 m²",
  "location": { "tr": "İstinye, İstanbul", "en": "İstinye, Istanbul" },
  "category": { "tr": "...", "en": "..." },
  "status":   { "tr": "...", "en": "..." },
  "excerpt":  { "tr": "...", "en": "..." },   // proje sayfasının meta açıklaması
  "body":     { "tr": ["paragraf", ...], "en": [...] },
  "cover":   "/projects/vono-ofis.jpg",       // assets yolu
  "gallery": ["/projects/vono-ofis-1.jpg"]    // boş liste olabilir
}
```

- `slug` adres olur: `/projeler/<slug>` ve `/en/projects/<slug>`. Küçük harf ve
  tire kullanın; boşluk ve Türkçe karakter olmasın.
- `excerpt` proje sayfasının Google'daki açıklaması ve sosyal medya kartındaki
  metnidir — her projeye iyi bir `excerpt` yazmak doğrudan SEO'ya yarar.
- `cover` sosyal medya paylaşım görseli olarak da kullanılır.
- Sıra `position` ile belirlenir; yeniden sıralamak için sadece bu sütun
  güncellenir. Aralık bırakmak (10, 20, 30...) araya proje eklemeyi kolaylaştırır.

## `assets` satırları

`content` ve `projects` içindeki `/projects/...`, `/references/...`,
`/about/...` gibi bütün görsel adresleri bu tablonun `path` sütununa denk gelir.
Site bir adresi önce burada arar, bulursa dosyayı doğrudan veritabanından
gönderir.

- `path` mutlaka `/` ile başlar ve site kökünden itibaren yazılır.
- `mime` doğru olmalı; tarayıcı dosyayı buna göre yorumlar.
- `updated` her yazışta güncellenmeli — ETag bundan üretilir, yoksa tarayıcılar
  eski görseli göstermeye devam eder.
- Fotoğrafları veritabanına koymadan önce sıkıştırın (2000px genişlik yeterli);
  büyük dosyalar hem veritabanını hem sayfa açılışını şişirir.

## Tutarlılık kuralları

Site okuduğu veriye güvenir; düzenleme arayüzünün garanti etmesi gerekenler:

1. Altı `content` satırının hepsi var ve geçerli JSON. Eksik satır sayfayı
   hataya düşürür.
2. `strings.tr` ile `strings.en` aynı anahtarlara sahip.
3. Çift dilli her alanda hem `tr` hem `en` dolu.
4. `projects.slug` ile JSON içindeki `"slug"` aynı.
5. İçerikte geçen her görsel yolunun `assets` tablosunda karşılığı var.
