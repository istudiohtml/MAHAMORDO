import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { isCmsAdminRole } from "@/lib/cms-auth";
import { prisma } from "@/lib/prisma";

export type CmsSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

/** Server-side: resolve admin session from cms_token or user_token */
export async function getCmsSessionUser(): Promise<CmsSessionUser | null> {
  const cookieStore = await cookies();

  const cmsToken = cookieStore.get("cms_token")?.value;
  let payload = cmsToken ? await verifyAccessToken(cmsToken) : null;

  if (!payload || !isCmsAdminRole(payload.role)) {
    const userToken = cookieStore.get("user_token")?.value;
    payload = userToken ? await verifyAccessToken(userToken) : null;
  }

  if (!payload || !isCmsAdminRole(payload.role)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || !isCmsAdminRole(user.role)) {
    return null;
  }

  return user;
}
