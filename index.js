const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main API: /classplus/play
// Usage: /classplus/play?contentId=...&token=OPTIONAL
app.get("/classplus/play", async (req, res) => {
  try {
    const { contentId, token: tokenFromQuery } = req.query;

    if (!contentId) {
      return res.json({ status: "error", message: "Missing contentId" });
    }

    // Prefer query token, else env var
    const token =
      tokenFromQuery ||
      process.env.CLASSPLUS_TOKEN; // set this in Render dashboard

    if (!token) {
      return res.json({
        status: "error",
        message: "Missing token (provide ?token=... or set CLASSPLUS_TOKEN env)"
      });
    }

    // Call official Classplus API
    const url =
      "https://api.classplusapp.com/cams/uploader/video/jw-signed-url";

    const r = await axios.get(url, {
      params: { contentId },
      headers: {
        "X-Access-Token": token,
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
      }
    });

    const d = r.data;

    if (!d.success || !d.drmUrls) {
      return res.json({
        status: "error",
        message: "Invalid Classplus response",
        raw: d
      });
    }

    return res.json({
      status: "ok",
      drmUrls: {
        manifestUrl: d.drmUrls.manifestUrl,
        licenseUrl: d.drmUrls.licenseUrl
      }
    });
  } catch (err) {
    console.error("Error in /classplus/play:", err.message);
    return res.json({
      status: "error",
      message: err.message
    });
  }
});

// Serve the player page at /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
