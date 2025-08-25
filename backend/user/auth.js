import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";
const db = new SQLDatabase("users", {
    migrations: "./migrations",
});
const jwtSecret = secret("JWTSecret");
// Helper function to verify JWT tokens
const verifyJWTToken = (token) => {
    try {
        return jwt.verify(token, jwtSecret());
    }
    catch (error) {
        throw APIError.unauthenticated("Invalid token");
    }
};
// Registers a new user
export const register = api({ expose: true, method: "POST", path: "/auth/register" }, async (req) => {
    const { email, username, password } = req;
    // Check if user already exists
    const existingUser = await db.queryRow `
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `;
    if (existingUser) {
        throw APIError.alreadyExists("User with this email or username already exists");
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const userId = crypto.randomUUID();
    const now = new Date();
    await db.exec `
      INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
      VALUES (${userId}, ${email}, ${username}, ${hashedPassword}, ${now}, ${now})
    `;
    // Get created user
    const user = await db.queryRow `
      SELECT id, email, username, created_at, updated_at 
      FROM users WHERE id = ${userId}
    `;
    if (!user) {
        throw APIError.internal("Failed to create user");
    }
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });
    return {
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        },
        token
    };
});
// Logs in a user
export const login = api({ expose: true, method: "POST", path: "/auth/login" }, async (req) => {
    const { email, password } = req;
    // Get user with password hash
    const userRow = await db.queryRow `
      SELECT id, email, username, password_hash, created_at, updated_at
      FROM users WHERE email = ${email}
    `;
    if (!userRow) {
        throw APIError.unauthenticated("Invalid email or password");
    }
    // Verify password
    const isValidPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!isValidPassword) {
        throw APIError.unauthenticated("Invalid email or password");
    }
    // Generate JWT token
    const token = jwt.sign({ userId: userRow.id, email: userRow.email }, jwtSecret(), { expiresIn: "7d" });
    return {
        user: {
            id: userRow.id,
            email: userRow.email,
            username: userRow.username,
            createdAt: userRow.created_at,
            updatedAt: userRow.updated_at
        },
        token
    };
});
// Verifies a JWT token and returns user information
export const verifyToken = api({ expose: true, method: "POST", path: "/auth/verify" }, async (req) => {
    const { token } = req;
    try {
        const decoded = verifyJWTToken(token);
        // Get user from database
        const user = await db.queryRow `
        SELECT id, email, username, created_at, updated_at
        FROM users WHERE id = ${decoded.userId}
      `;
        if (!user) {
            throw APIError.unauthenticated("User not found");
        }
        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            },
            valid: true
        };
    }
    catch (error) {
        return {
            user: {},
            valid: false
        };
    }
});
// Gets the current user's profile
export const getProfile = api({ expose: true, method: "GET", path: "/auth/profile", auth: true }, async () => {
    // In a real implementation, you would get the user ID from the auth context
    // For now, we'll throw an error since auth is not fully implemented
    throw APIError.unimplemented("Profile endpoint requires full authentication implementation");
});
//# sourceMappingURL=auth.js.map