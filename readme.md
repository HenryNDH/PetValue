# **Expiry Tracker API**

## 📌 **Project Overview**
The **Expiry Tracker** is a backend API built for **PetValu** to manage product expiration efficiently. It helps track inventory, send expiration alerts, and streamline product data management.

---

## 🚀 **Features**
- **View Products** → Retrieve product details like name, expiry date, and quantity.  
- **Add Products** → Add new products to the inventory.  
- **Update Products** → Modify existing product details.  
- **Delete Products** → Remove expired or unwanted products.  
- **Expiration Alerts** → Notify store managers about upcoming product expirations.  

---

## 🛠 **Tech Stack**
### **Frontend**
- **[ReactJS](https://react.dev/):** For building reusable and interactive UI components.  
- **[NextJS](https://nextjs.org/):** Enhances React with server-side rendering and static site generation for better performance.  

### **Backend**
- **[NodeJS](https://nodejs.org/en):** Executes JavaScript on the server, ensuring fast and scalable services.  
- **[MongoDB](https://www.mongodb.com/products/platform/atlas-database):** A NoSQL database to manage dynamic and flexible data structures.  

### **Development Tools**
- **[Visual Studio Code](https://code.visualstudio.com/):** The IDE for writing, testing, and debugging code.  
- **[Thunder Client](https://www.thunderclient.com/):** A lightweight API client for testing HTTP requests directly in VS Code.  
- **[GitHub](https://github.com/):** For version control and team collaboration.  

---

## 📺 **Installation & Setup**

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/HenryNDH/expiry-tracker.git
cd expiry-tracker
```

### **2️⃣ Install Dependencies**
```bash
npm install
```

### **3️⃣ Set Up Environment Variables**
Create a `.env` file in the project root:
```
MONGODB_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
PORT=8080
```

### **4️⃣ Start the Server**
```bash
npm start
```
The server will run at:
```
http://localhost:8080
```

---

## 💚 **API Endpoints**

### **1️⃣ Get All Products**
- **Method:** `GET`  
- **Endpoint:** `/products`  
- **Description:** Fetch all products from the database.  
- **Response:**
```json
[
  {
    "_id": "67d1f37ebd92c803b0f0c0f2",
    "name": "Acana Indoor Cat Food",
    "type": ["Cat Food", "Dry Food"],
    "quantity": 5,
    "expiry": "2026-01",
    "itemNo": "G6233007",
    "urlImage": "https://example.com/image.png"
  }
]
```

---

### **2️⃣ Get Product by ID**
- **Method:** `GET`  
- **Endpoint:** `/products/:id`  
- **Description:** Fetch a specific product using its unique ID.  
- **Example Request:**
```
http://localhost:8080/products/67d1fee084dbf091f28d0e72
```
- **Response:**
```json
{
  "_id": "67d1fee084dbf091f28d0e72",
  "name": "Royal Canin Dog Food",
  "type": ["Dog Food", "Wet Food"],
  "quantity": 10,
  "expiry": "2025-12",
  "itemNo": "D4522011",
  "urlImage": "https://example.com/dog-food.png"
}
```

---

### **3️⃣ Add a New Product**
- **Method:** `POST`  
- **Endpoint:** `/products`  
- **Description:** Add a new product to the database.  
- **Request Body:**
```json
{
  "name": "Royal Canin Dog Food",
  "type": ["Dog Food", "Wet Food"],
  "quantity": 10,
  "expiry": "2025-12",
  "itemNo": "D4522011",
  "urlImage": "https://example.com/dog-food.png"
}
```
- **Response:**
```json
{
  "message": "Product added successfully"
}
```

---

### **4️⃣ Update a Product**
- **Method:** `PUT`  
- **Endpoint:** `/products`  
- **Description:** Update an existing product's details.  
- **Request Body:**
```json
{
  "id": "67d1f37ebd92c803b0f0c0f2",
  "name": "Updated Cat Food",
  "type": ["Cat Food", "Dry Food"],
  "quantity": 8,
  "expiry": "2027-06",
  "itemNo": "G6233008",
  "urlImage": "https://example.com/updated-cat-food.png"
}
```
- **Response:**
```json
{
  "message": "Product updated successfully",
  "product": {
    "_id": "67d1f37ebd92c803b0f0c0f2",
    "name": "Updated Cat Food",
    "type": ["Cat Food", "Dry Food"],
    "quantity": 8,
    "expiry": "2027-06",
    "itemNo": "G6233008",
    "urlImage": "https://example.com/updated-cat-food.png"
  }
}
```

---

### **5️⃣ Delete a Product**
- **Method:** `DELETE`  
- **Endpoint:** `/products`  
- **Description:** Remove a product from the database.  
- **Request Body:**
```json
{
  "id": "67d1f37ebd92c803b0f0c0f2"
}
```
- **Response:**
```json
{
  "message": "Product deleted",
  "deletedCount": 1
}
```

---

## 🔥 **Future Enhancements**
- **User Authentication (JWT)** → Secure access to endpoints.  
- **GraphQL API Support** → Add flexibility to data retrieval.  
- **Mobile App Integration** → Allow store managers to check expiries on the go.  

---

## 👨‍💻 **Contributors**
| Name                | Role            | GitHub                                           | Email                       |
|--------------------|----------------|--------------------------------------------------|-----------------------------|
| **Franz Luiz Sy**   | Project Manager | [GitHub](https://github.com/iPinguu)             | fsy1@myseneca.ca            |
| **Austin Ngo**      | Developer       | [GitHub](https://github.com/thienanngo11122003)  | ttango@myseneca.ca          |
| **Nguyen Duy Hoang**| Developer       | [GitHub](https://github.com/HenryNDH)            | hdnguyen12@myseneca.ca      |
| **Phuong Ngan Huynh** | Developer     | [GitHub](https://github.com/hphngan)             | phuynh22@myseneca.ca        |
