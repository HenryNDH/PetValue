const http = require("http");
const url = require("url");
const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define schema and model
const Schema = mongoose.Schema;
const productSchema = new Schema({
  name: String,
  type: [String],
  quantity: Number,
  expiry: String,
  urlImage: String,
}, {
  versionKey: false
});
const Product = mongoose.model("products", productSchema);

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const pathSegments = pathname.split('/').filter(Boolean);

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      if (body) body = JSON.parse(body); // Parse only if there is a body
    } catch (error) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Invalid JSON format" }));
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
            const newProduct = new Product(body);
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
                const id = pathSegments[1];  // Capture the ID from the URL
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
