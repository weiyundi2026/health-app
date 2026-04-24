# HealthPro API 云端部署指南

> 将后端 API 部署到 Railway（免费，无需信用卡）或 Render（免费，有休眠限制）

---

## 方式一：Railway（推荐，免费）

### 第一步：关联 GitHub
1. 打开 https://railway.app
2. 用 GitHub 账号登录（推荐）
3. 点击 **New Project** → **Deploy from GitHub repo**
4. 授权 GitHub，选择仓库 **`weiyundi2026/healthpro-api`**

### 第二步：配置环境变量
在 Railway 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `API_KEY` | `your-secret-api-key` | API 密钥，生产环境请改为强随机字符串 |
| `LOG_LEVEL` | `INFO` | 日志级别 |
| `MAX_IMAGE_SIZE_MB` | `10` | 最大图片 MB 数 |

### 第三步：部署
- Railway 会自动检测 Python 项目，安装依赖并启动
- 部署完成后，URL 类似：`https://healthpro-api.up.railway.app`
- 访问 `https://healthpro-api.up.railway.app/health` 确认服务正常

### 第四步：填入 HTML
部署成功后，将 `HealthCamera.html` 中的地址改为实际 URL：
```javascript
apiUrl: 'https://healthpro-api.up.railway.app/health-analyze',
```

---

## 方式二：Render（免费）

### 第一步：关联 GitHub
1. 打开 https://render.com
2. 用 GitHub 登录
3. 点击 **New** → **Web Service**
4. 连接仓库 **`weiyundi2026/healthpro-api`**

### 第二步：配置
| 字段 | 值 |
|------|-----|
| Name | `healthpro-api` |
| Region | Singapore（亚洲延迟低）|
| Branch | `main` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### 第三步：环境变量
同样添加 `API_KEY` 等变量。

### 第四步：部署完成后
访问 `https://your-service.onrender.com/health` 确认正常。

---

## 方式三：阿里云函数计算（国内访问快）

### 使用 Serverless Devs 部署：
```bash
npm install -g @serverless-devs/s
s login --access-key-id <你的AK> --access-key-secret <你的SK>
s deploy
```

### 或直接上传 ZIP：
1. 在本地运行 `pip install -r requirements.txt -t ./package`
2. 将 `main.py`、`analyzers/`、`utils/` 打包为 `code.zip`
3. 在阿里云函数计算控制台创建 Python 3.9 函数，上传 ZIP

---

## 验证 API 正常工作

部署完成后，用 curl 测试：

```bash
curl -X POST https://your-api-url/health-analyze \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"image":"BASE64_IMAGE_DATA","mode":"face"}'
```

正常响应示例：
```json
{
  "mode": "face",
  "title": "面色分析报告",
  "score": 78,
  "hasCloudAnalysis": true,
  "confidence": 0.88,
  ...
}
```

---

## 常见问题

**Q: Railway 部署后服务报错？**
- 检查 Build Log 看是否 pip install 失败
- 确保 `requirements.txt` 中的依赖版本兼容 Python 3.11

**Q: API 返回 401？**
- 检查 Authorization header 是否正确：`Bearer <API_KEY>`
- 确认环境变量 `API_KEY` 已设置

**Q: 图片上传失败？**
- 检查图片大小是否超过 `MAX_IMAGE_SIZE_MB`（默认 10MB）
- 确保 Base64 不带 `data:image/...` 前缀

---

## 接入 App 的最后一步

API 部署好后，修改 `HealthCamera.html` 第 759 行：

```javascript
// 改这一行
apiUrl: 'https://your-actual-api-url/health-analyze',
```

然后重新打包 APK，或直接更新 GitHub Pages（Web 版立即生效）。

---

## APK 自动构建（GitHub Actions）

健康相机修复版已推送到 GitHub，GitHub Actions 会自动构建 APK。

### 激活 Actions（需要手动一步）

由于 GitHub API 限制，workflow 文件被推送到了 `workflows/build-android.yml`（而非标准位置 `.github/workflows/`）。
**请手动移动文件来激活构建：**

1. 打开 https://github.com/weiyundi2026/health-pro-app
2. 点击 `workflows/build-android.yml` 文件
3. 点击编辑按钮（铅笔图标）右上角
4. 点击 "..." 菜单 → **"Move file"**
5. 移动到目录：`.github/workflows/`
6. 提交更改（commit message 随意）

### 构建完成后下载 APK

1. 打开 https://github.com/weiyundi2026/health-pro-app/actions
2. 点击最新的 workflow run
3. 点击 Artifacts 中的 `HealthPro-APK-v3.3.0` 下载 APK
4. 安装到手机即可

### 如果 GitHub Actions 没有自动触发

1. 进入仓库 → Actions 标签页
2. 选择 "Build Android APK" workflow
3. 点击 "Run workflow" 手动触发

---

## 当前状态汇总

| 项目 | 状态 | 说明 |
|------|------|------|
| 后端 API | 待部署 | 在 Railway/Render 部署 healthpro-api |
| API URL | 已预设 | `https://healthpro-api.up.railway.app/health-analyze` |
| HTML 修复 | 已推送 | health-pro-app/www/HealthCamera.html 已更新 |
| APK 构建 | 待手动 | 需要移动 workflow 文件到 .github/workflows/ |
| DUMP 权限 | 已修复 | CI 会自动从 APK 中删除 DUMP 权限 |

