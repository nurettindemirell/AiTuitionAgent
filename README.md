# AI Tuition Agent

Bu proje, **SE4458 Ödevi** kapsamında geliştirilmiş bir **AI Agent tabanlı sohbet uygulamasıdır**.  
Uygulama, Midterm’de geliştirilen API’leri kullanarak öğrencilerin:

- **Harç (Tuition) sorgulaması**
- **Harç ödemesi**
- **Ödenmemiş harçların listelenmesi**

işlemlerini doğal dil ile yapmasını sağlar.

GitHub Repository:  
https://github.com/nurettindemirell/AiTuitionAgent

--
## Proje Özeti

Sistem, yapay zekâ destekli bir sohbet arayüzü olarak tasarlanmıştır.  
Kullanıcılar sistemle yazışarak iletişim kurar ve uygulama otomatik olarak:

1. Kullanıcının isteğinii (intent) LLM kullanarak belirler
2. Gerekli parametreleri (öğrenci numarası, dönem, tutar) çıkarır
3. İsteği API Gateway üzerinden yönlendirir
4. İlgili Midterm API’sini çağırır
5. Sonucu tekrar sohbet ekranına döner
---

## Mimari ve Tasarım

Proje **API Gateway Pattern** kullanılarak geliştirilmiştir ve iki ana bileşenden oluşur:

### Frontend (React)
- Sohbet tabanlı kullanıcı arayüzü sağlar
- Kullanıcı mesajlarını backend gateway’e gönderir
- AI Agent tarafından dönen cevapları ekranda gösterir
- Midterm API’lerine **doğrudan erişmez**, sadece gateway ile konuşur

### Backend (Node.js / Express)
- **API Gateway** olarak görev yapar
- Frontend’den gelen mesajları alır
- **OpenAI (gpt-4o-mini)** kullanarak(daha düşüğü mümkün olamadığından):
  - Kullanıcı niyetini belirler  
    (`QUERY_TUITION`, `PAY_TUITION`, `UNPAID_TUITION`)
  - Gerekli parametreleri çıkarır  
    (`studentNo`, `term`, `amount`)
- Niyete göre Midterm API’lerini çağırır
- Sonuçları frontend’e geri gönderir

**Genel Akış:**

```
Kullanıcı → React Sohbet Arayüzü → Node.js Gateway
          → OpenAI (intent + parametre çıkarımı)
          → Midterm API’leri
          → Gateway → React Arayüzü
```

---

## AI Agent Mantığı

AI Agent şu görevleri üstlenir:

- Doğal dilde yazılmış mesajları kolayca anlamak
- Mesajı uygun bir intent’e eşlemek
- Serbest metinden yapılandırılmış veri çıkarmak



Örnekler:
- “check my tuition” → QUERY_TUITION
- “pay tuition for fall 2026 15000” → PAY_TUITION
- “show unpaid tuition for spring 2026” → UNPAID_TUITION

Eğer gerekli bilgiler eksikse(koruma olarak) sistem otomatik olarak kullanıcıya şu soruları yöneltir:
- Öğrenci numarası
- Dönem (FALL / SPRING / SUMMER)
- Ödeme tutarı

---
## Kullanılan API’ler

Tüm API çağrıları **gateway üzerinden** yapılmaktadır:

- **Harç Sorgulama**
  - `GET /api/v1/banking/tuition`
- **Harç Ödeme**
  - `POST /api/v1/banking/pay`
- **Ödenmemiş Harçlar**
  - `GET /api/v1/admin/tuition/unpaid`

Kimlik doğrulama için, ödev gereği **sabit kullanıcı adı ve şifre** kullanılmaktadır.

---

## Varsayımlar (Assumptions)

- Kimlik doğrulamada sabit bir admin(bank yerine admin seçildi) kullanıcı adı/şifresi kullanılır
- Öğrenci numaraları sayısal değerdir
- Dönem formatı `FALL-YYYY`, `SPRING-YYYY` veya `SUMMER-YYYY` şeklindedir

---

## Karşılaşılan Problemler (Issues Encountered)


- Çok adımlı sohbet akışlarında (eksik bilgi durumları) session yönetimi gerekliliği
- Dönem yılı (örneğin 2026) ile ödeme tutarının karışması problemi
- Sohbet tabanlı akışta frontend–backend senkronizasyonu
- Tüm API çağrılarının gateway üzerinden geçmesini garanti altına alma
- AI token bağlamada sorun yaşanması ve ödeme kısmı

---

## Projenin Çalıştırılması

### Backend     
```bash
cd backend
npm install
node index.js
```
### Frontend
```bash
cd frontend
npm install
npm start
```

Backend `http://localhost:3001` adresinde çalışır ve frontend `/gateway` endpoint’i üzerinden iletişim kurar.

---


## Sonuç

Bu proje, **AI Agent** kullanarak mevcut REST API’lerin bir sohbet uygulamasına entegre edilmesini göstermektedir.  
LLM tabanlı intent/parametre çıkarımı ve **API Gateway mimarisi** ile SE4458 ödevinin tüm gereksinimleri karşılanmıştır.
