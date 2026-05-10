// test-api.js  — Run with: node test-api.js
// Exercises every endpoint end-to-end against a running server.

const BASE = 'http://localhost:3000';

let adminToken, adminRefresh, adminId;
let userToken, userRefresh, userId;
let ownerToken, ownerRefresh, ownerId;

const req = async (method, path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
};

const log = (label, status, data) => {
  const ok = status < 400 ? '✅' : '❌';
  console.log(`\n${ok} [${status}] ${label}`);
  console.log(JSON.stringify(data, null, 2));
};

(async () => {
  console.log('=== JWT Auth API Tests ===\n');

  // 1. Register admin (first user gets admin if role=admin passed)
  let r = await req('POST', '/auth/register', {
    username: 'superadmin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
  });
  log('Register admin', r.status, r.data);
  adminToken = r.data.data?.accessToken;
  adminRefresh = r.data.data?.refreshToken;
  adminId = r.data.data?.user?.id;

  // 2. Register regular user
  r = await req('POST', '/auth/register', {
    username: 'regularuser',
    email: 'user@example.com',
    password: 'User1234!',
    role: 'user',
  });
  log('Register user', r.status, r.data);
  userToken = r.data.data?.accessToken;
  userId = r.data.data?.user?.id;

  // 3. Register owner
  r = await req('POST', '/auth/register', {
    username: 'shopowner',
    email: 'owner@example.com',
    password: 'Owner123!',
    role: 'owner',
  });
  log('Register owner', r.status, r.data);
  ownerToken = r.data.data?.accessToken;
  ownerRefresh = r.data.data?.refreshToken;
  ownerId = r.data.data?.user?.id;

  // 4. Login
  r = await req('POST', '/auth/login', { email: 'admin@example.com', password: 'Admin123!' });
  log('Login admin', r.status, r.data);

  // 5. Get profile (authenticated)
  r = await req('GET', '/profile', null, userToken);
  log('GET /profile (user)', r.status, r.data);

  // 6. Admin: list all users
  r = await req('GET', '/users', null, adminToken);
  log('GET /users (admin)', r.status, r.data);

  // 7. User tries to list all users → 403
  r = await req('GET', '/users', null, userToken);
  log('GET /users (user → 403)', r.status, r.data);

  // 8. Owner accesses their own resources
  r = await req('GET', '/owner/resources', null, ownerToken);
  log('GET /owner/resources (owner)', r.status, r.data);

  // 9. User tries owner resources → 403
  r = await req('GET', '/owner/resources', null, userToken);
  log('GET /owner/resources (user → 403)', r.status, r.data);

  // 10. Admin dashboard
  r = await req('GET', '/admin/dashboard', null, adminToken);
  log('GET /admin/dashboard (admin)', r.status, r.data);

  // 11. Get specific user by ID (owner of that ID)
  r = await req('GET', `/users/${userId}`, null, userToken);
  log(`GET /users/${userId} (owner)`, r.status, r.data);

  // 12. Get OTHER user's profile as regular user → 403
  r = await req('GET', `/users/${adminId}`, null, userToken);
  log(`GET /users/${adminId} (not owner → 403)`, r.status, r.data);

  // 13. Admin can get any user
  r = await req('GET', `/users/${userId}`, null, adminToken);
  log(`GET /users/${userId} (admin)`, r.status, r.data);

  // 14. Owner updates own record
  r = await req('PATCH', `/users/${ownerId}`, { username: 'shopowner_updated' }, ownerToken);
  log('PATCH /users/:id (owner updates self)', r.status, r.data);

  // 15. Admin promotes user to owner
  r = await req('PATCH', `/users/${userId}`, { role: 'owner' }, adminToken);
  log('PATCH /users/:id (admin changes role)', r.status, r.data);

  // 16. Refresh tokens
  r = await req('POST', '/auth/refresh', { refreshToken: ownerRefresh });
  log('POST /auth/refresh', r.status, r.data);

  // 17. Try with no token → 401
  r = await req('GET', '/profile');
  log('GET /profile (no token → 401)', r.status, r.data);

  // 18. Logout
  r = await req('POST', '/auth/logout', { refreshToken: adminRefresh });
  log('POST /auth/logout', r.status, r.data);

  // 19. Admin deletes user
  r = await req('DELETE', `/users/${userId}`, null, adminToken);
  log('DELETE /users/:id (admin)', r.status, r.data);

  // 20. Validation error test
  r = await req('POST', '/auth/register', { username: 'ab', email: 'bad', password: '123' });
  log('Register with bad data (422)', r.status, r.data);

  console.log('\n=== Tests complete ===\n');
})();
