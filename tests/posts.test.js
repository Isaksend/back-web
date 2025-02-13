const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

describe('Post API Tests', () => {
    let server;
    let userToken;
    let postId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteMany();
        await Post.deleteMany();

        if (server && server.listening) {
            console.log('Closing existing server...');
            await new Promise( (resolve) => server.close(resolve));
        }


        await request(app).post('/api/users/register').send({
            username: 'postuser',
            email: 'postuser@example.com',
            password: 'Test1234',
        });

        const loginRes = await request(app).post('/api/users/login').send({
            username: 'postuser',
            password: 'Test1234',
        });

        userToken = loginRes.headers['set-cookie'];
    });

    afterAll(async () => {
        await mongoose.connection.close();
        if (server && server.listening) {
            console.log('Closing test server...');
            await server.close();
            await new Promise((resolve) => server.close(resolve));
        }
    });

    test('POST /api/posts - Should create a new post', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Cookie', userToken)
            .send({
                title: 'Test Post',
                summary: 'This is a test post',
                content: '<p>Test content</p>',
                cover: 'uploads/default.jpg',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');

        postId = res.body._id;
        expect(postId).toBeDefined();
    });

    test('GET /api/posts - Should return all posts', async () => {
        const res = await request(app).get('/api/posts');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/posts/:id - Should return a specific post', async () => {
        expect(postId).toBeDefined();

        const res = await request(app).get(`/api/posts/${postId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('title', 'Test Post');
    });

    test('PUT /api/posts/:id - Should update a post', async () => {
        expect(postId).toBeDefined();

        const res = await request(app)
            .put(`/api/posts/${postId}`)
            .set('Cookie', userToken)
            .send({
                title: 'Updated Post Title',
                summary: 'Updated summary',
                content: '<p>Updated content</p>',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Updated Post Title');
    });

    test('DELETE /api/posts/:id - Should delete a post', async () => {
        expect(postId).toBeDefined();

        const res = await request(app)
            .delete(`/api/posts/${postId}`)
            .set('Cookie', userToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Post deleted');
    });
});
