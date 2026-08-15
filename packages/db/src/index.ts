export const applicationSchemaName = "app" as const;

export type DatabaseSchemaName = typeof applicationSchemaName;

export * from "./client";
export * from "./schema";
