import fs from "node:fs";
import path from "node:path";

const homepagePath = path.join(process.cwd(), "public", "homepage.html");

export async function GET() {
  const html = fs.readFileSync(homepagePath, "utf-8");
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
