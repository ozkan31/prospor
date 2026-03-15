import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, fetchProducts } from "../lib/api";

const StoreContext = createContext(null);
const TOKEN_KEY = "prospor_token";
const GUEST_CART_KEY = "prospor_guest_cart";

const getSavedToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistGuestCart = (lines) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
  } catch {
    // no-op
  }
};

const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // no-op
  }
};

export function StoreProvider({ children }) {
  const skipNextBootstrapRef = useRef(false);
  const [token, setToken] = useState(() => getSavedToken());
  const [user, setUser] = useState({ id: null, name: "", email: "", phone: "" });
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => (getSavedToken() ? [] : loadGuestCart()));
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [addresses, setAddresses] = useState({ home: null, secondary: null });
  const [authReady, setAuthReady] = useState(false);

  const isLoggedIn = Boolean(user?.email && token);

  const loadProducts = async () => {
    const list = await fetchProducts();
    setProducts(list);
    return list;
  };

  const loadUserData = async (authToken) => {
    const [cartJson, favoritesJson, ordersJson, addressesJson] = await Promise.all([
      apiRequest("/cart", {}, authToken),
      apiRequest("/favorites", {}, authToken),
      apiRequest("/orders", {}, authToken),
      apiRequest("/addresses", {}, authToken)
    ]);

    setCart(Array.isArray(cartJson?.cart) ? cartJson.cart : []);
    setFavorites(Array.isArray(favoritesJson?.favorites) ? favoritesJson.favorites : []);
    const nextOrders = Array.isArray(ordersJson?.orders) ? ordersJson.orders : [];
    setOrders(nextOrders);
    setLastOrder(nextOrders[0] || null);
    setAddresses(addressesJson?.addresses || { home: null, secondary: null });
  };

  const syncGuestCartToServer = async (authToken) => {
    const guestLines = loadGuestCart();
    if (!guestLines.length) return;

    for (const line of guestLines) {
      if (!line?.productId || !line?.size || !line?.color) continue;
      try {
        await apiRequest(
          "/cart/items",
          {
            method: "POST",
            body: JSON.stringify({
              productId: line.productId,
              qty: Math.max(1, Number(line.qty || 1)),
              size: line.size,
              color: line.color
            })
          },
          authToken
        );
      } catch {
        // Continue with best effort; don't block login flow.
      }
    }

    clearGuestCart();
  };

  const bootstrapAuth = async (authToken) => {
    const me = await apiRequest("/auth/me", {}, authToken);
    setUser(me.user);
    await loadUserData(authToken);
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (skipNextBootstrapRef.current) {
        skipNextBootstrapRef.current = false;
        setAuthReady(true);
        return;
      }

      try {
        await loadProducts();
      } catch {
        if (!cancelled) setProducts([]);
      }

      if (!token) {
        if (!cancelled) {
          setAuthReady(true);
          setCart(loadGuestCart());
          setFavorites([]);
          setOrders([]);
          setAddresses({ home: null, secondary: null });
          setLastOrder(null);
          setUser({ id: null, name: "", email: "", phone: "" });
        }
        return;
      }

      try {
        await bootstrapAuth(token);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken("");
          setUser({ id: null, name: "", email: "", phone: "" });
          setCart(loadGuestCart());
          setFavorites([]);
          setOrders([]);
          setAddresses({ home: null, secondary: null });
          setLastOrder(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async ({ email, password }) => {
    const json = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    await syncGuestCartToServer(json.token);
    setUser(json.user);
    await loadUserData(json.token);

    localStorage.setItem(TOKEN_KEY, json.token);
    skipNextBootstrapRef.current = true;
    setToken(json.token);
    return json.user;
  };

  const register = async ({ firstName, lastName, email, password }) => {
    const json = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    await syncGuestCartToServer(json.token);
    setUser(json.user);
    await loadUserData(json.token);

    localStorage.setItem(TOKEN_KEY, json.token);
    skipNextBootstrapRef.current = true;
    setToken(json.token);
    return json.user;
  };

  const loginWithGoogle = async (credential) => {
    const json = await apiRequest("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential })
    });

    await syncGuestCartToServer(json.token);
    setUser(json.user);
    await loadUserData(json.token);

    localStorage.setItem(TOKEN_KEY, json.token);
    skipNextBootstrapRef.current = true;
    setToken(json.token);
    return json.user;
  };

  const setProfile = async (profile) => {
    const firstName = String(profile.firstName || profile.name?.split(" ")[0] || "").trim();
    const lastName = String(profile.lastName || profile.name?.split(" ").slice(1).join(" ") || "").trim();
    const email = String(profile.email || "").trim();
    const phone = String(profile.phone || "").trim();

    if (!token) {
      setUser((prev) => ({ ...prev, name: `${firstName} ${lastName}`.trim(), firstName, lastName, email, phone }));
      return;
    }

    const json = await apiRequest(
      "/users/me",
      {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, email, phone })
      },
      token
    );

    setUser(json.user);
  };

  const logout = async () => {
    if (token) {
      try {
        await apiRequest("/cart/clear", { method: "DELETE" }, token);
      } catch {
        // Best effort clear.
      }
    }

    clearGuestCart();
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser({ id: null, name: "", email: "", phone: "" });
    setCart([]);
    setFavorites([]);
    setOrders([]);
    setAddresses({ home: null, secondary: null });
    setLastOrder(null);
  };

  const addToCart = async (productId, qty = 1, size = null, color = null) => {
    if (!size || !color) return false;

    if (!token || !user?.email) {
      const nextQty = Math.max(1, Number(qty || 1));
      setCart((prev) => {
        const idx = prev.findIndex((line) => line.productId === productId && line.size === size && line.color === color);
        let next;

        if (idx > -1) {
          next = [...prev];
          next[idx] = { ...next[idx], qty: Number(next[idx].qty || 1) + nextQty };
        } else {
          next = [...prev, { id: null, productId, qty: nextQty, size, color }];
        }

        persistGuestCart(next);
        return next;
      });

      return true;
    }

    const json = await apiRequest(
      "/cart/items",
      {
        method: "POST",
        body: JSON.stringify({ productId, qty, size, color })
      },
      token
    );

    setCart(Array.isArray(json.cart) ? json.cart : []);
    return true;
  };

  const removeFromCart = async (index) => {
    if (!token || !user?.email) {
      setCart((prev) => {
        const next = prev.filter((_, i) => i !== index);
        persistGuestCart(next);
        return next;
      });
      return;
    }

    const line = cart[index];
    if (!line?.id) return;

    const json = await apiRequest(`/cart/items/${line.id}`, { method: "DELETE" }, token);
    setCart(Array.isArray(json.cart) ? json.cart : []);
  };

  const updateQty = async (index, qty) => {
    if (!token || !user?.email) {
      setCart((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = { ...next[index], qty: Math.max(1, Number(qty || 1)) };
        persistGuestCart(next);
        return next;
      });
      return;
    }

    const line = cart[index];
    if (!line?.id) return;

    const json = await apiRequest(
      `/cart/items/${line.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ qty: Math.max(1, qty) })
      },
      token
    );

    setCart(Array.isArray(json.cart) ? json.cart : []);
  };

  const clearCart = async () => {
    if (!token || !user?.email) {
      setCart([]);
      clearGuestCart();
      return;
    }

    await apiRequest("/cart/clear", { method: "DELETE" }, token);
    setCart([]);
  };

  const toggleFavorite = async (productId) => {
    if (!token) return false;
    const json = await apiRequest(`/favorites/${productId}`, { method: "POST" }, token);
    setFavorites(Array.isArray(json.favorites) ? json.favorites : []);
    return true;
  };

  const saveAddress = async (type, address) => {
    if (!token) throw new Error("Giriş gerekli.");
    const json = await apiRequest(
      `/addresses/${type}`,
      {
        method: "PUT",
        body: JSON.stringify(address)
      },
      token
    );

    setAddresses((prev) => ({ ...prev, [type]: json.address }));
    return json.address;
  };

  const placeOrder = async (address) => {
    if (!token) throw new Error("Giriş gerekli.");

    const json = await apiRequest(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify({ address })
      },
      token
    );

    if (json.order) {
      setOrders((prev) => [json.order, ...prev]);
      setLastOrder(json.order);
    }

    setCart(Array.isArray(json.cart) ? json.cart : []);
    return json.order;
  };

  const getOrderById = async (orderNo) => {
    if (!token) return null;
    const json = await apiRequest(`/orders/${orderNo}`, {}, token);
    return json.order || null;
  };

  const refreshOrders = async () => {
    if (!token) return;
    const json = await apiRequest("/orders", {}, token);
    const next = Array.isArray(json.orders) ? json.orders : [];
    setOrders(next);
    setLastOrder(next[0] || null);
  };

  const cartItems = useMemo(
    () =>
      cart.map((line) => {
        const product = products.find((p) => p.id === line.productId);
        return { ...line, product };
      }),
    [cart, products]
  );

  const subtotal = cartItems.reduce((sum, line) => sum + (line.product?.price || 0) * line.qty, 0);

  return (
    <StoreContext.Provider
      value={{
        token,
        authReady,
        isLoggedIn,
        user,
        products,
        cart,
        cartItems,
        favorites,
        orders,
        addresses,
        lastOrder,
        subtotal,
        login,
        register,
        loginWithGoogle,
        setProfile,
        logout,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleFavorite,
        saveAddress,
        placeOrder,
        getOrderById,
        refreshOrders,
        loadProducts
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);


