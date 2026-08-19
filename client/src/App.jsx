import { useState, useEffect } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState([]);


  const shortenUrl = async () => {
    if (!url) {
      setError("Please enter a URL");
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
        throw new Error(data.message || "Something went wrong");
      }
  
      setShortUrl(data.shortUrl);
      await getUrls();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const getUrls = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/urls");
  
      const data = await response.json();
  
      setUrls(data);
    } catch (error) {
      console.error("Failed to fetch URLs:", error);
    }
  };


  const handleShortUrlClick = () => {
    setTimeout(() => {
      getUrls();
    }, 500);
  };


  useEffect(() => {
    getUrls();
  }, []);


  return (
    <div>
      <h1>URL Shortener</h1>

      <input
        type="text"
        placeholder="Enter your URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button onClick={shortenUrl} disabled={loading}>
        {loading ? "Shortening..." : "Shorten URL"}
      </button>
      {error && <p>{error}</p>}
      {shortUrl && (
        <p>
          Your shortened URL:{" "}
          <a href={shortUrl} target="_blank">
            {shortUrl}
          </a>
        </p>
      )}
      <h2>URL History</h2>

      {urls.map((item) => (
        <div key={item._id}>
          <p>
            Original URL: {item.originalUrl}
          </p>

          <p>
            Short URL:{" "}
            <a
              href={`http://localhost:5000/${item.shortCode}`}
              onClick={() => handleShortUrlClick(item.shortCode)}
              target="_blank"
              rel="noreferrer"
            >
              http://localhost:5000/{item.shortCode}
            </a>
          </p>

          <p>
            Clicks: {item.clicks}
          </p>

          <hr />
        </div>
      ))}
    </div>
  );
}

export default App;