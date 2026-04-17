import express from 'express';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth.js';
import Employee from '../models/User.js';

const User = Employee; // Alias for minimal breakage during transition if needed, but better to just use User

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        const { userId, employeeId, adminId, password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const loginId = userId || employeeId || adminId;

        if (!loginId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findOne({ userId: loginId });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create user payload
        const userPayload = {
            id: user.userId, // Use userId as the main identifier
            username: user.name,
            role: user.role,
            iat: Math.floor(Date.now() / 1000)
        };

        // Generate JWT token
        const token = generateToken(userPayload);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            user: {
                id: user.userId,
                username: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Get current user (verify token)
router.get('/me', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

        res.json({
            user: {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;