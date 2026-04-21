/**
 * Typed custom error classes for consistent error handling.
 */

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class YouTubeError extends AppError {
  constructor(message: string, code = "YOUTUBE_API_ERROR", details?: unknown) {
    super(message, 502, code, details);
    this.name = "YouTubeError";
  }
}

export class YouTubeRateLimitError extends YouTubeError {
  constructor() {
    super("YouTube API rate limit exceeded. Please try again later.", "YOUTUBE_RATE_LIMIT");
    this.name = "YouTubeRateLimitError";
  }
}

export class VideoNotFoundError extends YouTubeError {
  constructor(videoId: string) {
    super(`Video ${videoId} not found`, "VIDEO_NOT_FOUND");
    this.name = "VideoNotFoundError";
  }
}

export class YouTubeAuthRequired extends AppError {
  constructor(action: string) {
    super(
      `A connected YouTube account is required to ${action}. Sign in with Google and grant YouTube permissions.`,
      403,
      "YOUTUBE_AUTH_REQUIRED"
    );
    this.name = "YouTubeAuthRequired";
  }
}

/** Map any unknown thrown value to an AppError-shaped object for JSON responses. */
export function toErrorResponse(err: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof Error) {
    // Detect common YouTube error patterns
    const msg = err.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("429")) {
      return { code: "YOUTUBE_RATE_LIMIT", message: "YouTube rate limit. Retry shortly." };
    }
    if (msg.includes("not found") || msg.includes("404")) {
      return { code: "NOT_FOUND", message: err.message };
    }
    return { code: "INTERNAL_ERROR", message: err.message };
  }
  return { code: "INTERNAL_ERROR", message: "An unexpected error occurred" };
}
