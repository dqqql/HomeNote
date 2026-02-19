# HomeNote 操作脚本

本目录包含 HomeNote 项目的便捷操作脚本。

## 使用前准备

在服务器上使用前，需要给脚本添加执行权限：

```bash
chmod +x scripts/*.sh
```

## 脚本说明

### 1. start.sh - 启动项目

启动 HomeNote 项目容器。

```bash
./scripts/start.sh
```

### 2. stop.sh - 停止项目

停止 HomeNote 项目容器。

```bash
./scripts/stop.sh
```

### 3. restart.sh - 重启项目

重启 HomeNote 项目容器。

```bash
./scripts/restart.sh
```

### 4. status.sh - 查看状态

查看项目运行状态和最近日志。

```bash
./scripts/status.sh
```

## 注意事项

- 所有脚本需要在项目根目录下执行
- 如果使用 sudo 权限运行 Docker，请相应调整脚本或使用 sudo 执行
