import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
const db = new SQLDatabase("user", {
    migrations: "./migrations",
});
// Creates a new user account
export const createUser = api({ expose: true, method: "POST", path: "/users" }, async (req) => {
    const { email, username, password, firstName, lastName } = req;
    // In a real implementation, hash the password properly
    const passwordHash = `hashed_${password}`;
    const result = await db.queryRow `
      INSERT INTO users (email, username, password_hash, first_name, last_name)
      VALUES (${email}, ${username}, ${passwordHash}, ${firstName || null}, ${lastName || null})
      RETURNING id, email, username, first_name, last_name, created_at, updated_at
    `;
    if (!result) {
        throw new Error("Failed to create user");
    }
    const user = {
        id: result.id,
        email: result.email,
        username: result.username,
        firstName: result.first_name || undefined,
        lastName: result.last_name || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at
    };
    return { user };
});
// Retrieves a user by ID
export const getUser = api({ expose: true, method: "GET", path: "/users/:id" }, async (req) => {
    const { id } = req;
    const result = await db.queryRow `
      SELECT id, email, username, first_name, last_name, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `;
    if (!result) {
        throw new Error("User not found");
    }
    const user = {
        id: result.id,
        email: result.email,
        username: result.username,
        firstName: result.first_name || undefined,
        lastName: result.last_name || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at
    };
    return { user };
});
//# sourceMappingURL=profile.js.map