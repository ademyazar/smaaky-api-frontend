import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "https://lightsalmon-penguin-903536.hostingersite.com/api";

const categoryOrder = [
  "Populair",
  "Smashburgers",
  "Chicken burgers",
  "Loaded fries",
  "Snacks",
  "Sauzen",
  "Dranken",
  "Desserts",
];

const fallbackImages = {
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  chicken:
    "https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=900&q=80",
  fries:
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80",
  snack:
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
  sauce:
    "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=80",
  drink:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
  dessert:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80",
};

function detectCategory(item) {
  const name = `${item.name} ${item.description}`.toLowerCase();

  if (name.includes("chicken")) return "Chicken burgers";
  if (name.includes("fries")) return "Loaded fries";
  if (name.includes("sauce") || name.includes("saus")) return "Sauzen";
  if (name.includes("cola") || name.includes("fanta") || name.includes("drink"))
    return "Dranken";
  if (name.includes("ice") || name.includes("dessert") || name.includes("ben"))
    return "Desserts";
  if (name.includes("classic") || name.includes("burger") || name.includes("cheese"))
    return "Smashburgers";

  return "Smashburgers";
}

function getImageForItem(item) {
  const text = `${item.name} ${item.description}`.toLowerCase();

  if (text.includes("chicken")) return fallbackImages.chicken;
  if (text.includes("fries")) return fallbackImages.fries;
  if (text.includes("sauce") || text.includes("saus")) return fallbackImages.sauce;
  if (text.includes("cola") || text.includes("fanta") || text.includes("drink"))
    return fallbackImages.drink;
  if (text.includes("dessert") || text.includes("ice")) return fallbackImages.dessert;
  if (text.includes("snack")) return fallbackImages.snack;

  return fallbackImages.burger;
}

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Populair");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setError("");
        const response = await fetch(`${API_BASE}/menu`);

        if (!response.ok) {
          throw new Error("Menu kon niet worden geladen");
        }

        const data = await response.json();
        setMenu(data);
      } catch (err) {
        console.error("Menu error:", err);
        setError("Menu yüklenemedi.");
      }
    };

    loadMenu();
  }, []);

  const normalizedMenu = useMemo(() => {
    return menu.map((item) => ({
      ...item,
      category: detectCategory(item),
      image: getImageForItem(item),
    }));
  }, [menu]);

  const groupedMenu = useMemo(() => {
    const groups = {
      Populair: normalizedMenu.slice(0, 4),
    };

    categoryOrder.forEach((category) => {
      if (category !== "Populair") {
        groups[category] = normalizedMenu.filter((item) => item.category === category);
      }
    });

    return groups;
  }, [normalizedMenu]);

  const openProductModal = (item) => {
    setSelectedProduct(item);
    setSelectedQuantity(1);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedQuantity(1);
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === product.id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === product.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }

      return [...prev, { ...product, quantity }];
    });
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, selectedQuantity);
    closeProductModal();
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`section-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOrder = async () => {
    setMessage("");

    if (cart.length === 0) {
      setMessage("Je winkelwagen is leeg.");
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      setMessage("Vul naam, telefoon en adres in.");
      return;
    }

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price_each: Number(item.price),
        line_total: Number(item.price) * item.quantity,
      })),
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bestelling mislukt");
      }

      setMessage(`Bestelling geplaatst! Order ID: ${data.orderId}`);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1600&q=80"
          alt="Smaaky burgers"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">SMAAKY</div>
          <h1>Smaaky</h1>
          <p>Smashburgers, chicken burgers en meer</p>
        </div>
      </header>

      <div className="restaurant-bar">
        <div className="restaurant-main">
          <div className="restaurant-title-row">
            <h2>Smaaky</h2>
            <span className="delivery-pill">Delivery</span>
          </div>
          <div className="restaurant-meta-row">
            <span>⭐ 4.8</span>
            <span>30-45 min</span>
            <span>€ 2.50 bezorging</span>
            <span>Min. € 10,00</span>
          </div>
        </div>
        <button className="hero-order-btn">Online bestellen</button>
      </div>

      <div className="chip-bar">
        {categoryOrder.map((category) => (
          <button
            key={category}
            className={`chip ${activeCategory === category ? "chip-active" : ""}`}
            onClick={() => scrollToCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="layout">
        <main className="content">
          {error && <p className="message">{error}</p>}

          {categoryOrder.map((category) => {
            const items = groupedMenu[category] || [];
            if (!items.length) return null;

            return (
              <section
                key={category}
                id={`section-${category}`}
                className="menu-section"
              >
                <div className="section-header">
                  <h3>{category}</h3>
                  <p>
                    {category === "Populair"
                      ? "Meest gekozen producten"
                      : `${category} van Smaaky`}
                  </p>
                </div>

                <div className="menu-grid">
                  {items.map((item) => (
                    <article className="menu-row-card" key={`${category}-${item.id}`}>
                      <div className="menu-row-content">
                        <div className="menu-row-top">
                          <div>
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                          </div>
                          <div className="menu-row-price">€{item.price}</div>
                        </div>

                        <div className="menu-row-bottom">
                          <button
                            className="view-btn"
                            onClick={() => openProductModal(item)}
                          >
                            Bekijken
                          </button>
                        </div>
                      </div>

                      <img
                        className="menu-thumb"
                        src={item.image}
                        alt={item.name}
                      />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        <aside className="cart">
          <div className="cart-header">
            <h3>Winkelwagen</h3>
            <span>{cartCount} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Je winkelwagen is leeg</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      €{item.price} x {item.quantity}
                    </p>
                  </div>

                  <div className="qty-buttons">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>
                </div>
              ))}

              <div className="cart-total">
                <strong>Totaal: €{total.toFixed(2)}</strong>
              </div>

              <div className="checkout-form">
                <input
                  type="text"
                  placeholder="Naam"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Telefoonnummer"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <textarea
                  placeholder="Adres"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <button
                className="checkout-btn"
                onClick={handleOrder}
                disabled={loading}
              >
                {loading ? "Bezig..." : "Bestellen"}
              </button>

              {message && <p className="message">{message}</p>}
            </>
          )}
        </aside>
      </div>

      <div className="mobile-cart-bar">
        <button className="mobile-cart-button">
          Bekijk winkelwagen · {cartCount} · €{total.toFixed(2)}
        </button>
      </div>

      {selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeProductModal}>
              ×
            </button>

            <img
              className="modal-image"
              src={selectedProduct.image}
              alt={selectedProduct.name}
            />

            <h2>{selectedProduct.name}</h2>
            <p>{selectedProduct.description}</p>
            <strong className="modal-price">€{selectedProduct.price}</strong>

            <div className="modal-qty">
              <button
                onClick={() =>
                  setSelectedQuantity((q) => Math.max(1, q - 1))
                }
              >
                -
              </button>
              <span>{selectedQuantity}</span>
              <button onClick={() => setSelectedQuantity((q) => q + 1)}>
                +
              </button>
            </div>

            <button className="modal-add-btn" onClick={confirmAddToCart}>
              Toevoegen aan winkelwagen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;