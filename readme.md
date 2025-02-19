# Expiry Tracker API

## 📌 Project Overview
Expiry Tracker is a backend API designed to help **PetValu** manage product expiration by tracking inventory, sending expiration alerts, and providing an intuitive way to manage product data.

## 🚀 Features
- **View Products** → Retrieve product details including name, expiry date, and quantity.
- **Add Products** → Insert new products into the inventory.
- **Update Products** → Modify existing product details.
- **Delete Products** → Remove expired or unwanted products.
- **Expiration Alerts** → Notify store managers about expiring products.

---

## 🛠 Tech Stack
### Frontend:
- **[ReactJS](https://react.dev/):** A popular JavaScript library for building user interfaces. React enables developers to create reusable UI components, ensuring an interactive and responsive user experience.
- **[NextJS](https://nextjs.org/):** A React framework that provides server-side rendering and static site generation, allowing for improved performance and SEO optimization.

### Backend:
- **[NodeJS](https://nodejs.org/en):** A runtime environment that executes JavaScript on the server, ideal for building scalable and efficient backend services.
- **[MongoDB](https://www.mongodb.com/products/platform/atlas-database):** A NoSQL database that provides flexibility with its document-based structure, suitable for storing and managing data dynamically.

### Development Tools:
- **[Visual Studio Code](https://code.visualstudio.com/):** A source-code editor with built-in support for debugging, Git integration, syntax highlighting, and extensions to enhance development workflows.
- **[Postman](https://www.postman.com/):** A collaboration platform for API development, enabling developers to design, test, and document APIs efficiently.
- **[GitHub](https://github.com/):** A platform for version control and collaborative software development, allowing teams to manage code repositories and track changes effectively.

---

## 📺 Installation & Setup

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/HenryNDH/expiry-tracker.git
cd expiry-tracker
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Set Up Environment Variables**
Create a `.env` file in the project root and add:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
PORT=8080
```

### **4️⃣ Start the Server**
```sh
npm start
```
The server will run at `http://localhost:8080`.

---

## 💚 API Endpoints

### **1️⃣ Get All Products**
- **`GET /products`**
- **Response:**
```json
[
  {
    "_id": "65d7a3",
    "name": "Dog Food",
    "expiryDate": "2025-06-10",
    "quantity": 20
  }
]
```

### **2️⃣ Add a New Product**
- **`POST /products`**
- **Request Body:**
```json
{
  "name": "Cat Food",
  "expiryDate": "2025-08-15",
  "quantity": 15
}
```

### **3️⃣ Update a Product**
- **`PUT /products/:id`**
- **Request Body:**
```json
{
  "name": "Premium Cat Food",
  "quantity": 25
}
```

### **4️⃣ Delete a Product**
- **`DELETE /products/:id`**
- **Response:**
```json
{ "message": "Product deleted successfully" }
```

---

## 🔥 Future Enhancements
- **User authentication (JWT)**
- **GraphQL API support**
- **Mobile app integration**

---

## 👨‍💻 Contributors
| Name             | Role           | GitHub                               | Email                      |
|-----------------|---------------|--------------------------------------|----------------------------|
| **Franz Luiz Sy**  | Project Manager | [GitHub](https://github.com/iPinguu) | fsy1@myseneca.ca           |
| **Austin Ngo**  | Developer      | [GitHub](https://github.com/thienanngo11122003) | ttango@myseneca.ca  |
| **Nguyen Duy Hoang** | Developer      | [GitHub](https://github.com/HenryNDH) | hdnguyen12@myseneca.ca |
| **Phuong Ngan Huynh** | Developer      | [GitHub](https://github.com/hphngan) | phuynh22@myseneca.ca  |

---

