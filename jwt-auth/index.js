// index.js
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🔐 JWT Auth API running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   /auth/register       - Register a new user`);
  console.log(`  POST   /auth/login          - Login and receive tokens`);
  console.log(`  POST   /auth/refresh        - Rotate tokens`);
  console.log(`  POST   /auth/logout         - Revoke refresh token`);
  console.log(`  GET    /health              - Health check`);
  console.log(`  GET    /profile             - [auth] Get own profile`);
  console.log(`  GET    /users               - [admin] List all users`);
  console.log(`  GET    /users/:id           - [owner|admin] Get user by ID`);
  console.log(`  PATCH  /users/:id           - [owner|admin] Update user`);
  console.log(`  DELETE /users/:id           - [admin] Delete user`);
  console.log(`  GET    /admin/dashboard     - [admin] Admin stats`);
  console.log(`  GET    /owner/resources     - [owner|admin] Owner resources\n`);
});
