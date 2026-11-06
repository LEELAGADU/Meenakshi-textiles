# MEENAKSHI TEXTILES — setup and deployment

This is a Next.js storefront starter with a black-and-gold design. It includes product browsing/search, cart, WhatsApp checkout, Supabase customer authentication, customer reviews, and an admin product-creation/deletion area.

## Important before publishing
- The first six products and a few textile photos are demo content. Replace them with your own product images and accurate descriptions/prices.
- Orders are sent to WhatsApp. This project does **not** collect money or process card/UPI payments online. Confirm the amount, delivery charge and payment method with the customer on WhatsApp.
- Supabase is required for real customer accounts, persistent products, reviews and admin tools. Without Supabase, the page displays demo products only.
- The admin dashboard currently supports adding and deleting products. Product editing, order management, inventory, shipping integration and password reset flows are not included in this starter.
- Do not put a Supabase service-role key in the browser or in a `NEXT_PUBLIC_` variable.

## 1. Create Supabase backend
1. Visit https://supabase.com and create a project.
2. Open **SQL Editor**, create a new query, paste all of `supabase-schema.sql`, and run it.
3. Open **Project Settings → API**. Copy the Project URL and `anon` / publishable key.
4. In Supabase **Storage**, confirm the `product-images` bucket exists and is public (the SQL creates it).
5. In Supabase **Authentication → URL Configuration**, set your local URL to `http://localhost:3000`. After deploying, add your Vercel URL to Site URL / Redirect URLs.
6. Create your own user account from the website. In Supabase **Authentication → Users**, copy your user UUID.
7. In SQL Editor, run this command with your own UUID:
   `insert into public.profiles (id, role) values ('YOUR-USER-UUID', 'admin') on conflict (id) do update set role = 'admin';`
   This makes that account the store admin. Never make all users admins.

## 2. Run on your computer
Install Node.js LTS from https://nodejs.org.
Unzip the project, open a terminal in the project folder, then run:

```bash
npm install
```

Create a file named `.env.local` in the project root using `.env.example` as a template:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_WHATSAPP_NUMBER=919703465908
NEXT_PUBLIC_STORE_NAME=MEENAKSHI TEXTILES
NEXT_PUBLIC_UPI_ID=
```

Use your actual Supabase URL and anon/publishable key. The WhatsApp number must include country code 91, with no `+` or spaces. Change it if your business order number is different.

Then run:

```bash
npm run dev
```

Open http://localhost:3000.

## 3. Upload to GitHub
1. Sign in at https://github.com and create a **New repository** named `meenakshi-textiles`.
2. Keep it Public or Private as you prefer; do not upload `.env.local`.
3. Upload the unzipped project files and folders to the repository, or use Git:
```bash
git init
git add .
git commit -m "Create Meenakshi Textiles website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/meenakshi-textiles.git
git push -u origin main
```

## 4. Deploy on Vercel
1. Sign in at https://vercel.com using GitHub.
2. Select **Add New → Project**, import `meenakshi-textiles`.
3. Framework should be detected as Next.js. Keep the default build settings.
4. In **Environment Variables**, add the same values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `NEXT_PUBLIC_STORE_NAME`
   - `NEXT_PUBLIC_UPI_ID` (optional)
5. Click **Deploy**.
6. Copy your Vercel URL, then add it to Supabase Authentication URL Configuration as an allowed redirect URL. Redeploy if you change environment variables.

## 5. Add your own product images
- Sign in with the admin account you promoted in step 1.
- The **ADMIN** button appears at the bottom-left.
- Add product name, category, price, description and image. The image is uploaded to Supabase Storage.
- Use clear, well-lit product photos you own or have permission to use. Square or portrait images work well; the product cards crop to portrait.

## 6. WhatsApp order number
The default number is based on the business contact previously supplied. To change it, update `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel and redeploy. Use country code and digits only, for example `919XXXXXXXXX`.

## 7. Before going live
- Replace demo products/photos and sample review.
- Test account signup/login, admin upload, product search, cart quantity and WhatsApp order on a phone.
- Add your real Privacy Policy, Terms, Shipping, and Return/Refund pages and display accurate business/contact details.
- Configure Supabase email confirmation and production redirect URLs.
- Review Supabase RLS policies and keep the admin role restricted to your own account.
- Consider adding Razorpay/another payment gateway only if you later want online payments. This starter deliberately uses WhatsApp checkout, not an online gateway.


## Store logo
The supplied Meenakshi Textiles logo is included at `public/meenakshi-logo.png` and is displayed in the site header and footer. To replace it later, upload a new image using the same filename and redeploy.
