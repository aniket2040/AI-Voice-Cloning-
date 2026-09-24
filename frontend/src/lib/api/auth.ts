import { apiClient } from './client';
import {
  UserLoginRequest,
  UserLoginResponse,
  UserRegistrationRequest,
  UserRegistrationResponse,
  CurrentUserResponse,
} from '../types';
import { API_ENDPOINTS } from '../env';

/**
 * 1. Register User
 * Calls POST /api/auth/register
 * Request Body: UserRegistrationRequest { name, email, password }
 * Response: UserRegistrationResponse { id, name, email, created_at }
 * Status Code: 201 Created
 * Possible Errors: 409 Conflict (UserRegistrationError)
 */
export async function registerUser(
  payload: UserRegistrationRequest
): Promise<{ data: UserRegistrationResponse | null; error: string | null; status: number }> {
  return apiClient<UserRegistrationResponse>(API_ENDPOINTS.AUTH_REGISTER, {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
    }),
  });
}

/**
 * 2. Login User
 * Calls POST /api/auth/login
 * Request Body: UserLoginRequest { email, password }
 * Response: UserLoginResponse { access_token, token_type: "bearer" }
 * Status Code: 200 OK
 * Possible Errors: 401 Unauthorized (UserLoginError)
 */
export async function loginUser(
  payload: UserLoginRequest
): Promise<{ data: UserLoginResponse | null; error: string | null; status: number }> {
  return apiClient<UserLoginResponse>(API_ENDPOINTS.AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });
}

/**
 * 3. Get Current Authenticated User Profile
 * Calls GET /api/auth/me
 * Dependencies: current_user: User = Depends(get_current_user)
 * Headers: Authorization: Bearer <access_token>
 * Response: CurrentUserResponse { id, name, email, created_at }
 * Status Code: 200 OK
 */
export async function getCurrentUser(): Promise<{
  data: CurrentUserResponse | null;
  error: string | null;
  status: number;
}> {
  return apiClient<CurrentUserResponse>(API_ENDPOINTS.AUTH_ME, {
    method: 'GET',
  });
}
