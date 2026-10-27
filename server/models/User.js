import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    settings: {
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
      },
      default1RmFormula: {
        type: String,
        enum: ['epley', 'brzycki', 'lombardi', 'mayhew', 'oconner', 'wathen', 'average'],
        default: 'epley',
      },
      barWeightKg: {
        type: Number,
        default: 20,
      },
      barWeightLbs: {
        type: Number,
        default: 45,
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
      restTimerAutoStart: {
        type: Boolean,
        default: true,
      },
    },
    activeProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcryptjs before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
