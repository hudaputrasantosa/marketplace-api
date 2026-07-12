import { z } from "zod";
import { HttpStatus } from "../constants/http-status";
import { ErrorCode } from "../errors/error-codes";

export function successResponseSchema<T extends z.ZodTypeAny>(dataSchema?: T) {
  return z.object({
    success: z.literal(true),
    message: z.string(),
    meta: z.record(z.string(), z.unknown()).optional(),
    ...(dataSchema ? { data: dataSchema } : {}),
  });
}

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    hint: z.string().optional(),
  }),
});

export const validationErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal(ErrorCode.VALIDATION_ERROR),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.array(
      z.object({
        type: z.literal("field"),
        message: z.string(),
        path: z.string(),
        location: z.literal("body"),
      }),
    ),
  }),
});

/** Common non-2xx responses shared by every authenticated+role-guarded route. */
export const guardedErrorResponses = {
  [HttpStatus.BAD_REQUEST]: validationErrorResponseSchema,
  [HttpStatus.UNAUTHORIZED]: errorResponseSchema,
  [HttpStatus.FORBIDDEN]: errorResponseSchema,
  [HttpStatus.NOT_FOUND]: errorResponseSchema,
  [HttpStatus.CONFLICT]: errorResponseSchema,
  [HttpStatus.INTERNAL_SERVER_ERROR]: errorResponseSchema,
};
