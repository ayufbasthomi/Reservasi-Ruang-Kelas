// routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // mongoose schema with TS types

const router = Router();
const SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    // console.log('Incoming register body:', req.body);
    const { username, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Save user with role (default to 'user' if not provided)
    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role && ['user', 'admin'].includes(role) ? role : 'user',
    });

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '1d' });
  res.json({ token, user });
});

// Get profile
router.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, SECRET) as { id: string; role: string };
    const user = await User.findById(decoded.id).select('-password'); // hide password
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update profile
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded: any = jwt.verify(token, SECRET);

    const updates: Partial<{ username: string; email: string; password: string }> = {
      username: req.body.username,
      email: req.body.email,
    };

    if (req.body.password) {
      const hashed = await bcrypt.hash(req.body.password, 10);
      updates.password = hashed;
    }

    const user = await User.findByIdAndUpdate(decoded.id, updates, { new: true });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
