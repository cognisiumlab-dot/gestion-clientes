import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ag_session", "", { maxAge: 0, path: "/", secure: true, sameSite: "none" });
  return res;
}
