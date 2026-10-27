import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import Program from '../models/Program.js';
import ProgressState from '../models/ProgressState.js';

function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'reptrack_super_secure_jwt_secret_key_2026_dev',
    { expiresIn: '30d' }
  );
}

// @route POST /api/auth/register
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    // Set default active program if available
    const defaultProgram = await Program.findOne({ userId: null });
    if (defaultProgram) {
      user.activeProgram = defaultProgram._id;
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        activeProgram: user.activeProgram,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
}

// @route POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        activeProgram: user.activeProgram,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
}

// @route GET /api/auth/me
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('activeProgram');
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

// @route PUT /api/auth/settings
export async function updateSettings(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.settings = {
      ...user.settings.toObject(),
      ...req.body,
    };

    await user.save();

    res.json({
      success: true,
      settings: user.settings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
}
