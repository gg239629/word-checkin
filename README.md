# 📚 背单词打卡网站

每日打卡背诵单词 + 上传截图证明，部署在 Netlify，全球可访问。

## 🚀 一键部署

点击下方按钮直接部署到 Netlify：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/你的用户名/仓库名)

### 手动部署步骤

**1. 上传到 GitHub**
```bash
cd C:\Users\guany\Desktop\d
git init
git add .
git commit -m "init: 背单词打卡网站"
# 在 GitHub 新建仓库后
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

**2. 部署到 Netlify**
1. 打开 [app.netlify.com](https://app.netlify.com)，用 GitHub 登录
2. 点击 **Add new site → Import an existing project**
3. 连接 GitHub，选择你的仓库
4. 无需修改任何配置，直接 **Deploy site**

**3. 配置 Netlify Blobs 存储**
1. 在项目 Dashboard 中，点击 **Storage**
2. 启用 **Netlify Blobs**（免费 100GB）
3. 环境变量会自动注入，无需手动配置
4. 重新部署一次使配置生效

### 完成
部署成功后，Netlify 会给你一个 `xxx.netlify.app` 域名，任何人都可以访问！

## ✨ 功能
- 📅 月度日历视图，直观查看打卡进度
- 📸 上传截图作为背单词完成证明
- 📊 连续打卡天数、总打卡数、月度完成率
- 🔥 连续打卡成就徽章
- 🌐 全球 CDN 加速，访问飞快
