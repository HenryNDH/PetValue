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
  itemNo: String,
  urlImage: String, // New field for product image URL
});
const Product = mongoose.model("products", productSchema);

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

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
        if (pathname === "/products") {
          try {
            const updatedProduct = await Product.findByIdAndUpdate(body.id, body, { new: true });
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
        if (pathname === "/products") {
          try {
            const result = await Product.deleteOne({ _id: body.id });
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
