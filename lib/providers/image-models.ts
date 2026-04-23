import type { ProviderConfig } from "../types";

export const MANUAL_IMAGE_VERIFY_MESSAGE_PREFIX = "[manual-image-verify]";
export const MANUAL_IMAGE_VERIFY_COOLDOWN_MS = 30 * 60 * 1000;

export function isOpenAIImageGenerationModel(
  model: string,
  type?: ProviderConfig["type"] | string
): boolean {
  if (type && type !== "openai") {
    return false;
  }

  const normalized = model.trim().toLowerCase();
  return normalized.startsWith("gpt-image-") || normalized.startsWith("dall-e-");
}

export function stripOpenAICompatModelPrefix(model: string): string {
  const trimmed = model.trim();
  const slashIndex = trimmed.indexOf("/");
  if (slashIndex === -1) {
    return trimmed;
  }
  return trimmed.slice(slashIndex + 1).trim() || trimmed;
}

export function getManualImageVerificationPrompt(modelId: string): string {
  const normalizedModel = modelId.trim().toLowerCase();
  if (normalizedModel.includes("transparent")) {
    return "A single small black circle centered on a transparent background. Minimal flat icon, no text."
  }

  return "A plain white square with one small black dot centered in the image. Minimal, flat, no text, no extra objects.";
}

export function buildManualImageVerificationMessage(message: string): string {
  return `${MANUAL_IMAGE_VERIFY_MESSAGE_PREFIX} ${message}`;
}
