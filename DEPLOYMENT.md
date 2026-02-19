# HomeNote 项目部署文档 (Ubuntu 22.04)

## 前置条件

- Ubuntu 22.04 服务器
- 已预装 Docker 和 Docker Compose
- 已预装 Nginx
- 服务器上已有其他运行中的项目

## 部署步骤

### 1. 上传项目文件

将项目文件上传到服务器的合适位置，例如：
```bash
/opt/homenote
```

### 2. 准备项目目录和权限

```bash
cd /opt/homenote

# 创建数据和上传目录（如果不存在）
mkdir -p data uploads

# 设置合适的权限
chmod 755 .
chmod 755 data uploads
```

### 3. 配置 Nginx 反向代理

#### 3.1 复制 Nginx 配置文件

```bash
# 备份现有配置（如果需要）
sudo cp nginx/homenote.conf /etc/nginx/sites-available/homenote

# 创建符号链接到 sites-enabled
sudo ln -sf /etc/nginx/sites-available/homenote /etc/nginx/sites-enabled/
```

#### 3.2 修改配置（可选）

编辑 `/etc/nginx/sites-available/homenote`，将 `server_name` 修改为您的实际域名或服务器IP：

```nginx
server_name your-domain.com;  # 或您的服务器IP
```

#### 3.3 测试并重载 Nginx 配置

```bash
# 测试配置文件语法
sudo nginx -t

# 重载 Nginx 配置（不影响现有服务）
sudo systemctl reload nginx
```

### 4. 构建并启动 Docker 容器

```bash
cd /opt/homenote

# 构建并启动容器（后台运行）
sudo docker-compose up -d --build
```

### 5. 验证部署

#### 5.1 检查容器状态

```bash
sudo docker-compose ps
```

您应该看到 `homenote` 容器状态为 `Up`。

#### 5.2 查看容器日志

```bash
sudo docker-compose logs -f homenote
```

按 `Ctrl+C` 退出日志查看。

#### 5.3 访问项目

打开浏览器，访问：
- 如果配置了域名：`http://your-domain.com`
- 如果使用服务器IP：`http://your-server-ip`

## 项目操作指南

### 启动项目

```bash
cd /opt/homenote
sudo docker-compose up -d
```

### 停止项目

```bash
cd /opt/homenote
sudo docker-compose stop
```

### 重启项目

```bash
cd /opt/homenote
sudo docker-compose restart
```

### 查看项目状态

```bash
cd /opt/homenote
sudo docker-compose ps
```

### 查看项目日志

```bash
cd /opt/homenote
# 查看最新日志
sudo docker-compose logs homenote

# 实时查看日志
sudo docker-compose logs -f homenote
```

### 更新项目

```bash
cd /opt/homenote

# 拉取最新代码（如果使用 git）
git pull origin main

# 重新构建并启动
sudo docker-compose up -d --build
```

## 数据持久化

- 数据库文件存储在：`/opt/homenote/data/`
- 上传的图片存储在：`/opt/homenote/uploads/`

**重要提示：** 请定期备份这两个目录，以防止数据丢失。

## 安全最佳实践

1. **端口管理**：容器端口仅绑定到 `127.0.0.1`，不直接暴露到公网
2. **网络隔离**：项目使用独立的 Docker 网络，与其他项目隔离
3. **日志管理**：配置了日志轮转，防止日志文件过大
4. **健康检查**：容器配置了健康检查，自动监控服务状态
5. **权限设置**：目录权限设置为 755，确保安全

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
sudo docker-compose logs homenote
```

### Nginx 502 错误

检查容器是否正常运行：
```bash
sudo docker-compose ps
```

### 数据丢失

检查 `data` 和 `uploads` 目录的权限和内容：
```bash
ls -la /opt/homenote/data/
ls -la /opt/homenote/uploads/
```

## 与现有项目共存

本部署方案确保：
- 不修改现有 Nginx 配置（只需添加新的站点配置）
- 使用独立的 Docker 网络，不影响其他容器
- 端口仅绑定到本地，不与其他项目冲突
- 数据存储在独立目录，与其他项目隔离
