const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const authService = require("./auth.service");

const DEFAULT_DEPARTMENT = "Library Administration";

const ADMIN_PRIVILEGES = [
  "Manage Members",
  "Manage Books",
  "Manage Borrows",
  "Manage Fines",
  "View Reports",
  "System Settings",
];

const ADMIN_SELECT = {
  id: true,
  userId: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  department: true,
  avatarColor: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new ApiError(404, "User not found.");
  if (user.role !== "admin") {
    throw new ApiError(403, "Only admin users can access admin profile.");
  }

  const adminProfile = await prisma.librarian.findUnique({
    where: { userId },
    select: ADMIN_SELECT,
  });

  if (!adminProfile) {
    return {
      id: null,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: null,
      address: null,
      department: DEFAULT_DEPARTMENT,
      avatarColor: null,
      avatarUrl: null,
      role: user.role,
      privileges: ADMIN_PRIVILEGES,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  return {
    ...adminProfile,
    department: adminProfile.department || DEFAULT_DEPARTMENT,
    role: user.role,
    privileges: ADMIN_PRIVILEGES,
  };
};

const updateProfile = async (userId, data) => {
  const { name, phone, address, department, avatarColor, avatarUrl } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) throw new ApiError(404, "User not found.");
  if (user.role !== "admin") {
    throw new ApiError(403, "Only admin users can update admin profile.");
  }

  await prisma.librarian.upsert({
    where: { userId },
    update: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(department !== undefined && { department }),
      ...(avatarColor !== undefined && { avatarColor }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    create: {
      userId,
      name: name ?? user.name,
      email: user.email,
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      department: department ?? DEFAULT_DEPARTMENT,
      ...(avatarColor !== undefined && { avatarColor }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });

  if (name !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { name } });
  }

  return getProfile(userId);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  return authService.changePassword(userId, currentPassword, newPassword);
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
