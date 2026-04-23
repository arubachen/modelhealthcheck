import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { readManualImageVerificationPreview } from "@/lib/manual-image-verifications";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ configId: string }> }
): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { configId } = await context.params;
  const preview = await readManualImageVerificationPreview(configId);
  if (!preview) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(preview.buffer), {
    headers: {
      "Content-Type": preview.contentType,
      "Cache-Control": "no-store",
    },
  });
}
