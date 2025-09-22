const http = require("http");
const url = require("url");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
require("dotenv").config();

// --- 🔑 Firebase Admin Setup ---
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // Or use a service account JSON:
  // credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

// Helper to verify Firebase token
async function verifyToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1]; // Expecting "Bearer <token>"
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded; // contains uid, email, etc.
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
}

// --- MongoDB Setup ---
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const Schema = mongoose.Schema;
const productSchema = new Schema({
  name: String,
  type: [String],
  quantity: Number,
  expiry: String,
  urlImage: String,
  storeID: String
}, {
  versionKey: false
});
const Product = mongoose.model("products", productSchema);

// --- HTTP Server ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const pathSegments = pathname.split('/').filter(Boolean);

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      if (body) body = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Invalid JSON format" }));
    }

    // --- Authentication Check for protected routes ---
    let user = null;
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      user = await verifyToken(req);
      if (!user) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: "Unauthorized: Missing or invalid token" }));
      }
    }

    switch (req.method) {
      case "GET":
        if (pathname === "/products") {
          try {
            const products = await Product.find();
            res.end(JSON.stringify(products));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error fetching products" }));
          }
        } else if (pathSegments[0] === "products" && pathSegments.length === 2) {
          try {
            const product = await Product.findById(pathSegments[1]);
            if (!product) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: "Product not found" }));
            }
            res.end(JSON.stringify(product));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error fetching product by ID" }));
          }
        } else {
          res.end(JSON.stringify({ message: "Welcome to the PetValu Expiry Tracker API." }));
        }
        break;

      case "POST":
        if (pathname === "/products") {
          try {
            const newProduct = new Product({
              ...body,
              storeID: user.uid, // link product to logged-in user
            });
            await newProduct.save();
            res.end(JSON.stringify({ message: "Product added successfully", product: newProduct }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error saving product" }));
          }
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Invalid endpoint for POST request" }));
        }
        break;

      case "PUT":
        if (pathSegments[0] === "products" && pathSegments.length === 2) {
          try {
            const id = pathSegments[1];
            const updatedProduct = await Product.findByIdAndUpdate(id, body, { new: true });
            if (!updatedProduct) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: "Product not found" }));
            }
            res.end(JSON.stringify({ message: "Product updated successfully", product: updatedProduct }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error updating product" }));
          }
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Invalid endpoint for PUT request" }));
        }
        break;

      case "DELETE":
        if (pathSegments[0] === "products" && pathSegments.length === 2) {
          try {
            const id = pathSegments[1];
            const result = await Product.deleteOne({ _id: id });
            if (result.deletedCount === 0) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: "Product not found" }));
            }
            res.end(JSON.stringify({ message: "Product deleted", deletedCount: result.deletedCount }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error deleting product" }));
          }
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Invalid endpoint for DELETE request" }));
        }
        break;

      default:
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Invalid request method" }));
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
