# 📧 Custom Email Domain Setup Guide (Namecheap + Cloudflare + Resend)

This guide explains how to set up a **free custom email address** (e.g., `hello@yourdomain.com`) using:

* **Domain registrar:** Namecheap
* **DNS + Email Routing:** Cloudflare (free tier)
* **Email Sending:** Resend (free tier)

---

## ✅ Prerequisites

* A domain purchased from **Namecheap**
* A free **Cloudflare** account
* A free **Resend** account
* (Optional) A Gmail or other email inbox to receive forwarded emails

---

## 🧭 Overview of Steps

1. Connect domain from Namecheap to Cloudflare
2. Enable Cloudflare Email Routing to receive emails
3. Set up Resend to send emails with your domain

---

## 📌 Step 1: Connect Namecheap Domain to Cloudflare

### 1.1 Add Domain to Cloudflare

* Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
* Click **"Add a Site"**, enter your domain (e.g., `yourdomain.com`)
* Choose the **Free Plan**
* Let Cloudflare scan and import your DNS records

#### What You'll See:

* A list of DNS records that Cloudflare scanned (A, CNAME, MX, etc.)
* Some records might be missing (e.g., `www`) — you can safely ignore those warnings for now
* You'll be prompted to continue to the next step, where you’ll receive two **Cloudflare nameservers** (e.g., `amber.ns.cloudflare.com`, `vasilii.ns.cloudflare.com`).

> ✅ **Important:** Take note of the nameservers shown — you’ll need to enter these in Namecheap

### 1.2 Update Nameservers in Namecheap

* Login to [https://namecheap.com](https://namecheap.com)
* Go to **Domain List** → Click **Manage** next to your domain
* Scroll to **Nameservers** → Set to **Custom DNS**
* Enter the two Cloudflare nameservers exactly as shown
* Click **Save Changes**

#### What You'll See:

* A confirmation that your nameserver changes are saved
* It may take 5–30 minutes (sometimes up to 24 hours) for DNS to propagate globally

> ✅ Once propagation completes, Cloudflare will mark your domain as **"Active"** in your dashboard

You can monitor propagation using [https://dnschecker.org](https://dnschecker.org) → Search for your domain and select **NS (nameservers)**.

---

## ✉️ Step 2: Set Up Cloudflare Email Routing (Receiving)

### 2.1 Enable Email Routing

* In Cloudflare, go to your domain
* Click **Email** → **Email Routing** → **Set Up**

### 2.2 Add a Forwarding Rule

* Create custom addresses like `hello@yourdomain.com`
* Forward them to your existing email inbox (e.g., `yourname@gmail.com`)

### 2.3 Add Required DNS Records

* Cloudflare will ask you to:

    * **Delete existing MX records** (e.g., from Namecheap like `efwd.register.com`)
    * **Add new MX records**: pointing to `mx1.mail.cloudflare.net` and `mx2.mail.cloudflare.net`
    * **Add a TXT record**: to verify domain ownership for email routing

→ Go to the **DNS** tab in Cloudflare and:

* Remove any existing MX records not from Cloudflare
* Add the required Cloudflare MX and TXT records

> 📩 Now you can receive emails sent to your custom domain via Cloudflare routing

### (Optional) Add More Addresses

* You can add up to 200 email addresses or rules
* You can also set a **catch-all**: `*@yourdomain.com` to forward all unmatched emails

---

## 🚀 Step 3: Set Up Resend to Send Emails

### 3.1 Create a Resend Account

* Go to [https://resend.com](https://resend.com) and sign up

### 3.2 Add Your Domain

* In Resend dashboard → Click **Domains** → **Add Domain**
* Enter `yourdomain.com`

### 3.3 Add Resend's DNS Records

Resend will give you:

* **SPF (TXT)**: `v=spf1 include:resend.email ~all`
* **DKIM (CNAME)**
* (Optional) **DMARC (TXT)**: `v=DMARC1; p=none; rua=mailto:your@email.com`

→ Add all records in **Cloudflare DNS tab**

### 3.4 Wait for Verification

* Resend will verify DNS in a few minutes
* Once verified, you’re ready to send

---

## 📤 Sending Emails with Resend (via API)

Example (Node.js):

```ts
import { Resend } from 'resend';

const resend = new Resend('re_YourApiKey');

await resend.emails.send({
  from: 'hello@yourdomain.com',
  to: 'someone@example.com',
  subject: 'Hello from Resend',
  html: '<strong>This is a test email</strong>',
});
```

> ✅ You can send from any address at your verified domain

---

## ✅ Summary

| Function       | Service    | Tool Used                   |
| -------------- | ---------- | --------------------------- |
| Domain         | Namecheap  | Domain Registrar            |
| DNS & Routing  | Cloudflare | Free DNS + Email Forwarding |
| Sending Email  | Resend     | Free API Email Platform     |
| Receiving Mail | Cloudflare | Email Routing               |

---

## 💡 Optional Improvements

* Setup **Gmail alias** to send as `you@yourdomain.com`
* Add **DMARC** record for email reputation
* Monitor with tools like [https://mail-tester.com](https://mail-tester.com)

---

For help, feel free to reach out or reference:

* [Cloudflare Email Routing Docs](https://developers.cloudflare.com/email-routing/)
* [Resend Docs](https://resend.com/docs)
* [Namecheap DNS Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9606/2238/how-do-i-change-the-nameservers-for-my-domain/)

---

**Enjoy your free custom email domain setup!** ✉️🚀
