# Deploy lên Render + PlanetScale (Free Forever)

## Phần 1: Setup PlanetScale MySQL (Free Database)

### Bước 1: Tạo Database trên PlanetScale

1. Vào https://planetscale.com và đăng ký (dùng GitHub)
2. Click **"Create a database"**
3. Nhập:
   - **Name**: `kasport-db`
   - **Region**: Chọn gần nhất (Singapore hoặc Tokyo)
   - **Plan**: Free (mặc định)
4. Click **"Create database"**

### Bước 2: Lấy Connection String

1. Sau khi database được tạo, click vào nó
2. Click **"Connect"** button
3. Chọn **"Node.js"** hoặc **"General"**
4. Copy thông tin:
   ```
   Host: aws.connect.psdb.cloud
   Username: xxxxxxxxx
   Password: pscale_pw_xxxxxxxxx
   Database: kasport-db
   ```

### Bước 3: Import Database Schema

1. Click tab **"Console"** trong PlanetScale dashboard
2. Hoặc dùng MySQL Workbench:
   - **Connection Name**: PlanetScale KaSport
   - **Hostname**: `aws.connect.psdb.cloud`
   - **Port**: `3306`
   - **Username**: (từ PlanetScale)
   - **Password**: (từ PlanetScale)
   - **SSL**: Required (Use SSL: Require)
3. Copy schema từ local database của bạn và chạy trên PlanetScale

## Phần 2: Deploy Backend lên Render.com

### Bước 1: Tạo Web Service trên Render

1. Vào https://render.com và đăng ký (dùng GitHub)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `kasport-be`
4. Cấu hình:
   - **Name**: `kasport-api`
   - **Environment**: `Node`
   - **Region**: Singapore (gần nhất)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

### Bước 2: Thêm Environment Variables

Trong Render dashboard → Service settings → **Environment**, thêm:

```
PORT = 5000
DB_HOST = aws.connect.psdb.cloud
DB_PORT = 3306
DB_USER = [username từ PlanetScale]
DB_PASSWORD = [password từ PlanetScale]
DB_NAME = kasport-db
FRONTEND_URL = *
```

**Important**: PlanetScale yêu cầu SSL connection, cần update code.

### Bước 3: Click **"Create Web Service"**

Render sẽ tự động:

- Clone repo từ GitHub
- Build project
- Deploy
- Tạo URL: `https://kasport-api.onrender.com`

## Phần 3: Update Code để hỗ trợ PlanetScale SSL

Code hiện tại của bạn cần thêm SSL config cho PlanetScale.

## Phần 4: Test API

Sau khi deploy xong, test:

```bash
curl https://kasport-api.onrender.com/health
```

## So sánh Free Tiers

| Feature   | PlanetScale               | Render                     |
| --------- | ------------------------- | -------------------------- |
| Free tier | Mãi mãi                   | Mãi mãi                    |
| Database  | 5GB storage               | N/A                        |
| Bandwidth | 1 billion row reads/month | 100GB/month                |
| Sleep     | Không ngủ                 | Ngủ sau 15 phút không dùng |
| Wake time | N/A                       | ~30 giây                   |

## Lưu ý quan trọng

### Render Free tier limitations:

- ⚠️ Service ngủ sau **15 phút không có request**
- ⚠️ Mất ~30 giây để wake up
- ✅ Không giới hạn số lượng deploys
- ✅ Auto deploy khi push code lên GitHub

### Giải pháp cho vấn đề Sleep:

1. Dùng cron job để ping API mỗi 10 phút (UptimeRobot free)
2. Hoặc chấp nhận loading lần đầu hơi lâu

## MySQL Workbench với PlanetScale

Để connect PlanetScale từ MySQL Workbench:

1. **Connection Name**: `PlanetScale KaSport Production`
2. **Connection Method**: Standard (TCP/IP)
3. **Hostname**: `aws.connect.psdb.cloud`
4. **Port**: `3306`
5. **Username**: (từ PlanetScale dashboard)
6. **Password**: Store in Vault → nhập password từ PlanetScale
7. **SSL Tab**:
   - **Use SSL**: Require
   - **SSL CA File**: Không cần (PlanetScale tự handle)

## Troubleshooting

### Nếu không connect được PlanetScale:

1. Đảm bảo SSL được enable trong connection
2. Check username/password đúng chưa
3. PlanetScale có thể yêu cầu whitelist IP (check dashboard)

### Nếu Render deploy fail:

1. Check logs trong Render dashboard
2. Đảm bảo `npm run build` chạy được local
3. Check environment variables đã set đúng chưa
