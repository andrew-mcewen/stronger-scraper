const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const config = require('./config.json');
const transporter = nodemailer.createTransport(config.transporter);
const mailOptions = config.mailOptions;

const app = () => {
    try {
        let previousCount = 0;
        let currentCount = 0;
        let message = '';
        let sendEmail = false;

        setInterval(async () => {
            const browser = await puppeteer.launch(); 
            const page = await browser.newPage();    

            await page.goto(config.app.url, { waitUntil: 'domcontentloaded' });
            
            previousCount = currentCount;
            currentCount = await page.evaluate(counterElementId => { return Number(document.getElementById(counterElementId).innerText); }, config.app.counterElementId);                        

            console.log(`Previous riders: ${previousCount}`);
            console.log(`Current riders: ${currentCount}\n`);

            if (previousCount == currentCount) {
                message = 'No riders checked in or out';
            } else if (previousCount < currentCount) {     
                message = 'Rider checked in';        
            } else if (currentCount >= config.app.levels.dead && currentCount < config.app.levels.quiet ) {
                message = 'Stronger Skatepark is now dead';
                sendEmail = true;
            } else if (currentCount >= config.app.levels.quiet && currentCount < config.app.levels.busy) {
                message = 'Stronger Skatepark is now quiet';
                sendEmail = true;
            } else if (currentCount >= config.app.levels.busy) {
                message = 'Stronger Skatepark is still busy';
                sendEmail = true;
            }
            
            console.log(`${ moment().tz('US/Pacific').format('llll') }: ${ message }\n`);
            
            if (sendEmail) {
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
