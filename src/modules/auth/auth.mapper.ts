import type { User } from "../../common/database/schema";

export function toUserResponse(user: User) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
