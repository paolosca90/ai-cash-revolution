const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const app = express();

// Webhook secret (set this in GitHub webhook settings)
const WEBHOOK_SECRET = 'ai-cash-revolution-webhook-2025';

app.use(express.raw({ type: 'application/json' }));

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
        console.log('❌ No signature provided');
        return res.status(401).send('No signature');
    }

    if (!verifySignature(req.body, signature)) {
        console.log('❌ Invalid signature');
        return res.status(401).send('Invalid signature');
    }

    const payload = JSON.parse(req.body.toString());
    
    // Only deploy on push to main branch
    if (payload.ref !== 'refs/heads/main') {
        console.log('📝 Push to non-main branch, skipping deployment');
        return res.send('Not main branch');
    }

    console.log('🚀 GitHub webhook received, starting deployment...');
    console.log(`📝 Commit: ${payload.head_commit.message}`);
    console.log(`👤 Author: ${payload.head_commit.author.name}`);
    
    // Execute update script
    exec('./update.sh', { cwd: '/var/www/ai-cash-revolution' }, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Deployment failed:', error);
            console.error('STDERR:', stderr);
            return res.status(500).send('Deployment failed');
        }
        
        console.log('✅ Deployment completed successfully!');
        console.log('STDOUT:', stdout);
        
        // Log to file for debugging
        const fs = require('fs');
        const timestamp = new Date().toISOString();
        fs.appendFileSync('/var/log/ai-cash-deploys.log', 
            `${timestamp} - Deployed commit: ${payload.head_commit.id.substring(0, 7)} - ${payload.head_commit.message}\n`
        );
    });
    
    res.send('Deployment started');
});

// Health check endpoint
app.get('/webhook/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'AI Cash R-evolution Webhook'
    });
});

// Start server
const PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, () => {
    console.log(`🔗 AI Cash R-evolution webhook server running on port ${PORT}`);
    console.log(`📋 Webhook URL: http://your-domain.com:${PORT}/webhook`);
    console.log(`🔍 Health check: http://your-domain.com:${PORT}/webhook/health`);
});