import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection.js';
import { z } from 'zod';
const router = Router();
// Validation schemas
const RegisterSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6)
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});
// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = RegisterSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Create user
        const result = await query(`
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at
    `, [username, email, hashedPassword]);
        const user = result.rows[0];
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '24h' });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            },
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = LoginSchema.parse(req.body);
        // Find user
        const result = await query('SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '24h' });
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});
// Verify token endpoint
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        // Get fresh user data
        const result = await query('SELECT id, username, email, created_at FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
// Get profile endpoint (protected)
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        const result = await query('SELECT id, username, email, created_at FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
export default router;
//# sourceMappingURL=auth.js.map