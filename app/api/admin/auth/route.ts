import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// JWT-like token generation (stateless, no server memory needed)
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'fallback-secret-key';
const TOKEN_EXPIRY_HOURS = 24;

interface TokenPayload {
  exp: number;
  iat: number;
  role: 'admin';
}

// Base64URL encode
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Base64URL decode
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

// Generate HMAC signature
function sign(data: string): string {
  return createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
}

// Generate JWT token
function generateToken(): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: TokenPayload = {
    exp: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    iat: Date.now(),
    role: 'admin',
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${headerB64}.${payloadB64}`);

  return `${headerB64}.${payloadB64}.${signature}`;
}

// Verify JWT token
export function verifyToken(token: string | null): boolean {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signature] = parts;

    // Verify signature
    const expectedSignature = sign(`${headerB64}.${payloadB64}`);
    if (signature !== expectedSignature) return false;

    // Verify expiration
    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp < Date.now()) return false;

    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// Legacy export for backward compatibility
export const validTokens = new Map<string, { expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify token endpoint
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;

  if (!verifyToken(token)) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}

// Logout endpoint (JWT is stateless, just return success)
export async function DELETE() {
  return NextResponse.json({ success: true });
}
