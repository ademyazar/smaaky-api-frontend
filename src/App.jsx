import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "https://lightsalmon-penguin-903536.hostingersite.com/api";

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        setError("Menu yüklenemedi. Console’a bak.");
      }
    };

    loadMenu();
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...prev, { ...item, quantity: 1 }];
    });
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
      <header className="topbar">
        <div>
          <h1>Smaaky</h1>
          <p className="subtitle">Smashburgers, chicken burgers en meer</p>
        </div>
        <div className="status">Online bestellen</div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <h3>Categorieën</h3>
          <ul>
            <li>Smashburgers</li>
            <li>Chicken burgers</li>
            <li>Loaded fries</li>
            <li>Sauzen</li>
            <li>Dranken</li>
            <li>Desserts</li>
          </ul>
        </aside>

        <main className="content">
          <h2>Menu</h2>

          {error && <p className="message">{error}</p>}

          <div className="menu-list">
            {menu.map((item) => (
              <div className="menu-card" key={item.id}>
                <div className="menu-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <strong>€{item.price}</strong>
                </div>

                <button className="add-btn" onClick={() => addToCart(item)}>
                  Toevoegen
                </button>
              </div>
            ))}
          </div>
        </main>

        <aside className="cart">
          <h3>Winkelwagen</h3>

          {cart.length === 0 ? (
            <p>Je winkelwagen is leeg</p>
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
    </div>
  );
}

export default App;