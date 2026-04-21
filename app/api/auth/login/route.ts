import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.AUTH_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET!;
  const res = NextResponse.json({ ok: true });
  // SameSite=None + Secure required for cross-site iframe contexts (e.g. GoHighLevel)
  res.cookies.set("ag_session", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
