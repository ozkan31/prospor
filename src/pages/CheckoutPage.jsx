import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../context/StoreContext";
import { apiRequest } from "../lib/api";
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
  const { token, subtotal, cartItems, user, addresses, saveAddress, placeOrder, isLoggedIn } = useStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [addressConfirmed, setAddressConfirmed] = useState(false);

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

  const [agreementChecked, setAgreementChecked] = useState(false);
  const [paytrToken, setPaytrToken] = useState("");
  const [paytrIframeUrl, setPaytrIframeUrl] = useState("");
  const [merchantOid, setMerchantOid] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentResult, setPaymentResult] = useState({ status: "idle", message: "", orderNo: "" });

  const autoFinalizeRef = useRef(false);
  const addressRef = useRef(null);

  useSEO({ title: "Odeme", description: "Teslimat, fatura ve odeme adimlarini tamamlayin." });

  const shipping = subtotal > 2999 ? 0 : 149;
  const total = subtotal + shipping;
  const paytrStatus = searchParams.get("paytr");
  const paytrOid = searchParams.get("oid");

  useEffect(() => {
    const selected = addresses[selectedAddressKey] || null;
    setShowNewAddressForm(!selected);
    setAddressConfirmed(false);
    setAgreementChecked(false);
    setPaytrToken("");
    setPaytrIframeUrl("");
    setMerchantOid("");
    setCurrentStep(paytrStatus ? 3 : 1);
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
  }, [addresses, selectedAddressKey, user?.name, user?.phone, paytrStatus]);

  useEffect(() => {
    const loadCities = async () => {
      setLoadingAddressData(true);
      setAddressDataError("");
      try {
        const res = await fetch(`${API_BASE}/provinces?fields=id,name&limit=200`);
        const json = await res.json();
        const list = pickArray(json)
          .map((item) => ({ id: String(item.id), name: normalizeName(item) }))
          .filter((x) => x.id && x.name);
        setCities(list);
        if (!address.cityId && list.length) {
          setAddress((prev) => ({ ...prev, cityId: list[0].id, cityName: list[0].name }));
        }
      } catch {
        setAddressDataError("Il verisi yuklenemedi.");
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
        const list = pickArray(json)
          .map((item) => ({ id: String(item.id), name: normalizeName(item) }))
          .filter((x) => x.id && x.name);
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
        setAddressDataError("Ilce verisi yuklenemedi.");
      } finally {
        setLoadingAddressData(false);
      }
    };

    loadDistricts();
  }, [address.cityId, address.districtId]);

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
        setAddressDataError("Mahalle verisi yuklenemedi.");
      } finally {
        setLoadingAddressData(false);
      }
    };

    loadNeighborhoods();
  }, [address.districtId, address.cityName, address.districtName, address.neighborhoodId]);

  const cartEmpty = useMemo(() => cartItems.length === 0, [cartItems.length]);

  const validateAddress = () => {
    if (
      !address.firstName ||
      !address.lastName ||
      !address.phone ||
      !address.cityId ||
      !address.districtId ||
      !address.neighborhoodId ||
      !address.line ||
      !address.title
    ) {
      setFormError("Teslimat adresindeki tum alanlari doldurun.");
      return false;
    }

    if (address.phone.length < 10 || address.phone.length > 11) {
      setFormError("Telefon numarasi 10 veya 11 haneli olmali.");
      return false;
    }

    if (address.title.trim().length < 10) {
      setFormError("Adres basligi en az 10 karakter olmali.");
      return false;
    }

    return true;
  };

  const saveAddressIfNeeded = async () => {
    if (!showNewAddressForm) {
      if (!savedAddress) {
        setFormError("Bir teslimat adresi secin.");
        return null;
      }
      return savedAddress;
    }

    if (!validateAddress()) {
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return null;
    }

    setSavingAddress(true);
    try {
      const saved = await saveAddress(selectedAddressKey, address);
      setAddressConfirmed(true);
      setShowNewAddressForm(false);
      return saved;
    } catch (error) {
      setFormError(error.message || "Adres kaydedilemedi.");
      return null;
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCreatePaytrPayment = async (selectedAddress) => {
    setCreatingPayment(true);
    setFormError("");

    try {
      const json = await apiRequest(
        "/paytr/token",
        {
          method: "POST",
          body: JSON.stringify({ address: selectedAddress })
        },
        token
      );

      if (!json?.token || !json?.iframeUrl || !json?.merchantOid) {
        throw new Error("PAYTR token yaniti gecersiz.");
      }

      setPaytrToken(json.token);
      setPaytrIframeUrl(json.iframeUrl);
      setMerchantOid(json.merchantOid);
      setCurrentStep(2);
      return true;
    } catch (error) {
      setCurrentStep(1);
      setFormError(error.message || "PAYTR odemesi baslatilamadi.");
      return false;
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleProceedToPayment = async () => {
    setFormError("");

    if (cartEmpty) {
      setFormError("Sepette urun kalmadi.");
      navigate("/sepet");
      return;
    }

    if (!agreementChecked) {
      setFormError("Sozlesme onayi vermeden devam edemezsiniz.");
      return;
    }

    const selected = await saveAddressIfNeeded();
    if (!selected) return;

    await handleCreatePaytrPayment(selected);
  };

  const handleSaveAddressOnly = async () => {
    setFormError("");
    await saveAddressIfNeeded();
  };

  const finalizeOrderIfPaid = async (oid) => {
    setSubmittingOrder(true);
    setCurrentStep(3);
    setPaymentResult({ status: "pending", message: "Odeme dogrulaniyor...", orderNo: "" });

    try {
      let statusJson = null;
      for (let i = 0; i < 8; i += 1) {
        statusJson = await apiRequest(`/paytr/status/${oid}`, {}, token);
        if (statusJson?.status === "paid") break;
        if (statusJson?.status === "failed") break;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (statusJson?.status !== "paid") {
        autoFinalizeRef.current = false;
        setPaymentResult({
          status: "failed",
          message: "Odeme onayi henuz gelmedi. 5-10 saniye sonra sayfayi yenileyin.",
          orderNo: ""
        });
        return;
      }

      const order = await placeOrder(addresses[selectedAddressKey] || address);
      setPaymentResult({
        status: "success",
        message: "Odemeniz onaylandi ve siparisiniz olusturuldu.",
        orderNo: order?.orderNo || ""
      });
    } catch (error) {
      setPaymentResult({ status: "failed", message: error.message || "Siparis olusturulamadi.", orderNo: "" });
    } finally {
      setSubmittingOrder(false);
    }
  };

  useEffect(() => {
    if (!paytrStatus) return;

    if (paytrStatus === "fail") {
      setCurrentStep(3);
      setPaymentResult({ status: "failed", message: "Odeme basarisiz veya iptal edildi.", orderNo: "" });
      return;
    }

    if (paytrStatus === "ok" && paytrOid && !autoFinalizeRef.current) {
      autoFinalizeRef.current = true;
      setMerchantOid(paytrOid);
      finalizeOrderIfPaid(paytrOid);
    }
  }, [paytrStatus, paytrOid]);

  if (!isLoggedIn) {
    return <Navigate to="/giris-kayit" replace />;
  }

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Sepet", to: "/sepet" }, { label: "Odeme" }]} />
      <h1>Odeme</h1>
      <div className="checkout-steps">
        <span className={currentStep >= 1 ? "active" : ""}>1. Teslimat</span>
        <span className={currentStep >= 2 ? "active" : ""}>2. Odeme</span>
        <span className={currentStep >= 3 ? "active" : ""}>3. Sonuc</span>
      </div>

      <div className="checkout-layout">
        <section className="form-card">
          {currentStep === 1 && (
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
                  <p>
                    <strong>
                      {savedAddress.firstName} {savedAddress.lastName}
                    </strong>
                  </p>
                  <p>{savedAddress.phone}</p>
                  <p>
                    {savedAddress.cityName} / {savedAddress.districtName} / {savedAddress.neighborhoodName}
                  </p>
                  <p>{savedAddress.line}</p>
                  <p>
                    <strong>{savedAddress.title}</strong>
                  </p>
                  <div className="checkout-address-actions">
                    <button className="secondary-btn" onClick={() => setShowNewAddressForm(true)}>
                      Yeni Adres Ekle
                    </button>
                  </div>
                </div>
              )}

              {showNewAddressForm && (
                <>
                  <div className="form-grid checkout-name-row">
                    <input
                      placeholder="Ad"
                      value={address.firstName}
                      onChange={(e) => setAddress((p) => ({ ...p, firstName: e.target.value }))}
                    />
                    <input
                      placeholder="Soyad"
                      value={address.lastName}
                      onChange={(e) => setAddress((p) => ({ ...p, lastName: e.target.value }))}
                    />
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
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
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
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={address.neighborhoodId}
                      onChange={(e) => {
                        const selected = neighborhoods.find((n) => n.id === e.target.value);
                        setAddress((prev) => ({ ...prev, neighborhoodId: e.target.value, neighborhoodName: selected?.name || "" }));
                      }}
                    >
                      {!neighborhoods.length && <option value="">Mahalle bulunamadi</option>}
                      {neighborhoods.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid">
                    <input
                      className="full"
                      placeholder="Acik Adres"
                      value={address.line}
                      onChange={(e) => setAddress((p) => ({ ...p, line: e.target.value }))}
                    />
                    <input
                      className="full"
                      placeholder="Adres Basligi (min. 10 karakter)"
                      value={address.title}
                      onChange={(e) => setAddress((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>

                  <div className="checkout-address-actions">
                    {savedAddress && (
                      <button className="secondary-btn" onClick={() => setShowNewAddressForm(false)}>
                        Kayitli Adrese Don
                      </button>
                    )}
                    <button className="primary-btn" onClick={handleSaveAddressOnly} disabled={savingAddress}>
                      {savingAddress ? "Kaydediliyor..." : "Adresi Kaydet"}
                    </button>
                  </div>
                </>
              )}

              <label className="agreement-box" style={{ marginTop: 14 }}>
                <input type="checkbox" checked={agreementChecked} onChange={(e) => setAgreementChecked(e.target.checked)} />
                <span>
                  <Link to="/kullanim-kosullari">On Bilgilendirme Kosullari</Link> ve{" "}
                  <Link to="/mesafeli-satis-sozlesmesi">Mesafeli Satis Sozlesmesi</Link>'ni okudum, onayliyorum.
                </span>
              </label>

              <button className="primary-btn block" onClick={handleProceedToPayment} disabled={creatingPayment || savingAddress}>
                {creatingPayment ? "PAYTR formu hazirlaniyor..." : "Odemeye Gec"}
              </button>

              {loadingAddressData && <p className="muted">Il/ilce/mahalle verileri yukleniyor...</p>}
              {addressDataError && <p className="form-error">{addressDataError}</p>}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3>Odeme Formu</h3>
              {!paytrIframeUrl && <p className="muted">PAYTR iframe yukleniyor...</p>}
              {paytrIframeUrl && (
                <div className="card-payment-form">
                  <iframe
                    title="PAYTR Odeme"
                    src={paytrIframeUrl}
                    style={{ width: "100%", minHeight: 620, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}
                    allow="payment"
                  />
                  <div className="installment-row">
                    <strong>Odeme Kaydi</strong>
                    <span>{merchantOid || paytrToken.slice(0, 12)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3>Odeme Sonucu</h3>
              {paymentResult.status === "pending" && <p className="muted">{paymentResult.message}</p>}
              {paymentResult.status === "success" && (
                <div className="saved-address-box">
                  <p>
                    <strong>Odeme basarili.</strong>
                  </p>
                  <p>{paymentResult.message}</p>
                  {paymentResult.orderNo && <p>Siparis No: {paymentResult.orderNo}</p>}
                  <button className="primary-btn" onClick={() => navigate("/hesabim?siparisler=1")}>Siparislerime Git</button>
                </div>
              )}
              {paymentResult.status === "failed" && (
                <div className="saved-address-box">
                  <p>
                    <strong>Odeme tamamlanamadi.</strong>
                  </p>
                  <p>{paymentResult.message}</p>
                  <button className="primary-btn" onClick={() => navigate("/odeme")}>Tekrar Dene</button>
                </div>
              )}
              {!paymentResult.status || paymentResult.status === "idle" ? <p className="muted">Sonuc bekleniyor...</p> : null}
            </div>
          )}

          {formError && <p className="form-error">{formError}</p>}
          {submittingOrder && <p className="muted">Siparis olusturuluyor...</p>}
        </section>

        <aside className="summary-box">
          <h3>Siparis Ozeti</h3>
          <div className="checkout-product-strip">
            {cartItems.map((line, i) => (
              <Link key={`${line.product?.id || "p"}-${i}`} className="checkout-product-item" to={`/urun/${line.product?.id || ""}`}>
                <img src={line.product?.image} alt={line.product?.name || "Urun"} loading="lazy" />
                <span>{line.qty}x</span>
              </Link>
            ))}
          </div>

          {cartItems.map((line, i) => (
            <div key={`${line.product?.id || "line"}-${i}`} className="checkout-summary-line">
              <Link className="checkout-summary-link" to={`/urun/${line.product?.id || ""}`}>
                {line.product?.name} x {line.qty}
              </Link>
            </div>
          ))}

          <p>
            Ara Toplam <strong>{subtotal.toLocaleString("tr-TR")} TL</strong>
          </p>
          <p>
            Kargo <strong>{shipping === 0 ? "Ucretsiz" : `${shipping} TL`}</strong>
          </p>
          <p className="summary-total">
            Toplam <strong>{total.toLocaleString("tr-TR")} TL</strong>
          </p>
        </aside>
      </div>
    </div>
  );
}
