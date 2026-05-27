import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/cms-auth";
import {
  normalizeOraclePosterUpload,
  OraclePosterError,
  saveOraclePoster,
} from "@/lib/oracle-storage";

const ALLOWED_FIELDS = [
  "name",
  "title",
  "description",
  "avatarUrl",
  "posterUrl",
  "systemPrompt",
  "speciality",
  "isActive",
  "sortOrder",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

type UpdatePayload = Partial<Record<AllowedField, unknown>> & {
  posterBuffer?: Buffer;
};

async function parseUpdateBody(req: NextRequest): Promise<UpdatePayload> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const payload: UpdatePayload = {};

    for (const field of ALLOWED_FIELDS) {
      const value = form.get(field);
      if (value === null) continue;

      if (field === "isActive") {
        payload.isActive = value === "true";
        continue;
      }

      if (field === "sortOrder") {
        const parsed = parseInt(String(value), 10);
        if (!Number.isNaN(parsed)) payload.sortOrder = parsed;
        continue;
      }

      if (typeof value === "string") {
        payload[field] = value;
      }
    }

    const poster = form.get("poster");
    if (poster instanceof File && poster.size > 0) {
      payload.posterBuffer = Buffer.from(await poster.arrayBuffer());
    }

    return payload;
  }

  const body = await req.json();
  const payload: UpdatePayload = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      payload[field] = body[field];
    }
  }

  return payload;
}

// GET /api/cms/oracles/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const oracle = await prisma.oracle.findUnique({ where: { id } });
  if (!oracle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(oracle);
}

// PUT /api/cms/oracles/[id] — แก้ไข (+ optional poster upload)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  const existing = await prisma.oracle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await parseUpdateBody(req);
  const updateData: Record<string, unknown> = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body && field !== "posterUrl") {
      updateData[field] = body[field];
    }
  }

  try {
    if (body.posterBuffer) {
      const normalized = await normalizeOraclePosterUpload(body.posterBuffer);
      updateData.posterUrl = await saveOraclePoster(existing.slug, normalized);
    } else if (typeof body.posterUrl === "string") {
      updateData.posterUrl = body.posterUrl || null;
    }
  } catch (error) {
    if (error instanceof OraclePosterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[cms/oracles PUT] poster upload failed:", error);
    return NextResponse.json({ error: "อัปโหลดรูปไม่สำเร็จ" }, { status: 500 });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const oracle = await prisma.oracle.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(oracle);
}

// DELETE /api/cms/oracles/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireRole("ADMIN", "SUPERADMIN")(req);
  if (deny) return deny;

  const { id } = await params;
  await prisma.oracle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
