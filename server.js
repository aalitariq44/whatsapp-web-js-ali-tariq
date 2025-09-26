const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
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
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
                    await message.reply('أهلا وسهلا بك');
                    console.log('✅ Auto-replied with Arabic greeting to:', message.from);
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