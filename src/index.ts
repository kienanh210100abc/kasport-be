import express, { Request, Response } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { log } from "node:console";

// Load biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Cho phép frontend từ bất kỳ domain nào (hoặc chỉ định cụ thể)
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON body

// Tạo connection pool với MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL config cho PlanetScale hoặc production databases
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});

// Test connection
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Kết nối MySQL thành công!");
    console.log("host:", process.env.DB_HOST);
    console.log("user:", process.env.DB_USER);
    console.log("database:", process.env.DB_NAME);
    console.log("password", process.env.DB_PASSWORD);

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

//API detail
app.get("/api/products/:id", async (req: Request, res: Response) => {
  const productId = req.params.id;
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy product" });
    }

    const product = rows[0];

    // Lấy sizes và colors
    const [sizes] = await pool.query(
      "SELECT size, stock FROM product_sizes WHERE product_id = ?",
      [productId]
    );
    const [colors] = await pool.query(
      "SELECT color FROM product_colors WHERE product_id = ?",
      [productId]
    );

    res.json({
      ...product,
      sizes: sizes,
      colors: (colors as any[]).map((c) => c.color),
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Lỗi server khi lấy chi tiết product" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/products`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
