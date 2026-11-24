import { useState } from "react";
import "./WikiChecker.css";

function RevisionCard({ revision }) {
  const user = revision.user || "Hidden user";

  return (
    <div className="card">
      <div className="avatar">{user.charAt(0).toUpperCase()}</div>
      <div className="user">{user}</div>
      <div className="date">{new Date(revision.timestamp).toLocaleString()}</div>
      {revision.comment && <div className="comment">{revision.comment}</div>}
    </div>
  );
}

// the main component exported to App.jsx
export default function WikiChecker() {
  const [article, setArticle] = useState("");
  const [status, setStatus] = useState({ message: "", isError: false });
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);


  //runs when the user presses enter
  async function fetchRevisions() {
    const title = article.trim();
    setRevisions([]);

    //If user input is empty, prints message and stops code early
    if (title === "") {
      setStatus({ message: "Enter an article title to search.", isError: true });
      return;
    }

    //Tells the user that revisions are loading
    setStatus({ message: "Loading revisions...", isError: false });
    //Sets to loading so the search butto is disabled
    setLoading(true);

    // API call
    const url =
      "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions" +
      "&titles=" + encodeURIComponent(title) +
      "&rvprop=timestamp|user|comment&rvlimit=30&redirects&origin=*";

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Wikipedia returned an error (status " + response.status + ").");
      }

      const data = await response.json();
      const page = Object.values(data.query.pages)[0];

      if ("missing" in page) {
        setStatus({
          message: `No Wikipedia page found for "${title}". Check the spelling and try again.`,
          isError: true,
        });
        return;
      }

      const revs = page.revisions || [];
      if (revs.length === 0) {
        setStatus({ message: "That page has no revisions to show.", isError: true });
        return;
      }

      const redirect = data.query.redirects && data.query.redirects[0];
      const redirectNote = redirect ? ` (redirected to ${redirect.to})` : "";
      setStatus({
        message: `Showing ${revs.length} most recent revisions of ${page.title}${redirectNote}`,
        isError: false,
      });
      setRevisions(revs);
    } catch (error) {
      setStatus({ message: "Could not load revisions: " + error.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") fetchRevisions();
  }

  return (
    <>
      <header className="site-header">
        <h1>Wikipedia Revision Checker</h1>
        <p>See who edited a Wikipedia article most recently.</p>
      </header>

      <main>
        <div className="controls">
          <label htmlFor="article-input">Article title</label>
          <input
            type="text"
            id="article-input"
            value={article}
            placeholder="e.g. John Cena"
            onChange={(e) => setArticle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" onClick={fetchRevisions} disabled={loading}>
            Get revisions
          </button>
        </div>

        <div
          className={"status" + (status.isError ? " error" : "")}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </div>

        <div className="grid">
          {revisions.map((rev, i) => (
            <RevisionCard key={rev.timestamp + i} revision={rev} />
          ))}
        </div>
      </main>
    </>
  );
}