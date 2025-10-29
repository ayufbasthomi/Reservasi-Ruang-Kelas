"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/auth.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User")); // mongoose schema with TS types
const router = (0, express_1.Router)();
const SECRET = process.env.JWT_SECRET || 'your_secret_key';
// Register
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log('Incoming register body:', req.body);
        const { username, email, password, role } = req.body;
        // Check if email already exists
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email sudah digunakan' });
        }
        // Hash password
        const hashed = yield bcryptjs_1.default.hash(password, 10);
        // Save user with role (default to 'user' if not provided)
        const user = yield User_1.default.create({
            username,
            email,
            password: hashed,
            role: role && ['user', 'admin'].includes(role) ? role : 'user',
        });
        // Generate token
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, SECRET, {
            expiresIn: '1d',
        });
        res.status(201).json({ user, token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(401).json({ message: 'User not found' });
    const valid = yield bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ message: 'Invalid password' });
    const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '1d' });
    res.json({ token, user });
}));
// Get profile
router.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        const user = yield User_1.default.findById(decoded.id).select('-password'); // hide password
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}));
// Update profile
router.patch('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token)
            return res.status(401).json({ message: 'No token' });
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        const updates = {
            username: req.body.username,
            email: req.body.email,
        };
        if (req.body.password) {
            const hashed = yield bcryptjs_1.default.hash(req.body.password, 10);
            updates.password = hashed;
        }
        const user = yield User_1.default.findByIdAndUpdate(decoded.id, updates, { new: true });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
