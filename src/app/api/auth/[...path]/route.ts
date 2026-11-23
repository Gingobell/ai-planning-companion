import { getAuth } from "@/server/auth/neon-auth";

// Proxies the auth client's requests to Neon Auth.
type Context = { params: Promise<{ path: string[] }> };

export const GET = (request: Request, context: Context) => getAuth().handler().GET(request, context);
export const POST = (request: Request, context: Context) => getAuth().handler().POST(request, context);
