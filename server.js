// server.js
const http = require("http");
const url = require("url");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
require("dotenv").config();

/* -------------------- Auth toggle for writes -------------------- */
// Set REQUIRE_AUTH=false in .env to bypass auth for POST/PUT/DELETE (local testing)
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== "false";
console.log("Require auth for writes:", REQUIRE_AUTH);

/* -------------------- Firebase Admin Init (portable) -------------------- */
// Tries FIREBASE_SERVICE_ACCOUNT (raw JSON) first; else applicationDefault()
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error("[Firebase] FIREBASE_SERVICE_ACCOUNT invalid JSON:", e.message);
  }
}

try {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
    });
    console.log("[Firebase] Initialized with service account from env.");
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("[Firebase] Initialized with applicationDefault() credentials.");
  }
} catch (e) {
  console.error("[Firebase] Initialization failed:", e);
}

/* -------------------- Helper: verify Firebase token -------------------- */
async function verifyToken(req) {
  const authHeader = req.headers["authorization"];
  // Debug logs help diagnose header/verification problems
  console.log("🔍 Incoming Authorization header:", authHeader || "(none)");

  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;

  const token = parts[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("✅ Token verified for UID:", decoded.uid);
    return decoded; // contains uid, email, etc.
  } catch (err) {
    console.error("❌ Token verification failed:", err.code || "", err.message);
    return null;
  }
}

/* -------------------- DB -------------------- */
mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const Schema = mongoose.Schema;

const productSchema = new Schema(
    {
      name: String,
      type: [String],
      quantity: Number,
      expiry: String,
      urlImage: String,
      storeID: String,
    },
    { versionKey: false }
);

// NOTE: productID is a STRING (NOT ObjectId) per your requirement
const saleSchema = new Schema(
    {
      productID: String,
      qty: Number,
      unitPrice: Number,
      soldAt: Date,
    },
    { versionKey: false }
);

const stockEventSchema = new Schema(
    {
      productID: String,
      event: String, // "OOS" | "RESTOCK"
      at: Date,
      qtyAfter: Number,
    },
    { versionKey: false }
);

const expiryCheckSchema = new Schema(
    {
      productID: String,
      checkedAt: Date,
      daysUntilExpiry: Number,
      onHandQty: Number,
      expiryDate: Date,
    },
    { versionKey: false }
);

const Product     = mongoose.model("Product", productSchema, "products");
const Sale        = mongoose.model("Sale", saleSchema, "sales");
const StockEvent  = mongoose.model("StockEvent", stockEventSchema, "stockEvents");
const ExpiryCheck = mongoose.model("ExpiryCheck", expiryCheckSchema, "expiryChecks");

/* -------------------- Utils -------------------- */
function sendJSON(res, status, data) {
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

function buildDateFromWindow(windowStr) {
  if (!windowStr) return null;
  const now = new Date();
  const start = new Date(now);
  const map = { "6m": 6, "3m": 3, "1m": 1 };
  if (windowStr === "3w") {
    start.setDate(now.getDate() - 21);
    return start;
  }
  if (map[windowStr]) {
    start.setMonth(now.getMonth() - map[windowStr]);
    return start;
  }
  return null;
}

function parseFilters(query) {
  const filter = {};
  if (query.productID) filter.productID = String(query.productID);

  // prefer ?since=ISO; otherwise support ?window=
  const sinceWindow = buildDateFromWindow(query.window);
  const since =
      query.since ? new Date(query.since) : sinceWindow ? sinceWindow : null;

  const limit = query.limit ? Math.min(parseInt(query.limit, 10) || 50, 500) : 200;

  return { filter, since, limit };
}

/* -------------------- HTTP Server -------------------- */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const pathSegments = pathname.split("/").filter(Boolean);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    if (body) {
      try {
        body = JSON.parse(body);
      } catch (error) {
        return sendJSON(res, 400, { error: "Invalid JSON format" });
      }
    }

    // 🔐 Auth for mutations (bypass if REQUIRE_AUTH=false)
    let user = null;
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      if (REQUIRE_AUTH) {
        user = await verifyToken(req);
        if (!user) return sendJSON(res, 401, { error: "Unauthorized: Missing or invalid token" });
      } else {
        console.log("⚠️  Auth bypassed for write (REQUIRE_AUTH=false).");
      }
    }

    try {
      // ------------- GET -------------
      if (req.method === "GET") {
        // Health/welcome
        if (pathname === "/") {
          return sendJSON(res, 200, {
            message: "Welcome to the PetValu Expiry Tracker API.",
          });
        }

        // Products
        if (pathname === "/products") {
          const products = await Product.find();
          return sendJSON(res, 200, products);
        }
        if (pathSegments[0] === "products" && pathSegments.length === 2) {
          const product = await Product.findById(pathSegments[1]);
          if (!product) return sendJSON(res, 404, { error: "Product not found" });
          return sendJSON(res, 200, product);
        }

        // Sales
        if (pathname === "/sales") {
          const { filter, since, limit } = parseFilters(query);
          const timeFilter = since ? { soldAt: { $gte: since } } : {};
          const docs = await Sale.find({ ...filter, ...timeFilter })
              .sort({ soldAt: -1 })
              .limit(limit);
          return sendJSON(res, 200, docs);
        }
        if (pathSegments[0] === "sales" && pathSegments.length === 2) {
          const sale = await Sale.findById(pathSegments[1]);
          if (!sale) return sendJSON(res, 404, { error: "Sale not found" });
          return sendJSON(res, 200, sale);
        }

        // Stock Events
        if (pathname === "/stockevents") {
          const { filter, since, limit } = parseFilters(query);
          const timeFilter = since ? { at: { $gte: since } } : {};
          const docs = await StockEvent.find({ ...filter, ...timeFilter })
              .sort({ at: -1 })
              .limit(limit);
          return sendJSON(res, 200, docs);
        }
        if (pathSegments[0] === "stockevents" && pathSegments.length === 2) {
          const doc = await StockEvent.findById(pathSegments[1]);
          if (!doc) return sendJSON(res, 404, { error: "Stock event not found" });
          return sendJSON(res, 200, doc);
        }

        // Expiry Checks
        if (pathname === "/expirychecks") {
          const { filter, since, limit } = parseFilters(query);
          const timeFilter = since ? { checkedAt: { $gte: since } } : {};
          const docs = await ExpiryCheck.find({ ...filter, ...timeFilter })
              .sort({ checkedAt: -1 })
              .limit(limit);
          return sendJSON(res, 200, docs);
        }
        if (pathSegments[0] === "expirychecks" && pathSegments.length === 2) {
          const doc = await ExpiryCheck.findById(pathSegments[1]);
          if (!doc) return sendJSON(res, 404, { error: "Expiry check not found" });
          return sendJSON(res, 200, doc);
        }

        return sendJSON(res, 404, { error: "Not found" });
      }

      // ------------- POST -------------
      if (req.method === "POST") {
        if (pathname === "/products") {
          const newProduct = new Product({ ...body, storeID: body.storeID });
          await newProduct.save();
          return sendJSON(res, 201, { message: "Product added successfully", product: newProduct });
        }
        return sendJSON(res, 404, { error: "Invalid endpoint for POST request" });
      }

      // ------------- PUT -------------
      if (req.method === "PUT") {
        if (pathSegments[0] === "products" && pathSegments.length === 2) {
          const id = pathSegments[1];
          const updatedProduct = await Product.findByIdAndUpdate(id, body, { new: true });
          if (!updatedProduct) {
            return sendJSON(res, 404, { error: "Product not found" });
          }
          return sendJSON(res, 200, { message: "Product updated successfully", product: updatedProduct });
        }
        return sendJSON(res, 404, { error: "Invalid endpoint for PUT request" });
      }

      // ------------- DELETE -------------
      if (req.method === "DELETE") {
        if (pathSegments[0] === "products" && pathSegments.length === 2) {
          const result = await Product.deleteOne({ _id: pathSegments[1] });
          if (result.deletedCount === 0) return sendJSON(res, 404, { error: "Product not found" });
          return sendJSON(res, 200, { message: "Product deleted", deletedCount: result.deletedCount });
        }
        return sendJSON(res, 404, { error: "Invalid endpoint for DELETE request" });
      }

      // Fallback
      return sendJSON(res, 404, { error: "Invalid request method" });
    } catch (error) {
      console.error(error);
      return sendJSON(res, 500, { error: "Server error", detail: error.message });
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
