const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

const guestSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    attending: String,
    rsvpDate: { type: Date, default: Date.now }
});

const Guest = mongoose.models.Guest || mongoose.model('Guest', guestSchema);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        await connectDB();
        const { name, email, phone, attending } = JSON.parse(event.body);

        if (!name || !email || !phone || !attending) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'All fields are required' }),
            };
        }

        const newGuest = new Guest({ name, email, phone, attending });
        await newGuest.save();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'RSVP saved successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};