# İçerik Düzenleme Rehberi

Bu sitedeki **bütün yazılar, projeler ve iletişim bilgileri** `content/` klasöründeki
dosyalardan okunur. Siteyi güncellemek için kod bilmenize gerek yok — sadece bu
dosyaları düzenlemeniz yeterli.

> Dosyaları **Not Defteri** ile bile açabilirsiniz, ama ücretsiz olan
> [Visual Studio Code](https://code.visualstudio.com/) kullanmanızı öneririz:
> hata yaparsanız (ör. eksik virgül) satırı kırmızıyla işaretler.

## Hangi dosya neyi değiştirir?

| Dosya | İçerik |
|---|---|
| `content/strings.tr.json` | Sitedeki tüm Türkçe yazılar (menü, başlıklar, stüdyo metni...) |
| `content/strings.en.json` | Aynı yazıların İngilizceleri |
| `content/settings.json` | E-posta, telefon, adres, sosyal medya linkleri, istatistikler, arama motoru (SEO) bilgileri |
| `content/services.json` | Hizmet listesi (TR + EN bir arada) |
| `content/about.json` | Hakkımızda: tanıtım metni, vizyon, misyon, değerler, ödüller, ekip |
| `content/references.json` | Kayan referans logoları |
| `content/projects/` | Her proje ayrı bir dosya |

## Altın kurallar (JSON formatı)

1. Yazılar her zaman `"çift tırnak"` içinde olmalı.
2. Satırların sonundaki **virgüllere** dokunmayın; listedeki *son* öğeden sonra virgül **olmaz**.
3. Yazının içinde tırnak kullanmanız gerekirse başına ters eğik çizgi koyun: `\"örnek\"`
4. Türkçe karakterler (ç, ğ, ı, ö, ş, ü) serbesttir.
5. Sadece tırnak içindeki yazıları değiştirin; iki nokta üst üste işaretinin *solundaki*
   isimler (`"title"`, `"year"` gibi) sistemin parçasıdır, değiştirmeyin.

## Bir yazıyı değiştirmek

Örnek: Ana sayfadaki "Bir projeniz mi var?" yazısını değiştirmek istiyorsunuz.

1. `content/strings.tr.json` dosyasını açın.
2. Yazıyı bulun: `"contact.title": "Bir projeniz mi var?"`
3. Sadece ikinci tırnağın içini değiştirin: `"contact.title": "Birlikte çalışalım"`
4. Dosyayı kaydedin. (İngilizcesini de `strings.en.json` içinde güncellemeyi unutmayın.)

## Yeni proje eklemek

1. `content/projects/` klasöründeki bir dosyayı kopyalayın (ör. `01-meridian-evi.json`).
2. Yeni ada taşıyın: `07-yeni-proje.json` — **baştaki numara sitedeki sırayı belirler.**
3. Dosyayı açıp bütün alanları kendi projenize göre doldurun:
   - `"slug"`: projenin internet adresi (ör. `vonostudio.com/projeler/yeni-proje`).
     Küçük harf ve tire kullanın, boşluk ve Türkçe karakter kullanmayın: `"yeni-proje"`
   - `"title"`: proje adı (sitede göründüğü gibi)
   - `"location"`, `"category"`, `"status"`, `"excerpt"`, `"body"`: hem `"tr"` hem `"en"`
     karşılığını doldurun
   - `"body"`: paragraf listesi — her paragraf ayrı tırnak içinde, aralarına virgül
4. Fotoğrafları ekleyin (aşağıya bakın) ve `"cover"` / `"gallery"` alanlarına yazın.

Bir projeyi **silmek** için dosyasını silmeniz yeterli. **Sırasını değiştirmek** için
dosya adındaki numarayı değiştirin.

## Fotoğraf eklemek

1. Fotoğrafı `public/projects/` klasörüne kopyalayın (ör. `yeni-proje-kapak.jpg`).
   - Tavsiye: 2000px genişlik yeterli; dosya boyutunu küçük tutmak için
     [squoosh.app](https://squoosh.app) ile sıkıştırabilirsiniz.
2. Proje dosyasında adresini `/projects/` ile başlatarak yazın:
   ```
   "cover": "/projects/yeni-proje-kapak.jpg",
   "gallery": ["/projects/yeni-proje-1.jpg", "/projects/yeni-proje-2.jpg"]
   ```

## Referans logosu eklemek

1. Logoyu `public/references/` klasörüne kopyalayın (tercihen SVG ya da şeffaf PNG,
   yatay logolar en iyi görünür).
2. `content/references.json` dosyasına bir satır ekleyin (son satır hariç sonuna virgül):
   ```
   { "name": "Firma Adı", "logo": "/references/firma-adi.svg" }
   ```
Silmek için satırı silin; sıralamayı satırların sırası belirler.

## Google'da nasıl göründüğü (SEO)

Sitenin arama motorlarına ve sosyal medyaya verdiği bilgiler otomatik üretilir;
elle uğraşmanız gerekmez. Yeni bir proje eklediğinizde site haritası
(`sitemap-index.xml`), Google için hazırlanan işletme/proje bilgileri ve link
paylaşım kartları kendiliğinden güncellenir.

Elinizde olan üç şey var:

1. **Sayfa başlığı ve açıklaması.** `content/strings.tr.json` (ve `.en.json`)
   içindeki `"meta.title"` ve `"meta.description"` satırları Google sonuçlarında
   görünen yazılardır. Başlığı ~60, açıklamayı ~155 karakterin altında tutun.
   Proje sayfalarında bu iş için projenin `"title"` ve `"excerpt"` alanları
   kullanılır — yani her projeye iyi bir `excerpt` yazmak doğrudan SEO'ya yarar.

2. **Link paylaşım görseli.** WhatsApp, Instagram ya da LinkedIn'de site linkini
   paylaştığınızda çıkan kapak fotoğrafı. `content/settings.json` içinde:
   `"seo": { "ogImage": "/about/team.jpg" }`. İsterseniz 1200x630 piksel bir
   görsel hazırlayıp `public/` klasörüne `og.jpg` adıyla koyup burayı
   `"/og.jpg"` yapın. (Proje sayfaları kendi kapak fotoğrafını kullanır.)

3. **İşletme bilgileri.** Yine `content/settings.json` içindeki `"seo"` bloğu:
   ilçe, il, posta kodu, ülke. Bunlar Google'ın işletme kartında kullanılır —
   adres değişirse hem `"address"` hem bu alanları güncelleyin. Sosyal medya
   linkleri de (`"social"`) Google'a "bu hesaplar bu firmaya ait" diye bildirilir,
   o yüzden listeyi güncel tutmak önemlidir.

> Site yayına alındıktan sonra tek seferlik yapılacak iş:
> [Google Search Console](https://search.google.com/search-console)'a
> `vonostudio.com` adresini ekleyip `https://vonostudio.com/sitemap-index.xml`
> site haritasını göndermek.

## Değişiklikleri görmek

- Değişikliği kaydedip siteyi yeniden yayınlattığınızda (bkz. README.md) site
  birkaç dakika içinde güncellenir.
- Bilgisayarda önizleme için: proje klasöründe `npm run dev` komutunu çalıştırıp
  tarayıcıda `http://localhost:4321` adresini açın. Dosyayı her kaydettiğinizde
  sayfa kendiliğinden yenilenir.

## Bir şey bozulursa

Panik yok — en sık hata eksik/fazla virgül ya da kapanmamış tırnaktır. Son
değiştirdiğiniz dosyayı açıp kontrol edin. Site derlenmezse hata mesajında hangi
dosya ve alan olduğu yazar (ör. `content/projects/07-yeni-proje.json: "title" alanı eksik`).
