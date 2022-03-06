const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const config = require('./config.json');

const transporter = nodemailer.createTransport({
    host: config.transporter.host,
    port: config.transporter.port,
    secure: config.transporter.secure,
    requireTLS: config.transporter.requireTLS,
    auth: {
        user: config.transporter.auth.user,
        pass: config.transporter.auth.pass
    }
});

const mailOptions = {
    from: config.mailOptions.from,
    to: config.mailOptions.to,
    subject: config.mailOptions.subject,
    text: config.mailOptions.text
};

const app = async () => {
    try {
        const browser = await puppeteer.launch(); 
        const page = await browser.newPage();        
        
        setInterval(async () => {
            let previousCount = 12;
            let currentCount = 0;    
            
            await page.goto(config.app.url, { waitUntil: 'domcontentloaded' });
            
            previousCount = currentCount;
            currentCount = await page.evaluate(() => { return Number(document.getElementById('count').innerHTML); });                        
            
            if (previousCount >= 0 && currentCount == 0) {               
                console.log(`Sending notification email to ${ config.mailOptions.to }`);
                const info = await transporter.sendMail(mailOptions);
                console.log(`Email sent: ${info.response}`);
            }    
            
            await browser.close();
        }, config.app.interval);
    } catch (error) {
        console.log(error);
    }
};

app();
