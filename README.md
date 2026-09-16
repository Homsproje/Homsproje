# Homs Proje

İki bağımsız ürün:

| | Adres | Ne |
|---|---|---|
| **Site** | `/site` | homsproje.com tanıtım |
| **App** | `/app` | Ekip stüdyosu (kod ile) |

Açılış (`/`) yalnızca **Site** veya **App** seçimidir.

## Ne işe yarar

Müteahhit ortak satış ofisi için AI stüdyo. App halka açık değil: üye şifresi veya yönetici kodu gerekir. Ücretsiz deneme girişi yok.

## Ortam

```bash
cp .env.example .env
```

| Değişken | Ne |
|---|---|
| `XAI_API_KEY` | console.x.ai Imagine anahtarı |
| `HOMS_STAFF_CODE` | App yönetici kodu (sunucuda; istemciye gömülmez) |
| `HOMS_LIVE_KEYS` | İsteğe bağlı ekstra `homs_live_…` jetonları |

`Anahtar üret` disk yazmaz. Jeton `HOMS_STAFF_CODE` üzerinden sabit türetilir; deploy değişince kaybolmaz.

## Kuruluş

```bash
npm install
npm run dev
```

App → yönetici kodu veya üye girişi.

## Repo

https://github.com/Homsproje/Homsproje
