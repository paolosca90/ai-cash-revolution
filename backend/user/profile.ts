import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("user", {
  migrations: "./migrations",
});

interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface CreateUserResponse {
  user: Omit<User, 'password'>;
}

interface GetUserRequest {
  id: number;
}

interface GetUserResponse {
  user: Omit<User, 'password'>;
}

// Creates a new user account
export const createUser = api<CreateUserRequest, CreateUserResponse>(
  { expose: true, method: "POST", path: "/users" },
  async (req) => {
    const { email, username, password, firstName, lastName } = req;
    
    // In a real implementation, hash the password properly
    const passwordHash = `hashed_${password}`;
    
    const result = await db.queryRow<{
      id: number;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO users (email, username, password_hash, first_name, last_name)
      VALUES (${email}, ${username}, ${passwordHash}, ${firstName || null}, ${lastName || null})
      RETURNING id, email, username, first_name, last_name, created_at, updated_at
    `;
    
    if (!result) {
      throw new Error("Failed to create user");
    }
    
    const user: Omit<User, 'password'> = {
      id: result.id,
      email: result.email,
      username: result.username,
      firstName: result.first_name || undefined,
      lastName: result.last_name || undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
    
    return { user };
  }
);

// Retrieves a user by ID
export const getUser = api<GetUserRequest, GetUserResponse>(
  { expose: true, method: "GET", path: "/users/:id" },
  async (req) => {
    const { id } = req;
    
    const result = await db.queryRow<{
      id: number;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, email, username, first_name, last_name, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `;
    
    if (!result) {
      throw new Error("User not found");
    }
    
    const user: Omit<User, 'password'> = {
      id: result.id,
      email: result.email,
      username: result.username,
      firstName: result.first_name || undefined,
      lastName: result.last_name || undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
    
    return { user };
  }
);
