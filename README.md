# Homs Proje

İki bağımsız ürün:

| | Adres | Ne |
|---|---|---|
| **Site** | `/site` | homsproje.com tanıtım |
| **App** | `/app` | Ekip stüdyosu (kod ile) |

Açılış (`/`) yalnızca **Site** veya **App** seçimidir.

## Ne işe yarar

Müteahhit ortak satış ofisi için AI stüdyo: boş daireyi döşeme, revize, karusel, görselden video (dolly / gimbal / ilk–son kare). App halka açık değil.

Çalışılan hat: Beşiktaş, Etiler, Vadistanbul, Göktürk, Kemerburgaz.

## Kurulum

```bash
cp .env.example .env
# .env içine XAI_API_KEY yazın
npm install
npm run dev
```

Tarayıcıda kök adres açılır. **App** → ekip kodu.

## API güvenlik

App içinde **API** (klasör yanındaki düğme veya boş sohbet kartı):

- `homs_live_…` anahtarı üret / çevir
- izinli siteler (`homsproje.com`)
- dakikada istek limiti
- oturum ve giriş kilidi

Siteye gömmek için iframe:

```html
<iframe
  src="https://homsproje.com/app"
  title="Homs Proje App"
  allow="clipboard-write; microphone"
  style="width:100%;height:100vh;border:0;background:#fef8ec"
></iframe>
```

## Yığın

TanStack Start, React, Tailwind, Zustand, Grok Imagine (görsel + video).

## Repo

https://github.com/Homsproje/Homsproje
