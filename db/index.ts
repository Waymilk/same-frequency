import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!client) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("双人房数据库尚未配置，请设置 DATABASE_URL");
    }
    client = neon(databaseUrl);
  }

  return client;
}
