const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Simple session data
let sessionData = {
    isConnected: false,
    qrCode: null,
    phoneNumber: null,
    isInitializing: false
};

let whatsappClient = null;

// Create WhatsApp client
function createWhatsAppClient() {
    try {
        console.log('🔧 Creating WhatsApp client with LocalAuth...');
        
        const client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './wwebjs_auth',
                clientId: 'default'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                timeout: 60000
            },
            qrMaxRetries: 3
        });
        
        console.log('✅ WhatsApp client created successfully');
        return client;
    } catch (error) {
        console.error('❌ Error creating WhatsApp client:', error);
        return null;
    }
}

// Routes
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    console.log('Serving index.html from:', indexPath);
    
    // Check if file exists before serving
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error('❌ index.html not found at:', indexPath);
        res.status(404).send(`
            <h1>File Not Found</h1>
            <p>index.html not found at: ${indexPath}</p>
            <p>Available files in public directory:</p>
            <ul>
                ${fs.existsSync(path.join(__dirname, 'public')) ? 
                    fs.readdirSync(path.join(__dirname, 'public')).map(f => `<li>${f}</li>`).join('') : 
                    '<li>public directory does not exist</li>'
                }
            </ul>
        `);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const publicPath = path.join(__dirname, 'public');
    const indexPath = path.join(publicPath, 'index.html');
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        publicDirExists: fs.existsSync(publicPath),
        indexFileExists: fs.existsSync(indexPath),
        publicFiles: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : [],
        workingDirectory: __dirname
    });
});

// Get connection status
app.get('/status', (req, res) => {
    res.json({
        isConnected: sessionData.isConnected,
        phoneNumber: sessionData.phoneNumber,
        qrCode: sessionData.qrCode,
        isInitializing: sessionData.isInitializing
    });
});

// Connect WhatsApp
app.post('/connect', (req, res) => {
    if (sessionData.isInitializing) {
        return res.json({ 
            success: false, 
            message: 'Connection already in progress'
        });
    }

    if (whatsappClient && sessionData.isConnected) {
        return res.json({ 
            success: true, 
            message: 'WhatsApp already connected',
            connected: true 
        });
    }

    try {
        sessionData.isInitializing = true;
        sessionData.qrCode = null;
        
        console.log('Creating new WhatsApp client...');
        whatsappClient = createWhatsAppClient();
        
        if (!whatsappClient) {
            throw new Error('Failed to create WhatsApp client');
        }

        // Set up event handlers before initializing
        // QR code event
        whatsappClient.on('qr', (qr) => {
            console.log('QR Code received - Please scan with WhatsApp');
            console.log('QR Code length:', qr.length);
            qrcode.generate(qr, { small: true });
            sessionData.qrCode = qr;
        });

        // Authentication events
        whatsappClient.on('authenticated', () => {
            console.log('✅ WhatsApp authenticated successfully!');
        });

        // Ready event
        whatsappClient.on('ready', () => {
            console.log('✅ WhatsApp client is ready and connected!');
            sessionData.isConnected = true;
            sessionData.qrCode = null;
            sessionData.isInitializing = false;
            
            // Get phone number info
            setTimeout(() => {
                try {
                    if (whatsappClient.info && whatsappClient.info.wid) {
                        sessionData.phoneNumber = whatsappClient.info.wid.user;
                        console.log('Connected phone number:', sessionData.phoneNumber);
                    } else {
                        console.log('Phone number not available yet');
                    }
                } catch (e) {
                    console.log('Could not get phone number:', e.message);
                }
            }, 1000);
        });

        // Message event - Auto reply
        whatsappClient.on('message', async (message) => {
            console.log('📨 Message received from:', message.from, 'Body:', message.body);
            
            if (!message.fromMe && sessionData.isConnected) {
                try {
                    const autoReply = `أهلا وسهلا، هذا رد تلقائي
يرجى التواصل على تليجرام في نفس هذا الرقم الهاتف
أو عن طريق معرف تليجرام https://t.me/ali_tariq4a`;
                    
                    await message.reply(autoReply);
                    console.log('✅ Auto-replied with Telegram contact info to:', message.from);
                } catch (error) {
                    console.error('❌ Error replying to message:', error);
                }
            }
        });

        // Error events
        whatsappClient.on('disconnected', (reason) => {
            console.log('❌ WhatsApp disconnected. Reason:', reason);
            sessionData.isConnected = false;
            sessionData.qrCode = null;
            sessionData.phoneNumber = null;
            sessionData.isInitializing = false;
            whatsappClient = null;
        });

        whatsappClient.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
            sessionData.isConnected = false;
            sessionData.qrCode = null;
            sessionData.isInitializing = false;
            whatsappClient = null;
        });

        // Loading screen event
        whatsappClient.on('loading_screen', (percent, message) => {
            console.log('⏳ Loading WhatsApp:', percent + '%', message || '');
        });

        // Error handling
        whatsappClient.on('change_state', (state) => {
            console.log('🔄 WhatsApp state changed:', state);
        });

        // Initialize the client (don't await)
        console.log('Initializing WhatsApp client...');
        whatsappClient.initialize().catch((error) => {
            console.error('❌ Error during client initialization:', error);
            sessionData.isInitializing = false;
            sessionData.qrCode = null;
        });

        // Respond immediately after setting up
        res.json({ 
            success: true, 
            message: 'WhatsApp connection initiated. Please wait for QR code...'
        });

    } catch (error) {
        console.error('❌ Error in connect endpoint:', error);
        sessionData.isInitializing = false;
        sessionData.qrCode = null;
        
        res.status(500).json({ 
            error: 'Failed to connect WhatsApp',
            details: error.message 
        });
    }
});

// Get QR code
app.get('/qr', (req, res) => {
    if (sessionData.isConnected) {
        return res.json({ 
            connected: true, 
            message: 'WhatsApp already connected' 
        });
    }

    res.json({ 
        qrCode: sessionData.qrCode,
        connected: sessionData.isConnected
    });
});

// Serve QR as an SVG image generated locally (no external services)
app.get('/qr-image.svg', async (req, res) => {
    try {
        if (!sessionData.qrCode) {
            return res.status(404).send('');
        }
        const svg = await QRCode.toString(sessionData.qrCode, {
            type: 'svg',
            width: 250,
            margin: 1,
            errorCorrectionLevel: 'M'
        });
        res.setHeader('Content-Type', 'image/svg+xml');
        // Prevent caching so new codes always show
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(svg);
    } catch (e) {
        console.error('Error generating QR SVG:', e);
        res.status(500).send('');
    }
});

// Disconnect WhatsApp
app.post('/disconnect', async (req, res) => {
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
            whatsappClient = null;
            sessionData.isConnected = false;
            sessionData.qrCode = null;
            sessionData.phoneNumber = null;
            
            res.json({ 
                success: true, 
                message: 'WhatsApp disconnected successfully' 
            });
        } catch (error) {
            console.error('Error disconnecting WhatsApp:', error);
            res.status(500).json({ 
                error: 'Failed to disconnect WhatsApp',
                details: error.message 
            });
        }
    } else {
        res.json({ 
            success: true, 
            message: 'WhatsApp was not connected' 
        });
    }
});


// Logout WhatsApp completely (remove saved session and require re-scan)
app.post('/logout', async (req, res) => {
    try {
        // Try to logout gracefully if client exists
        if (whatsappClient) {
            try {
                if (typeof whatsappClient.logout === 'function') {
                    await whatsappClient.logout();
                }
            } catch (e) {
                console.warn('Warning during client.logout():', e.message);
            }
            try {
                await whatsappClient.destroy();
            } catch (e) {
                console.warn('Warning during client.destroy():', e.message);
            }
            whatsappClient = null;
        }

        // Clear session state
        sessionData.isConnected = false;
        sessionData.qrCode = null;
        sessionData.phoneNumber = null;
        sessionData.isInitializing = false;

        // Remove LocalAuth stored sessions to force a full re-login
        const authBase = path.join(__dirname, 'wwebjs_auth');
        const sessionDefault = path.join(authBase, 'session-default');
        const sessionLegacy = path.join(authBase, 'session');

        const removeDir = (p) => {
            return new Promise((resolve) => {
                fs.rm(p, { recursive: true, force: true }, (err) => {
                    if (err) console.warn(`Warning removing ${p}:`, err.message);
                    resolve();
                });
            });
        };

        await Promise.all([
            removeDir(sessionDefault),
            removeDir(sessionLegacy)
        ]);

        res.json({
            success: true,
            message: 'Logged out and cleared saved session successfully'
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({
            error: 'Failed to logout completely',
            details: error.message
        });
    }
});



// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Simple WhatsApp QR Auto-Reply Server Started');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
            console.log('WhatsApp client disconnected');
        } catch (error) {
            console.error('Error disconnecting client:', error);
        }
    }
    
    process.exit(0);
});