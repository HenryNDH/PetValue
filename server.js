const http = require("http");
const url = require("url");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schema and model
const Schema = mongoose.Schema;
const productSchema = new Schema({
  name: String,
  expiryDate: Date,
  quantity: Number,
});
const Product = mongoose.model("products", productSchema);

// Create HTTP server
const server = http.createServer((req, res) => {
  cors()(req, res, async () => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
    });

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
          res.end("Welcome to the PetValu Expiry Tracker API.");
        }
        break;

    case "PUT":
        if (pathname === "/products") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                const updatedProduct = await Product.findByIdAndUpdate(data.id, data, { new: true });
                res.end(JSON.stringify({ message: "Product updated successfully", product: updatedProduct }));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Error updating product" }));
            }
            });
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Invalid endpoint for PUT request" }));
        }
        break;

      case "POST":
        if (pathname === "/products") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              const newProduct = new Product(data);
              await newProduct.save();
              res.end(JSON.stringify({ message: "Product added successfully" }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Error saving product" }));
            }
          });
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Invalid endpoint for POST request" }));
        }
        break;

      case "DELETE":
        if (pathname === "/products") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              const result = await Product.deleteOne({ _id: data.id });
              res.end(JSON.stringify({ message: "Product deleted", deletedCount: result.deletedCount }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Error deleting product" }));
            }
          });
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
