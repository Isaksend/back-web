const app = require('./app');
const mongoose = require("mongoose");

const PORT = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
    });
