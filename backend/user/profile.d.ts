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
export declare const createUser: (params: CreateUserRequest) => Promise<CreateUserResponse>;
export declare const getUser: (params: GetUserRequest) => Promise<GetUserResponse>;
export {};
