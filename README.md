# WhatsApp Auto Reply Application - تطبيق الرد التلقائي على واتساب

This is a web application built with WhatsApp Web.js that allows users to register and automatically reply to WhatsApp messages with "أهلا وسهلا بك" (Hello and welcome).

## Features - الميزات

- **User Registration**: Users can register with username and email
- **WhatsApp Integration**: Connect WhatsApp using QR code authentication
- **Auto Reply**: Automatically responds to any incoming message with "أهلا وسهلا بك"
- **Web Dashboard**: User-friendly web interface in Arabic
- **Real-time Status**: Shows connection status and QR code updates

## Installation - التثبيت

1. Make sure you have Node.js installed on your system
2. Clone or download this project
3. Navigate to the project directory
4. Install dependencies:
```bash
npm install
```

## Usage - الاستخدام

1. Start the server:
```bash
npm start
```

2. Open your web browser and go to:
```
http://localhost:3000
```

3. Follow these steps:
   - Register a new user with username and email
   - Click "ربط واتساب" (Connect WhatsApp)
   - Scan the QR code with WhatsApp on your phone:
     - Open WhatsApp > Settings > Linked Devices > Link a Device
   - Once connected, the application will automatically reply "أهلا وسهلا بك" to any incoming messages

## Technical Details - التفاصيل التقنية

### Dependencies
- **whatsapp-web.js**: WhatsApp Web API wrapper
- **express**: Web server framework
- **qrcode-terminal**: Generate QR codes for authentication
- **body-parser**: Parse HTTP request bodies
- **cors**: Enable Cross-Origin Resource Sharing

### API Endpoints
- `POST /register`: Register a new user
- `GET /user/:userId`: Get user information
- `POST /connect-whatsapp/:userId`: Connect WhatsApp for a user
- `GET /qr-code/:userId`: Get QR code for WhatsApp authentication
- `POST /disconnect-whatsapp/:userId`: Disconnect WhatsApp
- `GET /users`: List all registered users

### File Structure
```
├── server.js          # Main server file
├── public/
│   └── index.html     # Frontend interface
├── package.json       # Project configuration
└── README.md         # This file
```

## Important Notes - ملاحظات مهمة

1. **Chrome/Chromium Required**: The application uses Puppeteer which requires Chrome or Chromium to be installed
2. **Network Connection**: Stable internet connection is required for WhatsApp Web functionality
3. **Phone Connection**: Your phone must be connected to the internet and WhatsApp must be running
4. **Session Persistence**: User sessions are stored locally and will persist between server restarts

## Troubleshooting - استكشاف الأخطاء

### Common Issues:
1. **QR Code not showing**: Make sure the server is running and refresh the page
2. **Connection fails**: Check your internet connection and try again
3. **Auto-reply not working**: Ensure WhatsApp is connected and the phone is online
4. **Puppeteer errors**: Make sure Chrome/Chromium is installed on your system

### Console Logs:
Check the server console for detailed logs about:
- QR code generation
- WhatsApp connection status
- Incoming messages and auto-replies
- User registration and management

## Security Considerations - اعتبارات الأمان

- User data is stored in memory (not persistent across server restarts)
- No authentication beyond user registration
- WhatsApp session data is stored locally
- This is a demo application - implement proper security for production use

## License - الرخصة

This project is open source and available under the MIT License.

## Support - الدعم

For issues or questions, please check the console logs first for detailed error messages.

---

**الاستخدام:**
1. ابدأ الخادم: `npm start`
2. افتح المتصفح على: `http://localhost:3000`
3. سجل مستخدم جديد
4. اربط واتساب عبر مسح رمز QR
5. سيرد التطبيق تلقائياً برسالة "أهلا وسهلا بك" على أي رسالة واردة"# whatsapp-web-js-ali-tariq" 
