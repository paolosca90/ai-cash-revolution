interface User {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
}
interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}
interface LoginRequest {
    email: string;
    password: string;
}
interface AuthResponse {
    user: User;
    token: string;
}
interface VerifyTokenRequest {
    token: string;
}
interface VerifyTokenResponse {
    user: User;
    valid: boolean;
}
export declare const register: (params: RegisterRequest) => Promise<AuthResponse>;
export declare const login: (params: LoginRequest) => Promise<AuthResponse>;
export declare const verifyToken: (params: VerifyTokenRequest) => Promise<VerifyTokenResponse>;
interface GetProfileResponse {
    user: User;
}
export declare const getProfile: () => Promise<GetProfileResponse>;
export {};
