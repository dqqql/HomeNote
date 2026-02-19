# HomeNote 服务器同步更新方案

本文档详细介绍如何使用手动 Git Pull 的方式，实现从本地开发环境同步代码到服务器并更新部署。

## 方案概述

本方案采用最简单直接的方式，通过手动执行命令完成以下操作：
1. 本地代码提交并推送到 GitHub
2. 登录到服务器
3. 在服务器上拉取最新代码
4. 重新构建并启动 Docker 容器

## 前置条件

- 本地已安装 Git
- 服务器已部署 HomeNote 项目（参考 DEPLOYMENT.md）
- 服务器上项目使用 Git 管理
- 服务器上已安装 Docker 和 Docker Compose
- 能够通过 SSH 登录到服务器

## 基本工作流程

```
本地开发环境                    GitHub                    服务器
     │                              │                         │
     │  1. 修改代码                  │                         │
     │  2. git add .                │                         │
     │  3. git commit -m "msg"      │                         │
     │  4. git push origin main ────▶│                         │
     │                              │                         │
     │                              │  5. ssh 登录服务器      │
     │                              │  6. git pull origin main ◀───│
     │                              │  7. docker-compose up -d --build
     │                              │                         │
```

## 详细操作步骤

### 第一步：本地提交并推送代码

#### 1.1 查看当前修改状态

```bash
# 查看所有修改的文件
git status

# 查看具体修改内容
git diff
```

#### 1.2 添加修改的文件

```bash
# 添加所有修改的文件
git add .

# 或者只添加特定文件
git add filename.js

# 或者添加特定目录
git add public/
```

#### 1.3 提交代码

```bash
# 提交并添加说明信息
git commit -m "描述你的修改"

# 提交示例：
git commit -m "添加用户头像上传功能"
git commit -m "修复登录页面的样式问题"
git commit -m "优化数据库查询性能"
```

#### 1.4 推送到 GitHub

```bash
# 推送到 main 分支
git push origin main

# 如果使用其他分支名
git push origin master
```

**Windows PowerShell 用户：**

```powershell
# 查看状态
git status

# 添加文件
git add .

# 提交
git commit -m "你的提交信息"

# 推送
git push origin main
```

### 第二步：登录到服务器

#### 2.1 使用 SSH 登录

```bash
# 基本登录命令
ssh username@your-server-ip

# 示例：
ssh root@192.168.1.100
ssh ubuntu@your-domain.com
```

**Windows 用户：**

```powershell
# PowerShell
ssh username@your-server-ip

# 或使用 PuTTY 等工具
```

#### 2.2 登录后进入项目目录

```bash
# 进入项目目录（根据你的实际部署路径）
cd /opt/homenote

# 或其他路径
cd /var/www/homenote
cd ~/homenote
```

### 第三步：在服务器上拉取最新代码

#### 3.1 查看当前 Git 状态

```bash
# 查看当前分支和状态
git status

# 查看远程仓库信息
git remote -v

# 查看当前分支
git branch
```

#### 3.2 拉取最新代码

```bash
# 拉取最新代码
git pull origin main

# 如果使用 master 分支
git pull origin master

# 查看拉取的详细信息
git pull origin main --verbose
```

**输出示例：**

```
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
remote: Compressing objects: 100% (10/10), done.
remote: Total 15 (delta 5), reused 15 (delta 5), pack-reused 0
Unpacking objects: 100% (15/15), done.
From https://github.com/your-username/homenote
   abc1234..def5678  main       -> origin/main
Updating abc1234..def5678
Fast-forward
 public/app.js     | 10 +++++-----
 server.js         |  5 ++++-
 2 files changed, 8 insertions(+), 7 deletions(-)
```

#### 3.3 验证代码更新

```bash
# 查看最近的提交
git log --oneline -5

# 查看文件变更
git diff HEAD~1 HEAD --stat
```

### 第四步：重新构建并启动容器

#### 4.1 停止当前容器（可选）

```bash
# 停止容器
sudo docker-compose stop

# 或者直接重启（推荐）
sudo docker-compose restart
```

#### 4.2 重新构建并启动容器

```bash
# 重新构建并启动容器（后台运行）
sudo docker-compose up -d --build

# 解释：
# -d: 后台运行（detached mode）
# --build: 重新构建镜像
```

**构建过程输出示例：**

```
Building homenote
Step 1/8 : FROM node:18-alpine
 ---> abc123def456
Step 2/8 : WORKDIR /app
 ---> Using cache
 ---> 123abc456def
Step 3/8 : COPY package*.json ./
 ---> Using cache
 ---> 456def789abc
...
Creating homenote ... done
```

#### 4.3 查看容器状态

```bash
# 查看容器状态
sudo docker-compose ps

# 输出示例：
# NAME      COMMAND          SERVICE   STATUS         PORTS
# homenote  "node server.js"  homenote  Up 10 seconds  127.0.0.1:3000->3000/tcp
```

#### 4.4 查看容器日志

```bash
# 查看最新日志
sudo docker-compose logs homenote

# 实时查看日志（按 Ctrl+C 退出）
sudo docker-compose logs -f homenote

# 查看最后 50 行日志
sudo docker-compose logs --tail=50 homenote
```

#### 4.5 使用项目脚本（推荐）

```bash
# 使用项目提供的状态脚本
./scripts/status.sh

# 使用重启脚本
./scripts/restart.sh

# 使用启动脚本
./scripts/start.sh
```

### 第五步：验证部署

#### 5.1 检查服务是否正常运行

```bash
# 查看容器状态
sudo docker-compose ps

# 应该看到状态为 "Up"

# 查看日志确认没有错误
sudo docker-compose logs homenote | tail -20
```

#### 5.2 访问网站验证

在浏览器中访问：
- 如果配置了域名：`http://your-domain.com`
- 如果使用服务器IP：`http://your-server-ip`

#### 5.3 测试功能

- 测试新添加的功能
- 验证修复的 Bug 是否已解决
- 检查页面加载是否正常

## 完整操作示例

### 示例 1：首次更新

```bash
# === 本地操作 ===
# 1. 查看修改
git status

# 2. 添加文件
git add .

# 3. 提交
git commit -m "添加首页轮播图功能"

# 4. 推送
git push origin main

# === 服务器操作 ===
# 5. 登录服务器
ssh root@192.168.1.100

# 6. 进入项目目录
cd /opt/homenote

# 7. 拉取代码
git pull origin main

# 8. 重新构建并启动
sudo docker-compose up -d --build

# 9. 查看状态
./scripts/status.sh

# 10. 退出服务器
exit
```

### 示例 2：快速修复 Bug

```bash
# === 本地 ===
git add .
git commit -m "修复登录按钮点击无响应的问题"
git push origin main

# === 服务器 ===
ssh root@192.168.1.100
cd /opt/homenote
git pull origin main
sudo docker-compose restart
./scripts/status.sh
exit
```

### 示例 3：更新多个文件

```bash
# === 本地 ===
# 查看修改
git status

# 只添加特定文件
git add public/app.js server.js

# 提交
git commit -m "优化用户界面和后端API"

# 推送
git push origin main

# === 服务器 ===
ssh root@192.168.1.100
cd /opt/homenote
git pull origin main
sudo docker-compose up -d --build
sudo docker-compose logs -f homenote
# 按 Ctrl+C 退出日志查看
exit
```

## 常用 Git 命令速查

### 本地操作

```bash
# 查看状态
git status

# 查看修改内容
git diff
git diff filename.js

# 查看提交历史
git log
git log --oneline
git log --oneline -10

# 添加文件
git add .
git add filename.js
git add *.js

# 提交
git commit -m "提交信息"
git commit -am "提交信息"  # 添加并提交已跟踪的文件

# 推送
git push origin main
git push -u origin main  # 首次推送并设置上游分支

# 撤销操作
git checkout -- filename.js  # 撤销文件修改
git reset HEAD filename.js   # 取消暂存
git reset --soft HEAD~1       # 撤销最后一次提交（保留修改）
git reset --hard HEAD~1      # 撤销最后一次提交（丢弃修改）
```

### 服务器操作

```bash
# 查看状态
git status

# 查看远程仓库
git remote -v

# 查看分支
git branch
git branch -a  # 查看所有分支（包括远程分支）

# 拉取代码
git pull origin main
git pull origin main --rebase  # 使用 rebase 方式拉取

# 查看提交历史
git log
git log --oneline -5

# 查看文件变更
git diff HEAD~1 HEAD --stat

# 回滚到指定版本
git reset --hard <commit-hash>
git reset --hard HEAD~1  # 回滚到上一个版本
```

## Docker Compose 常用命令

```bash
# 启动容器
sudo docker-compose up -d

# 停止容器
sudo docker-compose stop

# 重启容器
sudo docker-compose restart

# 重新构建并启动
sudo docker-compose up -d --build

# 查看容器状态
sudo docker-compose ps

# 查看日志
sudo docker-compose logs homenote
sudo docker-compose logs -f homenote
sudo docker-compose logs --tail=50 homenote

# 进入容器
sudo docker-compose exec homenote sh

# 删除容器
sudo docker-compose down

# 删除容器和卷
sudo docker-compose down -v
```

## 故障排查

### 问题 1：Git push 失败

**错误信息：**
```
error: failed to push some refs to 'https://github.com/...'
```

**解决方案：**

```bash
# 先拉取远程最新代码
git pull origin main

# 如果有冲突，解决冲突后
git add .
git commit -m "解决合并冲突"
git push origin main
```

### 问题 2：Git pull 失败

**错误信息：**
```
error: Your local changes to the following files would be overwritten by merge
```

**解决方案：**

```bash
# 方案一：提交本地修改
git add .
git commit -m "保存本地修改"
git pull origin main

# 方案二：丢弃本地修改（谨慎使用）
git reset --hard HEAD
git pull origin main

# 方案三：暂存本地修改
git stash
git pull origin main
git stash pop
```

### 问题 3：Docker 容器启动失败

**解决方案：**

```bash
# 查看详细日志
sudo docker-compose logs homenote

# 检查 Docker 服务状态
sudo systemctl status docker

# 检查端口占用
sudo netstat -tulpn | grep 3000

# 重新构建镜像
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### 问题 4：权限问题

**错误信息：**
```
permission denied while trying to connect to the Docker daemon socket
```

**解决方案：**

```bash
# 使用 sudo 运行命令
sudo docker-compose up -d

# 或将用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

### 问题 5：SSH 连接失败

**解决方案：**

```bash
# 检查网络连接
ping your-server-ip

# 检查 SSH 服务状态（在服务器上）
sudo systemctl status sshd

# 使用详细模式调试
ssh -v username@your-server-ip

# 检查防火墙
sudo ufw status
```

## 最佳实践

### 1. 提交信息规范

使用清晰的提交信息：

```bash
# 好的提交信息
git commit -m "添加用户注册功能"
git commit -m "修复登录页面的样式问题"
git commit -m "优化数据库查询性能，减少50%查询时间"

# 不好的提交信息
git commit -m "update"
git commit -m "fix"
git commit -m "123"
```

### 2. 频繁提交

- 小步快跑，频繁提交
- 每完成一个功能点就提交一次
- 不要积累大量修改后再提交

### 3. 推送前检查

```bash
# 推送前检查状态
git status

# 确认没有遗漏文件
git diff

# 确认提交信息正确
git log -1
```

### 4. 服务器操作前备份

```bash
# 在服务器上更新前备份数据
cd /opt/homenote
sudo cp -r data data.backup.$(date +%Y%m%d_%H%M%S)
sudo cp -r uploads uploads.backup.$(date +%Y%m%d_%H%M%S)
```

### 5. 分支管理

```bash
# 开发新功能时创建新分支
git checkout -b feature/new-feature

# 完成后合并到主分支
git checkout main
git merge feature/new-feature
git push origin main

# 删除功能分支
git branch -d feature/new-feature
```

### 6. 定期更新依赖

```bash
# 本地更新依赖
npm update

# 提交并推送
git add package.json package-lock.json
git commit -m "更新项目依赖"
git push origin main

# 服务器上重新构建
git pull origin main
sudo docker-compose up -d --build
```

## 高级技巧

### 1. 使用 Git 别名简化命令

```bash
# 设置别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# 使用别名
git st        # 相当于 git status
git co main   # 相当于 git checkout main
git ci -m "msg"  # 相当于 git commit -m "msg"
```

### 2. 查看文件修改历史

```bash
# 查看文件的修改历史
git log --follow filename.js

# 查看文件每一行的修改者
git blame filename.js
```

### 3. 比较不同版本

```bash
# 比较当前版本和上一个版本
git diff HEAD~1 HEAD

# 比较两个提交
git diff abc123 def456

# 比较两个分支
git diff main develop
```

### 4. 查看远程更新

```bash
# 查看远程更新但不合并
git fetch origin main

# 查看本地和远程的差异
git log HEAD..origin/main

# 查看差异内容
git diff HEAD origin/main
```

### 5. 使用 .gitignore

确保 `.gitignore` 文件正确配置：

```gitignore
# 依赖
node_modules/

# 环境变量
.env
.env.local

# 数据文件
data/
uploads/

# 日志
*.log
npm-debug.log*

# 系统文件
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

## 数据备份与恢复

### 备份数据

```bash
# 在服务器上备份
cd /opt/homenote

# 创建备份目录
mkdir -p /backup/homenote

# 备份数据库和上传文件
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
sudo cp -r data /backup/homenote/data_$BACKUP_DATE
sudo cp -r uploads /backup/homenote/uploads_$BACKUP_DATE

# 备份整个项目
sudo tar -czf /backup/homenote/homenote_$BACKUP_DATE.tar.gz .
```

### 恢复数据

```bash
# 恢复数据库
cd /opt/homenote
sudo cp -r /backup/homenote/data_20250219_120000/* data/

# 恢复上传文件
sudo cp -r /backup/homenote/uploads_20250219_120000/* uploads/

# 重启容器
sudo docker-compose restart
```

### 自动备份脚本

创建 `/opt/homenote/scripts/backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/backup/homenote"
PROJECT_DIR="/opt/homenote"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据
echo "备份数据..."
sudo cp -r $PROJECT_DIR/data $BACKUP_DIR/data_$DATE

# 备份上传文件
echo "备份上传文件..."
sudo cp -r $PROJECT_DIR/uploads $BACKUP_DIR/uploads_$DATE

# 删除30天前的备份
echo "清理旧备份..."
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;

echo "备份完成: $DATE"
```

设置定时任务：

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /opt/homenote/scripts/backup.sh >> /var/log/homenote-backup.log 2>&1
```

## 版本回滚

### 回滚到之前的版本

```bash
# 1. 查看提交历史
git log --oneline

# 输出示例：
# abc1234 (HEAD -> main, origin/main) 最新功能
# def5678 修复 Bug
# ghi8901 添加新功能

# 2. 回滚到指定版本
git reset --hard def5678

# 3. 强制推送到远程（谨慎使用）
git push origin main --force

# 4. 在服务器上拉取
git pull origin main

# 5. 重新构建容器
sudo docker-compose up -d --build
```

### 使用 Git Reflog 恢复

```bash
# 查看操作历史
git reflog

# 恢复到之前的状态
git reset --hard HEAD@{2}
```

## 常见问题 FAQ

### Q1: 如何查看服务器上运行的 Git 版本？

```bash
git --version
```

### Q2: 如何查看 Docker 镜像大小？

```bash
sudo docker images
```

### Q3: 如何清理未使用的 Docker 资源？

```bash
# 清理未使用的镜像
sudo docker image prune -a

# 清理未使用的容器
sudo docker container prune

# 清理未使用的卷
sudo docker volume prune

# 清理所有未使用的资源
sudo docker system prune -a
```

### Q4: 如何查看容器的资源使用情况？

```bash
# 查看容器资源使用
sudo docker stats

# 查看特定容器
sudo docker stats homenote
```

### Q5: 如何在服务器上查看 Git 配置？

```bash
# 查看所有配置
git config --list

# 查看用户配置
git config user.name
git config user.email

# 设置用户配置
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Q6: 如何解决合并冲突？

```bash
# 1. 拉取时出现冲突
git pull origin main

# 2. 查看冲突文件
git status

# 3. 编辑冲突文件，解决冲突
nano filename.js

# 4. 标记冲突已解决
git add filename.js

# 5. 提交
git commit -m "解决合并冲突"

# 6. 推送
git push origin main
```

### Q7: 如何查看 Docker 容器的详细信息？

```bash
# 查看容器详细信息
sudo docker inspect homenote

# 查看容器端口映射
sudo docker port homenote

# 查看容器进程
sudo docker top homenote
```

### Q8: 如何在容器内执行命令？

```bash
# 进入容器
sudo docker-compose exec homenote sh

# 执行单个命令
sudo docker-compose exec homenote node -v
sudo docker-compose exec homenote ls -la
```

## 总结

本方案提供了最简单直接的服务器同步更新方法，主要优势：

✅ **简单易懂**：不需要复杂的配置  
✅ **完全控制**：每一步都可以手动确认  
✅ **易于调试**：出现问题容易定位  
✅ **学习价值**：帮助理解 Git 和 Docker 的工作原理  
✅ **灵活性高**：可以根据需要调整每一步操作  

## 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 项目部署文档
- [scripts/README.md](./scripts/README.md) - 操作脚本说明

## 快速参考

### 本地更新流程
```bash
git add .
git commit -m "提交信息"
git push origin main
```

### 服务器更新流程
```bash
ssh username@server-ip
cd /opt/homenote
git pull origin main
sudo docker-compose up -d --build
./scripts/status.sh
```

### 常用命令
```bash
# Git
git status
git log --oneline -5
git diff

# Docker
sudo docker-compose ps
sudo docker-compose logs -f homenote
sudo docker-compose restart
```

---

**最后更新：** 2025-02-19
