import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { nanoid } from "nanoid";

const SESSION_COOKIE = "shop_session_token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
};

export async function login(
  email: string,
  password: string,
  metadata?: { userAgent: string | null; ipAddress: string | null }
): Promise<SessionUser | null | string> {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email }
    });
    
    if (!user || !user.active) return null;
    
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    // Create Database Session
    const token = nanoid(32);
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        lastIp: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      }
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    };
  } catch (error: any) {
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database server")) {
      return "Không thể kết nối cơ sở dữ liệu PostgreSQL. Vui lòng kiểm tra server DB!";
    }
    return "Đã xảy ra lỗi trong quá trình xác thực.";
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Ignore error on logout if DB unreachable
  }
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    
    const dbSession = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!dbSession || !dbSession.user.active) return null;

    return {
      id: dbSession.user.id,
      email: dbSession.user.email,
      name: dbSession.user.name,
      role: dbSession.user.role,
      isSuperAdmin: dbSession.user.isSuperAdmin,
    };
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
