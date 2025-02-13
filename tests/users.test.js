const request = require('supertest');
const app = require('../app'); // Теперь используем app.js
const mongoose = require('mongoose');
const User = require('../models/User');

describe('User API Tests', () => {
    let server;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteMany();
        server = app.listen(4001);
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    test('POST /api/users/register - Should register a user', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'Test1234',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.username).toBe('newuser');
    });

    test('POST /api/users/login - Should login user and return token', async () => {
        await request(app)
            .post('/api/users/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test1234',
            });

        const res = await request(app)
            .post('/api/users/login')
            .send({
                username: 'testuser',
                password: 'Test1234',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
    });

    test('GET /api/users/profile - Should get user profile', async () => {
        const loginRes = await request(app)
            .post('/api/users/login')
            .send({
                username: 'testuser',
                password: 'Test1234',
            });

        const res = await request(app)
            .get('/api/users/profile')
            .set('Cookie', loginRes.headers['set-cookie']);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('username', 'testuser');
    });
});
