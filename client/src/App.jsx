import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
      {shortUrl && (
        <p>
          Your shortened URL:{" "}
          <a href={shortUrl} target="_blank">
            {shortUrl}
          </a>
        </p>
      )}
    </div>
  );
}

export default App;