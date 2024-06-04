import bcrypt from 'bcrypt';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendMail.js';

import UserRepository from '../reporitory/userRepository.js';
import OtpRepository from '../reporitory/otpRepository.js';
import TokenRepository from '../reporitory/tokenRepository.js';

const JWT_SECRET = process.env.JWT_SECRET;
const { escape } = validator;

const User = new UserRepository();
const Otp = new OtpRepository();
const Token = new TokenRepository();

export async function signup(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }
    //Sanitizing the input to prevent attacks
    const sanitizedUsername = escape(username);
    const sanitizedEmail = escape(email);

    try {
        // Check if user already exists
        const [existingUser, existingOtp] = await Promise.all([
            User.findUserByEmail(sanitizedEmail),
            Otp.findOtpByEmail(sanitizedEmail)
        ])
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        if (existingOtp) {
            await Otp.deleteOtpByEmail(sanitizedEmail)
        }
        //Create a random otp for user and save it in database
        const otp = Math.floor(1000 + Math.random() * 9000);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.createUser({
            username: sanitizedUsername,
            email: sanitizedEmail,
            password: hashedPassword,
        });

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        // Store refresh token  and otp in database then send email
        await Promise.all([
            Token.storeRefreshToken(newUser._id, refreshToken),
            Otp.createOtp({ email: sanitizedEmail, otp }),
            sendMail(newUser.email, otp)
        ]);
        res.json({ accessToken, refreshToken, user: newUser }).status(201);
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ error: 'An error occurred while signing up' });
    }
}

export async function validateOtp(req, res) {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const sanitizedEmail = validator.escape(email);

    try {
        // Find the OTP for the given email
        const foundOtp = await Otp.findOtpByEmail(sanitizedEmail);

        if (!foundOtp) {
            return res.status(400).json({ error: 'OTP not found or has expired' });
        }

        // Check if OTP has expired
        if (foundOtp.expirationDate < new Date()) {
            await Otp.deleteOtpByEmail(sanitizedEmail);
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Validate the provided OTP with the stored OTP
        if (foundOtp.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP is valid, delete it
        await Otp.deleteOtpByEmail(sanitizedEmail);
        await User.updateUser(sanitizedEmail, { verified: true })
        // Respond with success
        res.status(200).json({ message: 'OTP validated successfully' });
    } catch (error) {
        console.error('Error validating OTP:', error);
        res.status(500).json({ error: 'An error occurred while validating OTP' });
    }
}

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const sanitizedEmail = escape(email);

    try {
        // Check if user exists
        const user = await User.findUserByEmail(sanitizedEmail);
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Store refresh token in database
        await Token.storeRefreshToken(user._id, refreshToken);

        res.json({ accessToken, refreshToken ,user }).status(200);
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'An error occurred while logging in' });
    }
}

export async function resendOtp(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const sanitizedEmail = validator.escape(email);

    try {
        // Check if user exists
        const user = await User.findUserByEmail(sanitizedEmail);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete current OTP if it exists
        await Otp.deleteOtpByEmail(sanitizedEmail);

        // Create a new OTP
        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log(otp)
        // Save the new OTP in the database and send OTP email concurrently
        await Promise.all([
            Otp.createOtp({ email: sanitizedEmail, otp }),
            sendMail(sanitizedEmail, otp)
        ]);
        console.log('nothing found')
        // Respond with success message
        res.status(200).json({ message: 'OTP has been resent successfully' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ error: 'An error occurred while resending OTP' });
    }
}


export async function getUserDetails(req, res) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'Access token is missing' });
    }

    try {
        // Decode JWT token
        const decodedToken = jwt.verify(token, JWT_SECRET);

        // Retrieve user details using user ID from token
        const user = await User.getUserById(decodedToken.userId)

        // Send user details in response
        res.json(user).status(200);
    } catch (error) {
        console.error('Error retrieving user details:', error);
        res.status(500).json({ error: 'An error occurred while retrieving user details' });
    }
}

export async function dashboardData (req, res){
    try {
        const usersWithoutRole = await User.getUsersWithoutRole('1313');
        res.json(usersWithoutRole).status(200);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'An error occurred while fetching dashboard data' });
    }
}

// function to handle updating the username
export async function updateUsername(req, res) {
    const { userId, newUsername } = req.body;

    if (!userId || !newUsername) {
        return res.status(400).json({ error: 'User ID and new username are required' })
    }
    //Sanitizing the input to prevent attacks
    const sanitizedUserId = escape(userId);
    const sanitizedNewUsername = escape(newUsername);

    try {
        // Find the user by userId
        const user = await User.getUserById(sanitizedUserId);

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the username
        user.username = sanitizedNewUsername;

        // Save the updated user
        await user.save();

        // Respond with a success message
        return res.json({ message: 'Username updated successfully' }).status(200);
    } catch (error) {
        console.error('Error updating username:', error);
        return res.status(500).json({ error: 'An error occurred while updating username' });
    }
}

export async function logout(req, res) {
    const refreshToken = req.body.refreshToken;

    try {
        // Delete the refresh token from the database
        await Token.deleteOne({ token: refreshToken });

        // Respond with a success message
        res.json({ message: 'Logout successful' }).status(200);
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'An error occurred while logging out' });
    }
}

//Function to refresh token - exported to middleware
export async function refreshToken(req, res) {
    const refreshToken = req.body.refreshToken;

    try {
        // Verify refresh token
        const decodedToken = jwt.verify(refreshToken, JWT_SECRET);

        // Retrieve user ID from token
        const userId = decodedToken.userId;
        console.log(userId+'from user refresh token')
        // Check if refresh token exists in the database
        const token = await Token.findTokenByUserId( userId, refreshToken );
        if (!token) {
            throw new Error('Invalid refresh token');
        }

        // Generate new access token
        const accessToken = generateAccessToken(userId);

        res.json({ accessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}

function generateAccessToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}