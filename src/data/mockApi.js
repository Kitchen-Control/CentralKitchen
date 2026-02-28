// src/data/mockApi.js
// ⚠️ CHỈ DÙNG ĐỂ TEST - KHÔNG DÙNG TRONG PRODUCTION
// Mock users cho 7 roles: admin, manager, store, kitchen, coordinator, shipper, warehouse

const MOCK_USERS = [
  {
    username: 'admin',
    password: '123456',
    user: {
      user_id: 1,
      username: 'admin',
      full_name: 'Nguyễn Admin',
      role_id: 1,
      role: { role_id: 1, role_name: 'Admin' },
      store_id: null,
      store: null,
      token: 'mock-token-admin',
    },
  },
  {
    username: 'manager',
    password: '123456',
    user: {
      user_id: 2,
      username: 'manager',
      full_name: 'Trần Manager',
      role_id: 2,
      role: { role_id: 2, role_name: 'Manager' },
      store_id: null,
      store: null,
      token: 'mock-token-manager',
    },
  },
  {
    username: 'store',
    password: '123456',
    user: {
      user_id: 3,
      username: 'store',
      full_name: 'Lê Store Staff',
      role_id: 3,
      role: { role_id: 3, role_name: 'Store Staff' },
      store_id: 1,
      store: { store_id: 1, store_name: 'Cửa hàng Quận 1' },
      token: 'mock-token-store',
    },
  },
  {
    username: 'kitchen',
    password: '123456',
    user: {
      user_id: 4,
      username: 'kitchen',
      full_name: 'Phạm Kitchen Manager',
      role_id: 4,
      role: { role_id: 4, role_name: 'Kitchen Manager' },
      store_id: null,
      store: null,
      token: 'mock-token-kitchen',
    },
  },
  {
    username: 'coordinator',
    password: '123456',
    user: {
      user_id: 5,
      username: 'coordinator',
      full_name: 'Hoàng Supply Coordinator',
      role_id: 5,
      role: { role_id: 5, role_name: 'Supply Coordinator' },
      store_id: null,
      store: null,
      token: 'mock-token-coordinator',
    },
  },
  {
    username: 'shipper',
    password: '123456',
    user: {
      user_id: 6,
      username: 'shipper',
      full_name: 'Vũ Shipper',
      role_id: 6,
      role: { role_id: 6, role_name: 'Shipper' },
      store_id: null,
      store: null,
      token: 'mock-token-shipper',
    },
  },
  {
    username: 'warehouse',
    password: '123456',
    user: {
      user_id: 7,
      username: 'warehouse',
      full_name: 'Đặng Warehouse',
      role_id: 7,
      role: { role_id: 7, role_name: 'Warehouse' },
      store_id: null,
      store: null,
      token: 'mock-token-warehouse',
    },
  },
];

/**
 * Mock loginUser - giả lập API đăng nhập để test frontend mà không cần backend.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
export const mockLoginUser = async (username, password) => {
  // Giả lập độ trễ mạng 300ms
  await new Promise((resolve) => setTimeout(resolve, 300));

  const found = MOCK_USERS.find(
    (u) =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.password === password
  );

  if (!found) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
  }

  return {
    user: { ...found.user },
    token: found.user.token,
  };
};

/**
 * Danh sách tài khoản mock để hiển thị hint trên UI.
 */
export const MOCK_ACCOUNTS = MOCK_USERS.map((u) => ({
  username: u.username,
  password: u.password,
  role: u.user.role.role_name,
  full_name: u.user.full_name,
}));
