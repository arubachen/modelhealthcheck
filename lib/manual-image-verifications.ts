import "server-only";

import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const MANUAL_IMAGE_VERIFICATION_ROUTE_PREFIX = "/api/admin/image-verifications/";
const MANUAL_IMAGE_VERIFICATION_RELATIVE_DIRECTORY = path.join(
  ".sisyphus",
  "local-data",
  "image-verifications"
);

const MEDIA_TYPE_TO_EXTENSION = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

const EXTENSION_TO_MEDIA_TYPE = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

function getManualImageVerificationDirectory(): string {
  return path.resolve(process.cwd(), MANUAL_IMAGE_VERIFICATION_RELATIVE_DIRECTORY);
}

function normalizeConfigId(configId: string): string {
  const normalized = configId.trim();
  if (!normalized || normalized !== path.basename(normalized) || !/^[a-zA-Z0-9-]+$/.test(normalized)) {
    throw new Error("非法图片验证配置 ID");
  }
  return normalized;
}

function resolveExtension(mediaType: string): string {
  return MEDIA_TYPE_TO_EXTENSION.get(mediaType) ?? ".png";
}

async function removeExistingPreviewVariants(configId: string): Promise<void> {
  const directory = getManualImageVerificationDirectory();
  const normalizedId = normalizeConfigId(configId);
  const candidates = [".png", ".jpg", ".jpeg", ".webp"].map((extension) =>
    path.join(directory, `${normalizedId}${extension}`)
  );

  await Promise.all(candidates.map((target) => rm(target, { force: true })));
}

export async function saveManualImageVerificationPreview(input: {
  configId: string;
  uint8Array: Uint8Array;
  mediaType: string;
}): Promise<string> {
  const directory = getManualImageVerificationDirectory();
  const normalizedId = normalizeConfigId(input.configId);
  const extension = resolveExtension(input.mediaType);

  await mkdir(directory, { recursive: true });
  await removeExistingPreviewVariants(normalizedId);

  const absolutePath = path.join(directory, `${normalizedId}${extension}`);
  await writeFile(absolutePath, Buffer.from(input.uint8Array));

  return `${MANUAL_IMAGE_VERIFICATION_ROUTE_PREFIX}${normalizedId}`;
}

async function resolveExistingPreviewPath(configId: string): Promise<string | null> {
  const directory = getManualImageVerificationDirectory();
  const normalizedId = normalizeConfigId(configId);

  for (const extension of [".png", ".jpg", ".jpeg", ".webp"]) {
    const candidate = path.join(directory, `${normalizedId}${extension}`);
    try {
      await stat(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  return null;
}

export async function getManualImageVerificationPreviewUrl(
  configId: string,
  checkedAt?: string | null
): Promise<string | null> {
  const absolutePath = await resolveExistingPreviewPath(configId);
  if (!absolutePath) {
    return null;
  }

  const baseUrl = `${MANUAL_IMAGE_VERIFICATION_ROUTE_PREFIX}${normalizeConfigId(configId)}`;
  if (!checkedAt) {
    return baseUrl;
  }

  return `${baseUrl}?ts=${encodeURIComponent(checkedAt)}`;
}

export async function readManualImageVerificationPreview(configId: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  const absolutePath = await resolveExistingPreviewPath(configId);
  if (!absolutePath) {
    return null;
  }

  const buffer = await readFile(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();

  return {
    buffer,
    contentType: EXTENSION_TO_MEDIA_TYPE.get(extension) ?? "application/octet-stream",
  };
}
