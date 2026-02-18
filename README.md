# 家庭便签系统

面向家庭私密使用的便签系统，支持角色管理、公共便签、私密日记等功能。

## 功能特性

- 角色管理（父母/儿女）
- 公共便签（CRUD）
- 私密日记
- 便签搜索
- 图片上传
- 文本格式化（加粗、下划线、标题等）
- 简洁大字体界面，适合老人使用

## 技术栈

- 后端：Node.js + Express
- 数据库：SQLite
- 前端：原生HTML/CSS/JavaScript
- 部署：Docker

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动服务：
```bash
npm start
```

3. 访问 http://localhost:3000

## Docker 部署

### 使用 docker-compose（推荐）

```bash
docker-compose up -d
```

### 单独构建和运行

```bash
docker build -t homenote .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data -v $(pwd)/uploads:/app/uploads --name homenote homenote
```

## Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 数据持久化

数据存储在 `data/` 目录，上传的图片存储在 `uploads/` 目录。
