# Deploy to Railway - دليل النشر على Railway

## Railway Deployment Guide - دليل النشر على Railway

This guide will help you deploy your WhatsApp Web.js application to Railway Platform.

### Prerequisites - المتطلبات المسبقة

1. GitHub account
2. Railway account (free at railway.app)
3. Your project code in a GitHub repository

### Step 1: Prepare Your Repository - الخطوة الأولى: تحضير المستودع

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy to Railway - الخطوة الثانية: النشر على Railway

1. Go to [Railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your WhatsApp Web.js repository
6. Railway will automatically detect the Dockerfile and start building

### Step 3: Configure Environment (Optional) - الخطوة الثالثة: تكوين البيئة

If you need environment variables:
1. Go to your project dashboard
2. Click on "Variables" tab
3. Add any required environment variables:
   - `NODE_ENV=production`
   - `PORT=3000` (Railway will override this automatically)

### Step 4: Monitor Deployment - الخطوة الرابعة: مراقبة النشر

1. Watch the build logs in Railway dashboard
2. Once deployed, you'll get a URL like: `https://your-app-name.railway.app`
3. The application will be accessible via this URL

### Important Notes - ملاحظات مهمة

#### WhatsApp Authentication
- Your app will generate a new QR code each time it's deployed
- WhatsApp session data is NOT persistent across deployments
- Users will need to re-scan QR code after each deployment

#### Dockerfile Configuration
The included Dockerfile:
- Uses Node.js 18 Alpine (lightweight)
- Installs Chromium for Puppeteer
- Configures proper user permissions
- Includes health checks

#### Railway-Specific Features
- **Automatic HTTPS**: Railway provides free SSL certificates
- **Custom Domains**: You can add your own domain
- **Auto-scaling**: Railway automatically scales based on traffic
- **Monitoring**: Built-in logs and metrics

### Troubleshooting - استكشاف الأخطاء

#### Common Issues:

1. **Build Fails**:
   - Check build logs in Railway dashboard
   - Ensure all dependencies are in package.json
   - Verify Dockerfile syntax

2. **App Crashes**:
   - Check runtime logs
   - Verify Chromium is properly installed
   - Check memory limits (Railway free tier has limits)

3. **QR Code Issues**:
   - Ensure port 3000 is exposed
   - Check if Puppeteer can access Chromium
   - Verify headless browser configuration

4. **Memory Issues**:
   - Railway free tier has memory limits
   - Consider upgrading to paid plan for production use
   - Monitor memory usage in dashboard

### Updating Your App - تحديث التطبيق

To update your deployed app:
1. Push changes to your GitHub repository
2. Railway will automatically trigger a new deployment
3. Monitor the build process in the dashboard

### Railway CLI (Optional) - أداة Railway لسطر الأوامر

You can also use Railway CLI for local development:
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

### Production Considerations - اعتبارات الإنتاج

1. **Persistence**: Consider using external storage for WhatsApp sessions
2. **Security**: Add proper authentication and rate limiting
3. **Monitoring**: Set up proper logging and error tracking
4. **Scaling**: Monitor resource usage and upgrade plan if needed

### Support - الدعم

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check Railway status: https://status.railway.app

---

**Arabic Summary - ملخص بالعربية:**

1. ادفع الكود إلى GitHub
2. اذهب إلى railway.app وسجل الدخول
3. أنشئ مشروع جديد من GitHub
4. سيتم النشر تلقائياً
5. احصل على رابط التطبيق
6. امسح رمز QR الجديد لربط واتساب

**Important**: ستحتاج إلى مسح رمز QR جديد في كل مرة يتم نشر التطبيق فيها.