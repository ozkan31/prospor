import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { coupons } from "../data/products";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

const tabs = [
  ["profil", "Profil Bilgilerim"],
  ["siparis", "Siparişlerim"],
  ["adres", "Adreslerim"],
  ["kupon", "Kuponlarım"]
];

const API_BASE = "https://api.turkiyeapi.dev/v1";

const pickArray = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.response)) return json.response;
  if (Array.isArray(json?.items)) return json.items;
  return [];
};

const normalizeName = (item) => item?.name || item?.province || item?.district || item?.city || "";
const normalizeId = (item) => String(item?.id ?? item?.neighborhoodId ?? item?.districtId ?? "");
const formatNeighborhoodName = (value) => {
  const name = String(value || "").trim();
  if (!name) return "";
  return /(?:\s|\.|^)(mh|mah|mahalle)\.?$/i.test(name) ? name : `${name} Mh.`;
};
const MORNING_START_HOUR = 6;
const DAY_START_HOUR = 8;
const EVENING_START_HOUR = 18;

const getGreetingText = (date) => {
  const hour = date.getHours();
  if (hour < MORNING_START_HOUR) return "İyi geceler";
  if (hour < DAY_START_HOUR) return "Günaydın";
  if (hour < EVENING_START_HOUR) return "İyi günler";
  return "İyi akşamlar";
};

export default function AccountPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "profil";
  const { user, logout, setProfile, orders, addresses, saveAddress, isLoggedIn } = useStore();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  const [selectedAddressKey, setSelectedAddressKey] = useState(addresses.home ? "home" : addresses.secondary ? "secondary" : "home");
  const savedAddress = addresses[selectedAddressKey] || null;

  const [address, setAddress] = useState({
    firstName: savedAddress?.firstName || user?.name?.split(" ")[0] || "",
    lastName: savedAddress?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    phone: savedAddress?.phone || user?.phone || "",
    cityId: savedAddress?.cityId || "",
    cityName: savedAddress?.cityName || "",
    districtId: savedAddress?.districtId || "",
    districtName: savedAddress?.districtName || "",
    neighborhoodId: savedAddress?.neighborhoodId || "",
    neighborhoodName: savedAddress?.neighborhoodName || "",
    line: savedAddress?.line || "",
    title: savedAddress?.title || (selectedAddressKey === "home" ? "Adres 1" : "Adres 2")
  });

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [addressSaved, setAddressSaved] = useState("");
  const [addressError, setAddressError] = useState("");
  const [loadingAddressData, setLoadingAddressData] = useState(false);
  const [editingAddress, setEditingAddress] = useState(!savedAddress);
  const [profileSaved, setProfileSaved] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });

  useSEO({ title: "Hesabım", description: "Profil, sipariş, adres ve kupon yönetimi." });

  useEffect(() => {
    const selected = addresses[selectedAddressKey] || null;
    setAddress({
      firstName: selected?.firstName || user?.name?.split(" ")[0] || "",
      lastName: selected?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
      phone: selected?.phone || user?.phone || "",
      cityId: selected?.cityId || "",
      cityName: selected?.cityName || "",
      districtId: selected?.districtId || "",
      districtName: selected?.districtName || "",
      neighborhoodId: selected?.neighborhoodId || "",
      neighborhoodName: selected?.neighborhoodName || "",
      line: selected?.line || "",
      title: selected?.title || (selectedAddressKey === "home" ? "Adres 1" : "Adres 2")
    });
    setEditingAddress(!selected);
    setAddressSaved("");
    setAddressError("");
  }, [addresses, selectedAddressKey, user?.name, user?.phone]);

  useEffect(() => {
    setProfileForm({
      firstName: user?.name?.split(" ")[0] || "",
      lastName: user?.name?.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      phone: user?.phone || ""
    });
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (tab !== "adres") return;

    let mounted = true;
    const loadCities = async () => {
      setLoadingAddressData(true);
      setAddressError("");
      try {
        const res = await fetch(`${API_BASE}/provinces?fields=id,name&limit=200`);
        const json = await res.json();
        const list = pickArray(json).map((item) => ({ id: String(item.id), name: normalizeName(item) })).filter((x) => x.id && x.name);
        if (!mounted) return;
        setCities(list);

        if (!address.cityId && list.length) {
          setAddress((prev) => ({ ...prev, cityId: list[0].id, cityName: list[0].name }));
        }
      } catch {
        if (mounted) setAddressError("Adres verisi yüklenemedi. İnternet bağlantınızı kontrol edin.");
      } finally {
        if (mounted) setLoadingAddressData(false);
      }
    };

    loadCities();
    return () => {
      mounted = false;
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== "adres" || !address.cityId) return;

    let mounted = true;
    const loadDistricts = async () => {
      setLoadingAddressData(true);
      setAddressError("");
      try {
        const res = await fetch(`${API_BASE}/districts?provinceId=${address.cityId}&fields=id,name&limit=1200`);
        const json = await res.json();
        const list = pickArray(json).map((item) => ({ id: String(item.id), name: normalizeName(item) })).filter((x) => x.id && x.name);
        if (!mounted) return;
        setDistricts(list);

        if (!list.some((d) => d.id === address.districtId)) {
          const first = list[0];
          setAddress((prev) => ({
            ...prev,
            districtId: first?.id || "",
            districtName: first?.name || "",
            neighborhoodId: "",
            neighborhoodName: ""
          }));
        }
      } catch {
        if (mounted) setAddressError("İlçe verisi yüklenemedi.");
      } finally {
        if (mounted) setLoadingAddressData(false);
      }
    };

    loadDistricts();
    return () => {
      mounted = false;
    };
  }, [tab, address.cityId]);

  useEffect(() => {
    if (tab !== "adres" || !address.districtId) return;

    let mounted = true;
    const loadNeighborhoods = async () => {
      setLoadingAddressData(true);
      setAddressError("");
      try {
        let list = [];

        const res = await fetch(`${API_BASE}/neighborhoods?districtId=${address.districtId}&fields=id,name&limit=50000`);
        const json = await res.json();
        list = pickArray(json)
          .map((item) => ({ id: normalizeId(item), name: formatNeighborhoodName(normalizeName(item)) }))
          .filter((x) => x.id && x.name);

        if (!list.length && address.districtName) {
          const districtQuery = encodeURIComponent(address.districtName);
          const provinceQuery = encodeURIComponent(address.cityName || "");
          const res2 = await fetch(`${API_BASE}/neighborhoods?district=${districtQuery}&province=${provinceQuery}&limit=50000`);
          const json2 = await res2.json();
          list = pickArray(json2)
            .map((item) => ({ id: normalizeId(item), name: formatNeighborhoodName(normalizeName(item)) }))
            .filter((x) => x.id && x.name);
        }

        if (!list.length) {
          const res3 = await fetch(`${API_BASE}/districts/${address.districtId}`);
          const json3 = await res3.json();
          const details = json3?.data?.neighborhoods || json3?.neighborhoods || [];
          list = (Array.isArray(details) ? details : [])
            .map((item) => ({ id: normalizeId(item), name: formatNeighborhoodName(normalizeName(item)) }))
            .filter((x) => x.id && x.name);
        }

        const uniqMap = new Map();
        for (const item of list) {
          if (!uniqMap.has(item.name)) uniqMap.set(item.name, item);
        }
        list = [...uniqMap.values()];

        if (!mounted) return;
        setNeighborhoods(list);

        if (!list.some((n) => n.id === address.neighborhoodId)) {
          const first = list[0];
          setAddress((prev) => ({ ...prev, neighborhoodId: first?.id || "", neighborhoodName: first?.name || "" }));
        }
      } catch {
        if (mounted) setAddressError("Mahalle verisi yüklenemedi.");
      } finally {
        if (mounted) setLoadingAddressData(false);
      }
    };

    loadNeighborhoods();
    return () => {
      mounted = false;
    };
  }, [tab, address.districtId]);

  const saveCurrentAddress = async () => {
    if (!address.firstName || !address.lastName || !address.phone || !address.cityId || !address.districtId || !address.neighborhoodId || !address.line) {
      setAddressError("Lütfen tüm adres alanlarını doldurun.");
      return;
    }
    if (address.phone.length < 10 || address.phone.length > 11) {
      setAddressError("Telefon numarası 10 veya 11 haneli olmalı.");
      return;
    }

    try {
      await saveAddress(selectedAddressKey, address);
      setAddressSaved("Adres kaydedildi.");
      setEditingAddress(false);
      setAddressError("");
      setTimeout(() => setAddressSaved(""), 1000);
    } catch (error) {
      setAddressError(error.message || "Adres kaydedilemedi.");
    }
  };

  const saveProfileInfo = async () => {
    setProfileSaved("");
    setProfileError("");

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const email = profileForm.email.trim();
    const phone = profileForm.phone.trim();

    if (!firstName || !lastName || !email) {
      setProfileError("Ad, soyad ve e-posta alanları zorunludur.");
      return;
    }

    try {
      await setProfile({ firstName, lastName, email, phone });
      setProfileSaved("Profil bilgileri kaydedildi.");
    } catch (error) {
      setProfileError(error.message || "Profil güncellenemedi.");
    }
  };

  const firstName = user?.firstName?.trim() || user?.name?.trim().split(" ")[0] || "";
  const greetingText = firstName ? `${getGreetingText(now)} ${firstName}` : getGreetingText(now);

  if (!isLoggedIn) {
    return <Navigate to="/giris-kayit" replace />;
  }

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Hesabım" }]} />
      <div className="account-heading">
        <h1>Hesabım</h1>
        <p className="account-greeting">{greetingText}</p>
      </div>

      <div className="account-layout">
        <aside className="account-menu">
          {tabs.map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setParams({ tab: key })}>
              {label}
            </button>
          ))}
          <button
            onClick={() => {
              logout();
              navigate("/giris-kayit", { replace: true });
            }}
          >
            Çıkış Yap
          </button>
        </aside>

        <section className="account-content">
          {tab === "profil" && (
            <div>
              <div className="form-grid">
                <input value={profileForm.firstName} onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="Ad" />
                <input value={profileForm.lastName} onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Soyad" />
                <input value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="E-posta" type="email" />
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                  placeholder="Telefon"
                  type="tel"
                />
              </div>
              {profileError && <p className="form-error">{profileError}</p>}
              {profileSaved && <p className="form-success">{profileSaved}</p>}
              <div className="inline-actions">
                <button className="primary-btn" onClick={saveProfileInfo}>Kaydet</button>
                <button className="secondary-btn" onClick={() => navigate("/")}>Anasayfaya Dön</button>
              </div>
            </div>
          )}

          {tab === "siparis" && (
            <div>
              {orders.length === 0 && <p className="muted">Henüz siparişiniz yok.</p>}
              {orders.map((order) => (
                <article key={order.id} className="card-row">
                  <div>
                    <strong>{order.id}</strong>
                    <p>{order.date}</p>
                    {order.items.length > 0 && (
                      <div className="order-mini-items">
                        {order.items.slice(0, 4).map((item, i) => (
                          <Link key={`${order.id}-${item.id || item.name}-${i}`} className="order-mini-thumb" to={item.id ? `/urun/${item.id}` : `/hesabim/siparis/${order.id}`} title={item.name}>
                            {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span>{item.name.slice(0, 1)}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <p>{order.status}</p>
                  <strong>{order.total.toLocaleString("tr-TR")} TL</strong>
                  <Link to={`/hesabim/siparis/${order.id}`}>Detay</Link>
                </article>
              ))}
            </div>
          )}

          {tab === "adres" && (
            <div className="address-editor">
              <div className="checkout-address-switch">
                <button type="button" className={selectedAddressKey === "home" ? "primary-btn" : "secondary-btn"} onClick={() => setSelectedAddressKey("home")}>Adres 1</button>
                <button type="button" className={selectedAddressKey === "secondary" ? "primary-btn" : "secondary-btn"} onClick={() => setSelectedAddressKey("secondary")}>Adres 2</button>
              </div>

              {editingAddress ? (
                <div className="address-card">
                  <h3>Adres</h3>
                  <div className="form-grid">
                    <input value={address.firstName} onChange={(e) => setAddress((p) => ({ ...p, firstName: e.target.value }))} placeholder="Ad" />
                    <input value={address.lastName} onChange={(e) => setAddress((p) => ({ ...p, lastName: e.target.value }))} placeholder="Soyad" />
                    <input value={address.phone} onChange={(e) => setAddress((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))} placeholder="Telefon" type="tel" />

                    <select
                      value={address.cityId}
                      onChange={(e) => {
                        const selected = cities.find((c) => c.id === e.target.value);
                        setAddress((prev) => ({ ...prev, cityId: e.target.value, cityName: selected?.name || "" }));
                      }}
                    >
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>

                    <select
                      value={address.districtId}
                      onChange={(e) => {
                        const selected = districts.find((d) => d.id === e.target.value);
                        setAddress((prev) => ({ ...prev, districtId: e.target.value, districtName: selected?.name || "" }));
                      }}
                    >
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>{district.name}</option>
                      ))}
                    </select>

                    <select
                      value={address.neighborhoodId}
                      onChange={(e) => {
                        const selected = neighborhoods.find((n) => n.id === e.target.value);
                        setAddress((prev) => ({ ...prev, neighborhoodId: e.target.value, neighborhoodName: selected?.name || "" }));
                      }}
                    >
                      {!neighborhoods.length && <option value="">Mahalle bulunamadı</option>}
                      {neighborhoods.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>

                    <input className="full" value={address.line} onChange={(e) => setAddress((prev) => ({ ...prev, line: e.target.value }))} placeholder="Adres Detayı" />
                    <input className="full" value={address.title} onChange={(e) => setAddress((prev) => ({ ...prev, title: e.target.value }))} placeholder="Adres Başlığı" />
                  </div>
                </div>
              ) : (
                <div className="address-summary-box">
                  <h3>{address.title || "Adres"}</h3>
                  <p><strong>{address.firstName} {address.lastName}</strong></p>
                  <p>{address.phone}</p>
                  <p>{address.cityName} / {address.districtName} / {address.neighborhoodName}</p>
                  <p>{address.line}</p>
                  <button className="secondary-btn" onClick={() => setEditingAddress(true)}>Düzenle</button>
                </div>
              )}

              {loadingAddressData && <p className="muted">Adres verisi yükleniyor...</p>}
              {addressError && <p className="form-error">{addressError}</p>}

              <div className="inline-actions">
                {editingAddress && <button className="primary-btn" onClick={saveCurrentAddress}>Adresi Kaydet</button>}
                {addressSaved && <p className="form-success">{addressSaved}</p>}
              </div>
            </div>
          )}

          {tab === "kupon" && (
            <div>
              {coupons.map((c) => (
                <article className="card-row" key={c.code}>
                  <strong>{c.code}</strong>
                  <p>{c.desc}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
