import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

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

export default function CheckoutPage() {
  const {
    subtotal,
    cartItems,
    removeFromCart,
    user,
    addresses,
    saveAddress,
    placeOrder,
    isLoggedIn
  } = useStore();

  const navigate = useNavigate();

  const [selectedAddressKey, setSelectedAddressKey] = useState(addresses.home ? "home" : addresses.secondary ? "secondary" : "home");
  const savedAddress = addresses[selectedAddressKey] || null;

  const [formError, setFormError] = useState("");
  const [loadingAddressData, setLoadingAddressData] = useState(false);
  const [addressDataError, setAddressDataError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);

  const [showNewAddressForm, setShowNewAddressForm] = useState(!savedAddress);
  const [addressConfirmed, setAddressConfirmed] = useState(!!savedAddress);

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
    title: savedAddress?.title || ""
  });

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);

  const paymentRef = useRef(null);
  const addressRef = useRef(null);

  useSEO({ title: "Ödeme", description: "Teslimat, fatura ve ödeme adımlarını tamamlayın." });

  const shipping = subtotal > 2999 ? 0 : 149;
  const total = subtotal + shipping;

  useEffect(() => {
    const selected = addresses[selectedAddressKey] || null;
    setShowNewAddressForm(!selected);
    setAddressConfirmed(!!selected);
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
      title: selected?.title || ""
    });
  }, [addresses, selectedAddressKey, user?.name, user?.phone]);

  useEffect(() => {
    const loadCities = async () => {
      setLoadingAddressData(true);
      setAddressDataError("");
      try {
        const res = await fetch(`${API_BASE}/provinces?fields=id,name&limit=200`);
        const json = await res.json();
        const list = pickArray(json).map((item) => ({ id: String(item.id), name: normalizeName(item) })).filter((x) => x.id && x.name);
        setCities(list);
        if (!address.cityId && list.length) {
          setAddress((prev) => ({ ...prev, cityId: list[0].id, cityName: list[0].name }));
        }
      } catch {
        setAddressDataError("İl verisi yüklenemedi.");
      } finally {
        setLoadingAddressData(false);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    if (!address.cityId) return;
    const loadDistricts = async () => {
      setLoadingAddressData(true);
      setAddressDataError("");
      try {
        const res = await fetch(`${API_BASE}/districts?provinceId=${address.cityId}&fields=id,name&limit=1200`);
        const json = await res.json();
        const list = pickArray(json).map((item) => ({ id: String(item.id), name: normalizeName(item) })).filter((x) => x.id && x.name);
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
        setAddressDataError("İlçe verisi yüklenemedi.");
      } finally {
        setLoadingAddressData(false);
      }
    };
    loadDistricts();
  }, [address.cityId]);

  useEffect(() => {
    if (!address.districtId) return;
    const loadNeighborhoods = async () => {
      setLoadingAddressData(true);
      setAddressDataError("");
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
        setNeighborhoods(list);

        if (!list.some((n) => n.id === address.neighborhoodId)) {
          const first = list[0];
          setAddress((prev) => ({ ...prev, neighborhoodId: first?.id || "", neighborhoodName: first?.name || "" }));
        }
      } catch {
        setAddressDataError("Mahalle verisi yüklenemedi.");
      } finally {
        setLoadingAddressData(false);
      }
    };
    loadNeighborhoods();
  }, [address.districtId, address.cityName, address.districtName, address.neighborhoodId]);

  const cartEmpty = useMemo(() => cartItems.length === 0, [cartItems.length]);

  const validateAddress = () => {
    if (!address.firstName || !address.lastName || !address.phone || !address.cityId || !address.districtId || !address.neighborhoodId || !address.line || !address.title) {
      setFormError("Teslimat adresindeki tüm alanları doldurun.");
      return false;
    }
    if (address.phone.length < 10 || address.phone.length > 11) {
      setFormError("Telefon numarası 10 veya 11 haneli olmalı.");
      return false;
    }
    if (address.title.trim().length < 10) {
      setFormError("Adres başlığı en az 10 karakter olmalı.");
      return false;
    }
    return true;
  };

  const handleSaveAddressAndContinue = async () => {
    setFormError("");
    if (!validateAddress()) {
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSavingAddress(true);
    try {
      await saveAddress(selectedAddressKey, address);
      setAddressConfirmed(true);
      setShowNewAddressForm(false);
      setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (error) {
      setFormError(error.message || "Adres kaydedilemedi.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleConfirmOrder = async () => {
    setFormError("");

    if (cartEmpty) {
      setFormError("Sepette ürün kalmadı.");
      navigate("/sepet");
      return;
    }

    if (!addressConfirmed) {
      setFormError("Önce teslimat adresini tamamlayın.");
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!cardHolder.trim() || cardNumber.length !== 16 || cardExpiry.length !== 5 || cardCvv.length !== 3) {
      setFormError("Kart bilgilerini eksiksiz doldurun.");
      paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!agreementChecked) {
      setFormError("Sözleşme onayı vermeden devam edemezsiniz.");
      paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSubmittingOrder(true);
    try {
      await placeOrder(addresses[selectedAddressKey] || address);
      navigate("/odeme/basarili");
    } catch (error) {
      setFormError(error.message || "Sipariş oluşturulamadı.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/giris-kayit" replace />;
  }

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Sepet", to: "/sepet" }, { label: "Ödeme" }]} />
      <h1>Ödeme</h1>
      <div className="checkout-steps">
        <span className="active">1. Teslimat</span>
        <span className={addressConfirmed ? "active" : ""}>2. Ödeme</span>
        <span>3. Tamamlandı</span>
      </div>

      <div className="checkout-layout">
        <section className="form-card">
          <div ref={addressRef}>
            <h3>Teslimat Adresi</h3>
            <div className="checkout-address-switch">
              <button
                type="button"
                className={selectedAddressKey === "home" ? "primary-btn" : "secondary-btn"}
                onClick={() => setSelectedAddressKey("home")}
              >
                Adres 1
              </button>
              <button
                type="button"
                className={selectedAddressKey === "secondary" ? "primary-btn" : "secondary-btn"}
                onClick={() => setSelectedAddressKey("secondary")}
              >
                Adres 2
              </button>
            </div>

            {savedAddress && !showNewAddressForm && (
              <div className="saved-address-box">
                <p><strong>{savedAddress.firstName} {savedAddress.lastName}</strong></p>
                <p>{savedAddress.phone}</p>
                <p>{savedAddress.cityName} / {savedAddress.districtName} / {savedAddress.neighborhoodName}</p>
                <p>{savedAddress.line}</p>
                <p><strong>{savedAddress.title}</strong></p>
                <div className="checkout-address-actions">
                  <button className="secondary-btn" onClick={() => setShowNewAddressForm(true)}>Yeni Adres Ekle</button>
                  <button className="primary-btn" onClick={() => {
                    setAddressConfirmed(true);
                    setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                  }}>
                    Bu Adresle Devam Et
                  </button>
                </div>
              </div>
            )}

            {showNewAddressForm && (
              <>
                <div className="form-grid checkout-name-row">
                  <input placeholder="Ad" value={address.firstName} onChange={(e) => setAddress((p) => ({ ...p, firstName: e.target.value }))} />
                  <input placeholder="Soyad" value={address.lastName} onChange={(e) => setAddress((p) => ({ ...p, lastName: e.target.value }))} />
                </div>

                <div className="form-grid">
                  <input
                    className="full"
                    placeholder="Telefon"
                    inputMode="numeric"
                    value={address.phone}
                    onChange={(e) => setAddress((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                  />
                </div>

                <div className="form-grid checkout-location-row">
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
                </div>

                <div className="form-grid">
                  <input className="full" placeholder="Açık Adres" value={address.line} onChange={(e) => setAddress((p) => ({ ...p, line: e.target.value }))} />
                  <input className="full" placeholder="Adres Başlığı (min. 10 karakter)" value={address.title} onChange={(e) => setAddress((p) => ({ ...p, title: e.target.value }))} />
                </div>

                <div className="checkout-address-actions">
                  {savedAddress && (
                    <button className="secondary-btn" onClick={() => setShowNewAddressForm(false)}>Kayıtlı Adrese Dön</button>
                  )}
                  <button className="primary-btn" onClick={handleSaveAddressAndContinue} disabled={savingAddress}>
                    {savingAddress ? "Kaydediliyor..." : "Adresi Kaydet ve Devam Et"}
                  </button>
                </div>
              </>
            )}

            {loadingAddressData && <p className="muted">İl/ilçe/mahalle verileri yükleniyor...</p>}
            {addressDataError && <p className="form-error">{addressDataError}</p>}
          </div>

          {addressConfirmed && (
            <div ref={paymentRef}>
              <h3>Güvenli Ödeme</h3>
              <div className="payment-gateway-card">
                <strong>Banka/Kredi Kartı ile Öde</strong>
                <span>Visa, Mastercard, Troy</span>
              </div>

              <div className="card-payment-form">
                <div className="form-grid">
                  <input className="full" placeholder="Kart Üzerindeki İsim" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                  <input className="full" placeholder="Kart Numarası" inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))} />
                  <input
                    placeholder="AA/YY"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                    }}
                  />
                  <input placeholder="CVV" inputMode="numeric" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                </div>
              </div>

              <div className="installment-row">
                <strong>Taksit</strong>
                <span>Tek Çekim</span>
              </div>

              <label className="agreement-box">
                <input type="checkbox" checked={agreementChecked} onChange={(e) => setAgreementChecked(e.target.checked)} />
                <span>
                  <Link to="/kullanim-kosullari">Ön Bilgilendirme Koşulları</Link> ve{" "}
                  <Link to="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</Link>'ni okudum, onaylıyorum.
                </span>
              </label>
            </div>
          )}

          {formError && <p className="form-error">{formError}</p>}
          <button className="primary-btn block" onClick={handleConfirmOrder} disabled={submittingOrder}>
            {submittingOrder ? "Sipariş oluşturuluyor..." : "Onayla ve Bitir"}
          </button>
        </section>

        <aside className="summary-box">
          <h3>Sipariş Özeti</h3>
          <div className="checkout-product-strip">
            {cartItems.map((line, i) => (
              <Link key={`${line.product?.id || "p"}-${i}`} className="checkout-product-item" to={`/urun/${line.product?.id || ""}`}>
                <img src={line.product?.image} alt={line.product?.name || "Ürün"} loading="lazy" />
                <span>{line.qty}x</span>
              </Link>
            ))}
          </div>

          {cartItems.map((line, i) => (
            <div key={`${line.product?.id || "line"}-${i}`} className="checkout-summary-line">
              <Link className="checkout-summary-link" to={`/urun/${line.product?.id || ""}`}>
                {line.product?.name} x {line.qty}
              </Link>
              <button className="link-btn checkout-remove-btn" onClick={() => removeFromCart(i)}>Kaldır</button>
            </div>
          ))}

          <p>Ara Toplam <strong>{subtotal.toLocaleString("tr-TR")} TL</strong></p>
          <p>Kargo <strong>{shipping === 0 ? "Ücretsiz" : `${shipping} TL`}</strong></p>
          <p className="summary-total">Toplam <strong>{total.toLocaleString("tr-TR")} TL</strong></p>
        </aside>
      </div>
    </div>
  );
}
