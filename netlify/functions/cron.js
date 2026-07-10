const { schedule } = require('@netlify/functions');
const mongoose = require('mongoose');
const twilio = require('twilio');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

const Guest = mongoose.models.Guest || mongoose.model('Guest', new mongoose.Schema({
    name: String, email: String, phone: String, attending: String
}));

const handler = async (event, context) => {
    try {
        await connectDB();
        
        // Party date mapped to flyer: July 26, 2026
        const partyDate = new Date("July 26, 2026 00:00:00").getTime();
        const now = new Date().getTime();
        const daysLeft = Math.ceil((partyDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 3 || daysLeft === 1) {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const guests = await Guest.find({ attending: 'yes' });

            for (const guest of guests) {
                try {
                    await client.messages.create({
                        body: `Hey ${guest.name}! Just a reminder that Chase's Going Away & Birthday Bash is in ${daysLeft} day(s)! Bring your swim wear and a towel!`,
                        to: guest.phone,
                        from: process.env.TWILIO_PHONE_NUMBER
                    });
                } catch (smsError) {
                    console.error(`Failed to send SMS to ${guest.name}:`, smsError);
                }
            }
            console.log(`Reminders sent for ${daysLeft} days left.`);
        } else {
            console.log(`No reminders scheduled for today (${daysLeft} days left).`);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Cron executed successfully" })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};

exports.handler = schedule("0 12 * * *", handler);