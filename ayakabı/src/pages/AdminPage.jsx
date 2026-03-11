import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { demoOrders } from "../data/products";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

const ADMIN_TOKEN_KEY = "prospor_admin_token";

const tabs = [
  ["orders", "Siparişler"],
  ["products", "Ürünler"],
  ["categories", "Kategoriler"]
];

const initialForm = {
  id: "",
  name: "",
  brand: "",
  price: "",
  oldPrice: "",
  rating: "0",
  reviews: "0",
  gender: "Unisex",
  stock: "0",
  description: "",
  specs: "",
  usage: "",
  shipping: "",
  returns: "",
  gallery: ""
};

const getSavedAdminToken = () => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const addUniqueItem = (list, value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return list;
  if (list.some((item) => item.toLowerCase() === normalized.toLowerCase())) return list;
  return [...list, normalized];
};

export default function AdminPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { products, loadProducts } = useStore();

  const [tab, setTab] = useState("orders");
  const [adminToken, setAdminToken] = useState(() => getSavedAdminToken());
  const [adminEmail, setAdminEmail] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(initialForm);
  const [categoryInput, setCategoryInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [categoryItems, setCategoryItems] = useState([]);
  const [colorItems, setColorItems] = useState([]);
  const [sizeItems, setSizeItems] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useSEO({ title: "Admin Panel", description: "ProSpor yönetim paneli" });

  useEffect(() => {
    let mounted = true;

    const verifyAdminSession = async () => {
      if (!adminToken) {
        if (mounted) setLoadingAuth(false);
        return;
      }

      try {
        const json = await apiRequest("/admin/me", {}, adminToken);
        if (!mounted) return;
        setAdminEmail(json?.admin?.email || "");
        setAuthError("");
        await loadProducts();
      } catch (error) {
        if (!mounted) return;
        setAdminToken("");
        setAdminEmail("");
        setAuthError(error.message || "Admin oturumu doğrulanamadı.");
        try {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        } catch {
          // no-op
        }
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    };

    verifyAdminSession();
    return () => {
      mounted = false;
    };
  }, [adminToken, loadProducts]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const item of products) {
      const list = Array.isArray(item?.category) ? item.category : [];
      for (const c of list) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!email || !password) {
      setAuthError("E-posta ve şifre zorunlu.");
      return;
    }

    setLoginLoading(true);
    try {
      const json = await apiRequest("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      setAdminToken(json.token || "");
      setAdminEmail(json?.admin?.email || email);
      localStorage.setItem(ADMIN_TOKEN_KEY, json.token || "");
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setAuthError(error.message || "Admin girişi başarısız.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken("");
    setAdminEmail("");
    setAuthError("");
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // no-op
    }
    navigate("/", { replace: true });
  };

  const openFilePicker = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveMessage("");

    if (!newProduct.name.trim() || !newProduct.brand.trim() || !newProduct.price) {
      setSaveError("Ürün adı, marka ve fiyat zorunlu.");
      return;
    }

    if (!categoryItems.length || !colorItems.length || !sizeItems.length) {
      setSaveError("Kategori, renk ve numara alanlarına en az bir değer ekleyin.");
      return;
    }

    if (!selectedFiles.length && !newProduct.gallery.trim()) {
      setSaveError("En az bir görsel seçin veya galeri URL girin.");
      return;
    }

    const formData = new FormData();
    Object.entries(newProduct).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    formData.set("category", categoryItems.join(","));
    formData.set("colors", colorItems.join(","));
    formData.set("sizes", sizeItems.join(","));

    selectedFiles.forEach((file) => formData.append("images", file));

    setSaveLoading(true);
    try {
      await apiRequest(
        "/admin/products",
        {
          method: "POST",
          body: formData
        },
        adminToken
      );

      await loadProducts();
      setNewProduct(initialForm);
      setCategoryInput("");
      setColorInput("");
      setSizeInput("");
      setCategoryItems([]);
      setColorItems([]);
      setSizeItems([]);
      setSelectedFiles([]);
      setIsAddOpen(false);
      setSaveMessage("Ürün başarıyla eklendi.");
    } catch (error) {
      setSaveError(error.message || "Ürün eklenemedi.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="container page-pad">
        <h1>Admin Panel</h1>
        <p className="muted">Admin oturumu kontrol ediliyor...</p>
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="container page-pad auth-wrap">
        <h1>Admin Girişi</h1>
        <form className="card auth-card" onSubmit={handleAdminLogin}>
          <input
            type="email"
            placeholder="Admin e-posta"
            value={loginForm.email}
            onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Şifre"
            value={loginForm.password}
            onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {authError && <p className="form-error">{authError}</p>}
          <button className="primary-btn block" type="submit" disabled={loginLoading}>
            {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container page-pad">
      <h1>Admin Panel</h1>
      <p className="muted">Oturum: {adminEmail || "admin"}</p>
      {saveMessage && <p className="form-success">{saveMessage}</p>}

      <div className="admin-layout">
        <aside className="admin-menu">
          {tabs.map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
          <button onClick={handleAdminLogout}>Çıkış Yap</button>
        </aside>

        <section className="admin-content">
          {tab === "products" && (
            <div>
              <button className="primary-btn" onClick={() => setIsAddOpen((prev) => !prev)}>
                {isAddOpen ? "Ürün Ekleme Formunu Kapat" : "Ürün Ekle"}
              </button>

              {isAddOpen && (
                <form className="admin-add-form" onSubmit={handleAddProduct}>
                  <div className="form-grid">
                    <input placeholder="Ürün kimliği (opsiyonel)" value={newProduct.id} onChange={(e) => setNewProduct((p) => ({ ...p, id: e.target.value }))} />
                    <input placeholder="Ürün adı" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
                    <input placeholder="Marka" value={newProduct.brand} onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))} />
                    <input placeholder="Fiyat" type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
                    <input placeholder="Eski fiyat" type="number" step="0.01" value={newProduct.oldPrice} onChange={(e) => setNewProduct((p) => ({ ...p, oldPrice: e.target.value }))} />
                    <input placeholder="Puan" type="number" step="0.01" value={newProduct.rating} onChange={(e) => setNewProduct((p) => ({ ...p, rating: e.target.value }))} />
                    <input placeholder="Yorum sayısı" type="number" value={newProduct.reviews} onChange={(e) => setNewProduct((p) => ({ ...p, reviews: e.target.value }))} />
                    <input placeholder="Cinsiyet (Erkek/Kadın/Unisex)" value={newProduct.gender} onChange={(e) => setNewProduct((p) => ({ ...p, gender: e.target.value }))} />
                    <input placeholder="Stok" type="number" value={newProduct.stock} onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))} />

                    <div className="admin-tag-input-row">
                      <input
                        className="admin-half-input"
                        placeholder="Kategori ekle"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setCategoryItems((prev) => addUniqueItem(prev, categoryInput));
                          setCategoryInput("");
                        }}
                      >
                        Ekle
                      </button>
                    </div>
                    <div className="admin-tag-list">
                      {categoryItems.map((item) => (
                        <span className="admin-tag-chip" key={`category-${item}`}>
                          {item}
                          <button type="button" onClick={() => setCategoryItems((prev) => prev.filter((x) => x !== item))}>x</button>
                        </span>
                      ))}
                    </div>

                    <div className="admin-tag-input-row">
                      <input
                        className="admin-half-input"
                        placeholder="Renk ekle"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setColorItems((prev) => addUniqueItem(prev, colorInput));
                          setColorInput("");
                        }}
                      >
                        Ekle
                      </button>
                    </div>
                    <div className="admin-tag-list">
                      {colorItems.map((item) => (
                        <span className="admin-tag-chip" key={`color-${item}`}>
                          {item}
                          <button type="button" onClick={() => setColorItems((prev) => prev.filter((x) => x !== item))}>x</button>
                        </span>
                      ))}
                    </div>

                    <div className="admin-tag-input-row">
                      <input
                        className="admin-half-input"
                        placeholder="Numara ekle"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setSizeItems((prev) => addUniqueItem(prev, sizeInput));
                          setSizeInput("");
                        }}
                      >
                        Ekle
                      </button>
                    </div>
                    <div className="admin-tag-list">
                      {sizeItems.map((item) => (
                        <span className="admin-tag-chip" key={`size-${item}`}>
                          {item}
                          <button type="button" onClick={() => setSizeItems((prev) => prev.filter((x) => x !== item))}>x</button>
                        </span>
                      ))}
                    </div>

                    <textarea className="full" placeholder="Açıklama" value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} />
                    <textarea className="full" placeholder="Özellikler (virgülle veya satır satır)" value={newProduct.specs} onChange={(e) => setNewProduct((p) => ({ ...p, specs: e.target.value }))} />
                    <textarea className="full" placeholder="Kullanım metni" value={newProduct.usage} onChange={(e) => setNewProduct((p) => ({ ...p, usage: e.target.value }))} />
                    <textarea className="full" placeholder="Kargo metni" value={newProduct.shipping} onChange={(e) => setNewProduct((p) => ({ ...p, shipping: e.target.value }))} />
                    <textarea className="full" placeholder="İade metni" value={newProduct.returns} onChange={(e) => setNewProduct((p) => ({ ...p, returns: e.target.value }))} />
                    <textarea
                      className="full"
                      placeholder="Ek galeri URL (virgülle veya satır satır, opsiyonel)"
                      value={newProduct.gallery}
                      onChange={(e) => setNewProduct((p) => ({ ...p, gallery: e.target.value }))}
                    />
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileSelect} />

                  <div className="admin-image-grid">
                    <button type="button" className="admin-image-picker" onClick={openFilePicker} aria-label="Görsel seç">
                      +
                    </button>
                    {selectedFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="admin-image-thumb-wrap">
                        <img className="admin-image-thumb" src={previewUrls[idx]} alt={file.name} />
                        <button type="button" className="admin-image-remove" onClick={() => removeSelectedFile(idx)}>x</button>
                      </div>
                    ))}
                  </div>

                  {saveError && <p className="form-error">{saveError}</p>}
                  <div className="inline-actions">
                    <button className="primary-btn" type="submit" disabled={saveLoading}>
                      {saveLoading ? "Kaydediliyor..." : "Ürünü Kaydet"}
                    </button>
                  </div>
                </form>
              )}

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Ürün</th><th>Marka</th><th>Fiyat</th><th>Stok</th><th>Kategori</th></tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.brand}</td>
                        <td>{Number(p.price || 0).toLocaleString("tr-TR")} TL</td>
                        <td>{p.stock}</td>
                        <td>{Array.isArray(p.category) ? p.category.join(", ") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>No</th><th>Tarih</th><th>Durum</th><th>Tutar</th></tr></thead>
                <tbody>
                  {demoOrders.map((o) => (
                    <tr key={o.id}><td>{o.id}</td><td>{o.date}</td><td>{o.status}</td><td>{o.total.toLocaleString("tr-TR")} TL</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "categories" && (
            <div className="admin-list">
              {categories.length === 0 && <p className="muted">Henüz kategori yok.</p>}
              {categories.map((c) => (
                <article className="admin-list-item" key={c}>
                  <strong>{c}</strong>
                  <span>{products.filter((p) => Array.isArray(p.category) && p.category.includes(c)).length} ürün</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
