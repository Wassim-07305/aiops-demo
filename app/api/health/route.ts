import { NextResponse } from "next/server";
const has = (v?: string) => Boolean(v && v !== "placeholder");
export function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      SUPABASE_URL: has(process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: has(process.env.SUPABASE_ANON_KEY),
      OPENAI_API_KEY: has(process.env.OPENAI_API_KEY),
      SLACK_WEBHOOK_URL: has(process.env.SLACK_WEBHOOK_URL),
    },
  });
}
