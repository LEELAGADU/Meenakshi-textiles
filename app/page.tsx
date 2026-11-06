"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Menu, X, User, Star, Plus, Minus, Trash2, Upload, LogOut, Sparkles, MessageCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string; name: string; category: string; price: number; description: string;
  image_url: string; featured?: boolean;
};
type CartItem = { product: Product; qty: number };
type Review = { id: string; customer_name: string; rating: number; comment: string; created_at: string };

const categories = ["All", "Sarees", "Kurtis", "Dress Materials", "Blouses"];
const demoProducts: Product[] = [
  { id:"demo-1", name:"Classic Zari Silk Saree", category:"Sarees", price:2499, description:"An elegant festive saree with rich zari-inspired detailing.", image_url:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", featured:true },
  { id:"demo-2", name:"Midnight Elegance Saree", category:"Sarees", price:1899, description:"A graceful drape for celebrations and special occasions.", image_url:"https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-3", name:"Everyday Chic Kurti", category:"Kurtis", price:899, description:"Comfortable styling with a polished everyday look.", image_url:"https://images.unsplash.com/photo-1583391733956-6c78276477e3?auto=format&fit=crop&w=900&q=85", featured:true },
  { id:"demo-4", name:"Festive Dress Material", category:"Dress Materials", price:1399, description:"A versatile unstitched set ready for your own style.", image_url:"https://images.unsplash.com/photo-1603217192097-13c306522c53?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-5", name:"Embroidered Blouse", category:"Blouses", price:699, description:"A detailed finishing touch for your favourite saree.", image_url:"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-6", name:"Graceful Cotton Kurti", category:"Kurtis", price:799, description:"A breathable, easy-to-style wardrobe essential.", image_url:"https://images.unsplash.com/photo-1597983073493-88cd35cf93e3?auto=format&fit=crop&w=900&q=85" }
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [authMode, setAuthMode] = useState<"login"|"signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notice, setNotice] = useState("");
  const [newProduct, setNewProduct] = useState({name:"",category:"Sarees",price:"",description:""});
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [reviewForm, setReviewForm] = useState({name:"",rating:"5",comment:""});

  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919703465908").replace(/\D/g, "");
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "MEENAKSHI TEXTILES";

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    loadProducts();
    loadReviews();
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) { setIsAdmin(false); return; }
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      .then(({data}) => setIsAdmin(data?.role === "admin"));
  }, [user]);

  async function loadProducts() {
    if (!supabase) return;
    const {data, error} = await supabase.from("products").select("*").order("created_at", {ascending:false});
    if (!error && data) setProducts(data as Product[]);
  }
  async function loadReviews() {
    if (!supabase) return;
    const {data} = await supabase.from("reviews").select("*").order("created_at", {ascending:false}).limit(8);
    if (data) setReviews(data as Review[]);
  }

  const visibleProducts = useMemo(() => products.filter(p =>
    (category === "All" || p.category === category) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
  ), [products, category, query]);

  const cartCount = cart.reduce((n, item) => n + item.qty, 0);
  const total = cart.reduce((n, item) => n + item.product.price * item.qty, 0);
  function addToCart(product: Product) {
    setCart(old => {
      const found = old.find(i => i.product.id === product.id);
      return found ? old.map(i => i.product.id === product.id ? {...i, qty:i.qty+1} : i) : [...old, {product,qty:1}];
    });
    setNotice("Added to your bag");
    setTimeout(() => setNotice(""), 1800);
  }
  function changeQty(id:string, amount:number) {
    setCart(old => old.map(i => i.product.id === id ? {...i,qty:i.qty+amount} : i).filter(i => i.qty > 0));
  }
  function checkout() {
    if (!cart.length) return;
    const lines = cart.map(i => `• ${i.product.name} x ${i.qty} — ₹${(i.product.price*i.qty).toLocaleString("en-IN")}`).join("\n");
    const message = `Hello ${storeName}, I would like to place an order:\n\n${lines}\n\nTotal: ₹${total.toLocaleString("en-IN")}\n\nPlease share payment and delivery details.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  }
  async function authenticate(e:React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setNotice("Connect Supabase first. See SETUP.md."); return; }
    const result = authMode === "signup"
      ? await supabase.auth.signUp({email,password,options:{data:{full_name:customerName}}})
      : await supabase.auth.signInWithPassword({email,password});
    if (result.error) setNotice(result.error.message);
    else { setNotice(authMode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Welcome back!"); setAuthOpen(false); }
  }
  async function signOut() { await supabase?.auth.signOut(); setIsAdmin(false); }
  async function saveProduct(e:React.FormEvent) {
    e.preventDefault();
    if (!supabase || !isAdmin) return;
    let image_url = "";
    if (imageFile) {
      const path = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g,"-")}`;
      const {error:uploadError} = await supabase.storage.from("product-images").upload(path,imageFile,{upsert:true});
      if (uploadError) { setNotice(uploadError.message); return; }
      image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    const payload:any = {
      name:newProduct.name, category:newProduct.category, price:Number(newProduct.price),
      description:newProduct.description
    };
    if (image_url) payload.image_url = image_url;
    const request = editingId
      ? supabase.from("products").update(payload).eq("id", editingId)
      : supabase.from("products").insert({...payload, image_url:image_url || ""});
    const {error} = await request;
    if (error) setNotice(error.message);
    else { setNotice(editingId ? "Product updated" : "Product added"); setNewProduct({name:"",category:"Sarees",price:"",description:""}); setImageFile(null); setEditingId(null); loadProducts(); }
  }
  async function deleteProduct(id:string) {
    if (!supabase || !isAdmin || !confirm("Delete this product?")) return;
    const {error} = await supabase.from("products").delete().eq("id",id);
    setNotice(error ? error.message : "Product deleted"); loadProducts();
  }
  async function submitReview(e:React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setNotice("Connect Supabase first to publish reviews."); return; }
    const {error} = await supabase.from("reviews").insert({customer_name:reviewForm.name,rating:Number(reviewForm.rating),comment:reviewForm.comment});
    setNotice(error ? error.message : "Thank you for your review!");
    if (!error) { setReviewForm({name:"",rating:"5",comment:""}); loadReviews(); }
  }

  return (
    <main>
      <div className="announcement">TIMELESS STYLE • THOUGHTFUL DETAILS • MADE FOR YOU</div>
      <header className="header">
        <button className="iconBtn mobileMenu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Menu">{mobileOpen?<X/>:<Menu/>}</button>
        <a className="brand" href="#" aria-label="Meenakshi Textiles home"><img className="brandLogo" src="/meenakshi-logo.png" alt="Meenakshi Textiles — Traditional Elegance, Everyday Style" /></a>
        <nav className={mobileOpen?"nav open":"nav"}>
          <a href="#home" onClick={()=>setMobileOpen(false)}>Home</a><a href="#shop" onClick={()=>setMobileOpen(false)}>Shop</a><a href="#story" onClick={()=>setMobileOpen(false)}>Our Story</a><a href="#reviews" onClick={()=>setMobileOpen(false)}>Reviews</a>
        </nav>
        <div className="headerActions">
          <button className="iconBtn" onClick={()=>setAuthOpen(true)} aria-label="Account"><User size={19}/></button>
          <button className="bagButton" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/> <span>Bag ({cartCount})</span></button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="heroContent">
          <p className="eyebrow"><Sparkles size={14}/> THE ART OF DRESSING BEAUTIFULLY</p>
          <h1>Elegance woven<br/><em>into every moment.</em></h1>
          <p className="heroText">Discover thoughtfully chosen styles that celebrate tradition with a modern touch.</p>
          <a className="goldButton" href="#shop">EXPLORE COLLECTION <span>↗</span></a>
        </div>
        <div className="heroImage"><div className="heroImageLabel">THE NEW<br/><b>COLLECTION</b><span>EST. WITH LOVE</span></div></div>
        <div className="heroBottom"><span>01 — 04</span><span>TRADITION, REIMAGINED</span><span>SCROLL TO DISCOVER ↓</span></div>
      </section>

      <section className="benefits">
        <div><span>✦</span><b>Curated Collections</b><small>Styles selected with care</small></div>
        <div><span>◇</span><b>Personal Assistance</b><small>We’re happy to help</small></div>
        <div><span>✧</span><b>Easy Ordering</b><small>Order directly on WhatsApp</small></div>
      </section>

      <section className="shop section" id="shop">
        <div className="sectionHeading"><div><p className="eyebrow">FIND YOUR SIGNATURE STYLE</p><h2>Shop the <em>collection</em></h2></div><p>Pieces for celebrations, everyday moments<br/>and everything in between.</p></div>
        <div className="shopTools">
          <div className="filters">{categories.map(c=><button key={c} className={category===c?"filter active":"filter"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
          <label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search collection..."/></label>
        </div>
        <div className="productGrid">
          {visibleProducts.map(p=><article className="productCard" key={p.id}>
            <div className="productImage"><img src={p.image_url || "https://placehold.co/700x900/171513/c7a45b?text=Meenakshi+Textiles"} alt={p.name}/>{p.featured&&<span className="productTag">FEATURED</span>}<button className="quickAdd" onClick={()=>addToCart(p)}><Plus size={16}/> ADD TO BAG</button></div>
            <div className="productInfo"><div><span className="productCategory">{p.category}</span><h3>{p.name}</h3></div><b>₹{p.price.toLocaleString("en-IN")}</b></div>
            <p className="productDescription">{p.description}</p>
          </article>)}
        </div>
        {visibleProducts.length===0&&<p className="empty">No products found. Try another search.</p>}
      </section>

      <section className="story" id="story">
        <div className="storyImage"><img src="https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1100&q=85" alt="Traditional Indian textile craftsmanship"/></div>
        <div className="storyCopy"><p className="eyebrow">A LITTLE ABOUT US</p><h2>Rooted in tradition.<br/><em>Made for today.</em></h2><p>At MEENAKSHI TEXTILES, we believe what you wear should feel as special as the moment. Explore a considered selection of sarees, kurtis, dress materials and blouses, chosen to bring beauty to your wardrobe.</p><a href="#shop" className="textLink">DISCOVER OUR COLLECTION ↗</a></div>
      </section>

      <section className="reviews section" id="reviews">
        <div className="sectionHeading"><div><p className="eyebrow">KIND WORDS</p><h2>Stories from <em>our customers</em></h2></div><span className="reviewStars">★★★★★</span></div>
        <div className="reviewGrid">
          {reviews.length ? reviews.map(r=><article className="reviewCard" key={r.id}><div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div><p>“{r.comment}”</p><b>{r.customer_name}</b></article>) : <article className="reviewCard"><div className="stars">★★★★★</div><p>“Beautiful collections and a lovely shopping experience.”</p><b>Customer review</b><small>Sample display — live reviews appear after Supabase setup.</small></article>}
          <form className="reviewForm" onSubmit={submitReview}><h3>Share your experience</h3><input required placeholder="Your name" value={reviewForm.name} onChange={e=>setReviewForm({...reviewForm,name:e.target.value})}/><select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:e.target.value})}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><textarea required placeholder="Write your review..." value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})}/><button className="goldButton small" type="submit">SUBMIT REVIEW ↗</button></form>
        </div>
      </section>

      <section className="newsletter"><p className="eyebrow">A NOTE FROM MEENAKSHI</p><h2>Find something <em>beautiful.</em></h2><p>Have a question or looking for something special?</p><a className="goldButton" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello MEENAKSHI TEXTILES, I would like to know more about your collection.")}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/> CHAT WITH US ON WHATSAPP</a></section>

      <footer className="footer"><a className="brand footerBrand" href="#" aria-label="Meenakshi Textiles home"><img className="footerLogo" src="/meenakshi-logo.png" alt="Meenakshi Textiles — Traditional Elegance, Everyday Style" /></a><p>Timeless style. Thoughtfully chosen.</p><div><a href="#shop">Shop</a><a href="#story">Our Story</a><a href="#reviews">Reviews</a><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Contact</a></div><small>© {new Date().getFullYear()} MEENAKSHI TEXTILES. All rights reserved.</small></footer>

      {notice&&<div className="toast">{notice}</div>}
      {cartOpen&&<div className="overlay" onClick={()=>setCartOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawerHead"><h2>Your shopping bag</h2><button className="iconBtn" onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length===0?<p className="empty">Your bag is waiting for something beautiful.</p>:<><div className="cartItems">{cart.map(i=><div className="cartItem" key={i.product.id}><img src={i.product.image_url} alt=""/><div className="cartDetails"><b>{i.product.name}</b><small>₹{i.product.price.toLocaleString("en-IN")}</small><div className="qty"><button onClick={()=>changeQty(i.product.id,-1)}><Minus size={13}/></button><span>{i.qty}</span><button onClick={()=>changeQty(i.product.id,1)}><Plus size={13}/></button><button className="remove" onClick={()=>changeQty(i.product.id,-i.qty)}><Trash2 size={13}/></button></div></div></div>)}</div><div className="cartFoot"><div><span>Subtotal</span><b>₹{total.toLocaleString("en-IN")}</b></div><small>Delivery charges, if any, will be confirmed on WhatsApp.</small><button className="goldButton full" onClick={checkout}><MessageCircle size={17}/> CONTINUE ON WHATSAPP</button></div></>}</aside></div>}

      {authOpen&&<div className="overlay modalOverlay" onClick={()=>setAuthOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modalClose iconBtn" onClick={()=>setAuthOpen(false)}><X/></button><p className="eyebrow">YOUR MEENAKSHI ACCOUNT</p><h2>{authMode==="login"?"Welcome back":"Create an account"}</h2><form onSubmit={authenticate}>{authMode==="signup"&&<input required placeholder="Full name" value={customerName} onChange={e=>setCustomerName(e.target.value)}/>}<input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" minLength={6} placeholder="Password (minimum 6 characters)" value={password} onChange={e=>setPassword(e.target.value)}/><button className="goldButton full">{authMode==="login"?"SIGN IN":"CREATE ACCOUNT"}</button></form><p className="switchAuth">{authMode==="login"?"New here?":"Already have an account?"} <button onClick={()=>setAuthMode(authMode==="login"?"signup":"login")}>{authMode==="login"?"Create an account":"Sign in"}</button></p>{user&&<button className="textLink" onClick={signOut}><LogOut size={14}/> Sign out</button>}</div></div>}

      {isAdmin&&<button className="adminFab" onClick={()=>setAdminOpen(true)}><ShieldCheck size={16}/> ADMIN</button>}
      {adminOpen&&<div className="overlay modalOverlay" onClick={()=>setAdminOpen(false)}><div className="modal adminModal" onClick={e=>e.stopPropagation()}><button className="modalClose iconBtn" onClick={()=>setAdminOpen(false)}><X/></button><p className="eyebrow">STORE MANAGEMENT</p><h2>Admin dashboard</h2><p className="adminHint">Add products to your live collection. Product editing and deletion are available from the product list below.</p><form onSubmit={saveProduct}><input required placeholder="Product name" value={newProduct.name} onChange={e=>setNewProduct({...newProduct,name:e.target.value})}/><select value={newProduct.category} onChange={e=>setNewProduct({...newProduct,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select><input required type="number" min="1" placeholder="Price in INR" value={newProduct.price} onChange={e=>setNewProduct({...newProduct,price:e.target.value})}/><textarea placeholder="Product description" value={newProduct.description} onChange={e=>setNewProduct({...newProduct,description:e.target.value})}/><label className="uploadLabel"><Upload size={16}/> {imageFile?imageFile.name:"Choose product image"}<input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0]||null)}/></label><button className="goldButton full">{editingId?"SAVE CHANGES":"ADD PRODUCT"}</button>{editingId&&<button type="button" className="textLink" onClick={()=>{setEditingId(null);setNewProduct({name:"",category:"Sarees",price:"",description:""});setImageFile(null);}}>CANCEL EDIT</button>}</form><div className="adminProducts"><h3>Current products</h3>{products.map(p=><div key={p.id}><span>{p.name} — ₹{p.price}</span>{!p.id.startsWith("demo-")&&<span className="adminActions"><button onClick={()=>{setEditingId(p.id);setNewProduct({name:p.name,category:p.category,price:String(p.price),description:p.description});setImageFile(null);}} title="Edit"><span className="editWord">EDIT</span></button><button onClick={()=>deleteProduct(p.id)} title="Delete"><Trash2 size={14}/></button></span>}</div>)}</div></div></div>}
      <a className="whatsappFloat" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle/></a>
    </main>
  );
}
