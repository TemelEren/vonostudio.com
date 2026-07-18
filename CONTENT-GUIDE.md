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
| `content/settings.json` | E-posta, telefon, adres, sosyal medya linkleri, istatistikler |
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

## Değişiklikleri görmek

- Site internete bağlandıktan sonra (Vercel/Cloudflare): değişikliği kaydedip
  yayınladığınızda site birkaç dakika içinde kendini günceller.
- Bilgisayarda önizleme için: proje klasöründe `npm run dev` komutunu çalıştırıp
  tarayıcıda `http://localhost:4321` adresini açın. Dosyayı her kaydettiğinizde
  sayfa kendiliğinden yenilenir.

## Bir şey bozulursa

Panik yok — en sık hata eksik/fazla virgül ya da kapanmamış tırnaktır. Son
değiştirdiğiniz dosyayı açıp kontrol edin. Site derlenmezse hata mesajında hangi
dosya ve alan olduğu yazar (ör. `content/projects/07-yeni-proje.json: "title" alanı eksik`).
