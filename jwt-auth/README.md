# JWT Authentication API

A secure Node.js & Express API demonstrating JSON Web Token (JWT) authentication, password hashing, and Role-Based Access Control (RBAC). 

## 🚀 Features

- **User Registration & Login**: Secure account creation with encrypted passwords.
- **Password Security**: Passwords are mathematically hashed using `bcryptjs`.
- **Token-Based Auth**: Issues short-lived access tokens and long-lived refresh tokens upon login.
- **Route Protection**: Middleware ensures that only users with a valid JWT can access protected endpoints.
- **Role-Based Access Control (RBAC)**: Supports `user`, `owner`, and `admin` roles, restricting specific endpoints based on the user's role.

## 🛠️ Technologies Used

- **Node.js** & **Express.js** - Server framework
- **jsonwebtoken (JWT)** - For generating and verifying access tokens
- **bcryptjs** - For hashing passwords
- **uuid** - For generating unique user IDs
- **dotenv** - For environment variable management

## 📦 Installation & Setup

1. **Navigate to the project directory:**
   ```bash
   cd jwt-auth
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node index.js
   ```
   *The server will start running on `http://localhost:3000`.*

## 🧪 Testing the API

You can use the provided automated test script to run a full end-to-end check of all endpoints and roles:

```bash
node test-api.js
```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user. Body requires `username`, `email`, `password`, and `role`.
- `POST /auth/login` - Login to receive `accessToken` and `refreshToken`.
- `POST /auth/refresh` - Submit a valid refresh token to get a new access token.
- `POST /auth/logout` - Revoke the refresh token.

### Protected Routes (Requires JWT Token)
- `GET /health` - Public health check.
- `GET /profile` - **[Any Role]** View your own profile data.
- `GET /owner/resources` - **[Owner | Admin]** Access restricted owner resources.
- `GET /admin/dashboard` - **[Admin Only]** View system-wide stats.

### User Management
- `GET /users` - **[Admin Only]** List all users.
- `GET /users/:id` - **[Owner | Admin]** Get a specific user by ID.
- `PATCH /users/:id` - **[Owner | Admin]** Update user details.
- `DELETE /users/:id` - **[Admin Only]** Delete a user from the system.

## 🔒 Security Notes
- This project uses an in-memory database for demonstration purposes. In production, connect this to a real database like MongoDB or PostgreSQL.
- The `.env` file should never be committed to source control in a real production environment.
