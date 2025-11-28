import express, { Request, Response } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Cho phép frontend gọi API
app.use(express.json()); // Parse JSON body

// Tạo connection pool với MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Kết nối MySQL thành công!");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MySQL:", err);
  });

// ==================== API ROUTES ====================

// Health check - Test xem server có chạy không
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "Server đang chạy!",
    timestamp: new Date().toISOString(),
  });
});

// GET: Lấy tất cả products
app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const [products] = await pool.query("SELECT * FROM products");

    // Lấy thêm sizes và colors cho mỗi product
    const productsWithDetails = await Promise.all(
      (products as any[]).map(async (product) => {
        const [sizes] = await pool.query(
          "SELECT size, stock FROM product_sizes WHERE product_id = ?",
          [product.id]
        );
        const [colors] = await pool.query(
          "SELECT color FROM product_colors WHERE product_id = ?",
          [product.id]
        );

        return {
          ...product,
          sizes: sizes,
          colors: (colors as any[]).map((c) => c.color),
        };
      })
    );

    res.json(productsWithDetails);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Lỗi server khi lấy products" });
  }
});

// GET: Lấy product theo ID
app.get("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);

    if ((products as any[]).length === 0) {
      return res.status(404).json({ error: "Không tìm thấy product" });
    }

    const product = (products as any[])[0];

    // Lấy sizes và colors
    const [sizes] = await pool.query(
      "SELECT size, stock FROM product_sizes WHERE product_id = ?",
      [id]
    );
    const [colors] = await pool.query(
      "SELECT color FROM product_colors WHERE product_id = ?",
      [id]
    );

    res.json({
      ...product,
      sizes: sizes,
      colors: (colors as any[]).map((c) => c.color),
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET: Lấy products theo category
app.get(
  "/api/products/category/:category",
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;

      const [products] = await pool.query(
        "SELECT * FROM products WHERE category = ?",
        [category]
      );

      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  }
);

// POST: Tạo product mới
app.post("/api/products", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      id,
      name,
      category,
      subCategory,
      price,
      description,
      brand,
      image,
      inStock,
      sizes,
      colors,
    } = req.body;

    // Insert product
    await connection.query(
      "INSERT INTO products (id, name, category, subCategory, price, description, brand, image, inStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        name,
        category,
        subCategory,
        price,
        description,
        brand,
        image,
        inStock,
      ]
    );

    // Insert sizes
    if (sizes && sizes.length > 0) {
      for (const sizeData of sizes) {
        await connection.query(
          "INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)",
          [id, sizeData.size, sizeData.stock]
        );
      }
    }

    // Insert colors
    if (colors && colors.length > 0) {
      for (const color of colors) {
        await connection.query(
          "INSERT INTO product_colors (product_id, color) VALUES (?, ?)",
          [id, color]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: "Tạo product thành công!", id });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Lỗi server khi tạo product" });
  } finally {
    connection.release();
  }
});

// PUT: Update product
app.put("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      subCategory,
      price,
      description,
      brand,
      image,
      inStock,
    } = req.body;

    await pool.query(
      "UPDATE products SET name = ?, category = ?, subCategory = ?, price = ?, description = ?, brand = ?, image = ?, inStock = ? WHERE id = ?",
      [
        name,
        category,
        subCategory,
        price,
        description,
        brand,
        image,
        inStock,
        id,
      ]
    );

    res.json({ message: "Update product thành công!" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// DELETE: Xóa product
app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM products WHERE id = ?", [id]);

    res.json({ message: "Xóa product thành công!" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/products`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
