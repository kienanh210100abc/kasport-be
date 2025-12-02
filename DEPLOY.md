# Deploy lên Railway

## Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Bước 2: Deploy trên Railway

### A. Tạo service mới cho Backend

1. Vào https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repository `kasport-be`
4. Railway sẽ tự động detect và deploy

### B. Cấu hình Environment Variables

Trong Railway dashboard → Backend service → **Variables**, thêm:

```env
PORT=5000
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD=vzKRWrWMKTvKtzmOOzwL1YOGPveNmoRN
DB_NAME=railway
FRONTEND_URL=*
```

**Lưu ý quan trọng:**

- Dùng `mysql.railway.internal` (Private Network) thay vì `nozomi.proxy.rlwy.net` để kết nối MySQL
- Private Network miễn phí và nhanh hơn
- Public proxy (`nozomi.proxy.rlwy.net:24644`) chỉ dùng cho external tools như MySQL Workbench

### C. Cấu hình Build & Start

Railway sẽ tự detect từ `package.json`:

- Build command: `npm run build`
- Start command: `npm start`

## Bước 3: Lấy URL API

Sau khi deploy xong:

1. Railway sẽ tạo domain tự động: `https://kasport-be-production.up.railway.app`
2. Copy URL này để FE gọi API

## Bước 4: Test API

```bash
curl https://kasport-be-production.up.railway.app/api/health
```

## Bước 5: Cấu hình CORS cho Frontend

Nếu muốn chỉ cho phép domain FE cụ thể:

1. Vào Railway → Variables
2. Sửa `FRONTEND_URL=https://your-frontend-domain.com`
3. Redeploy

## Local Development vs Production

### Local (Development)

```env
DB_HOST=localhost
DB_PORT=3306
DB_PASSWORD=123456
DB_NAME=kasport
```

### Production (Railway)

- Set qua Railway Dashboard Variables
- Dùng Private Network: `mysql.railway.internal`
- Không commit password lên Git

## Troubleshooting

### Nếu không kết nối được MySQL:

1. Đảm bảo MySQL và Backend ở cùng 1 project Railway
2. Dùng `mysql.railway.internal` thay vì public URL
3. Check Variables đã set đúng chưa

### Nếu FE không gọi được API:

1. Check CORS đã cấu hình đúng chưa
2. Đảm bảo Railway service đã deploy thành công
3. Check domain Railway có đúng không
