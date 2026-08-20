import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all shortened URLs
  const getUrls = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/urls");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch URLs");
      }

      setUrls(data);
    } catch (error) {
      console.error("Failed to fetch URLs:", error);
    }
  };

  // Create shortened URL
  const shortenUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShortUrl("");

      const response = await fetch("http://localhost:5000/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to shorten URL");
      }

      setShortUrl(data.shortUrl);
      setUrl("");

      // Refresh the list
      await getUrls();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete URL
  const deleteUrl = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/urls/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete URL");
      }

      await getUrls();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Refresh click count after opening a shortened URL
  const handleShortUrlClick = () => {
    setTimeout(() => {
      getUrls();
    }, 500);
  };

  useEffect(() => {
    getUrls();
  
    const interval = setInterval(() => {
      getUrls();
    }, 30000);
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">

      {/* Navbar */}
      <header className="navbar">
        <div className="logo">URL Shortener</div>

        <div className="nav-link">
          Dashboard
        </div>
      </header>

      <main className="container">

        {/* Hero */}
        <section className="hero">
          <h1>Shorten a long URL</h1>

          <p>
            Enter a long URL and get a short, shareable link in seconds.
          </p>

          {/* URL Input */}
          <div className="shortener-box">

            <input
              type="text"
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  shortenUrl();
                }
              }}
            />

            <button
              onClick={shortenUrl}
              disabled={loading}
            >
              {loading ? "Shortening..." : "Shorten URL"}
            </button>

          </div>

          {/* Error */}
          {error && (
            <p className="error">
              {error}
            </p>
          )}

        </section>

        {/* Links */}
        <section className="links-section">

          <h2>Your Links</h2>

          <div className="links-card">

            {/* Table Header */}
            <div className="table-header">
              <div>Short Link</div>
              <div>Original URL</div>
              <div>Clicks</div>
              <div>Expires</div>
              <div>Actions</div>
            </div>

            {/* Empty State */}
            {urls.length === 0 && (
              <div className="empty-state">

                <div className="empty-icon">
                  ↗
                </div>

                <h3>No links yet.</h3>

                <p>
                  Create your first shortened link above.
                </p>

              </div>
            )}

            {/* URL Rows */}
            {urls.map((item) => (
              <div
                className="table-row"
                key={item._id}
              >

                <div className="short-link-cell">
                  <button
                    className="copy-icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `http://localhost:5000/${item.shortCode}`
                      );
                    }}
                    title="Copy URL"
                    aria-label="Copy URL"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="12"
                        height="12"
                        rx="2"
                      />

                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      />
                    </svg>
                  </button>

                  <a
                    className="short-link"
                    href={`http://localhost:5000/${item.shortCode}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleShortUrlClick}
                  >
                    localhost:5000/{item.shortCode}
                  </a>
                </div>

                <div className="original-url">
                  {item.originalUrl}
                </div>

                <div className="clicks">
                  {item.clicks}
                </div>

                <div className="expiration">
                  {new Date(item.expiresAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <div>
                  <button
                    className="delete-button"
                    onClick={() => deleteUrl(item._id)}
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;