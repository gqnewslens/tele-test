import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

// Simple in-memory token store (in production, use Redis or similar)
const validTokens = new Map<string, { expiresAt: number }>();

// Clean up expired tokens periodically
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of validTokens.entries()) {
    if (data.expiresAt < now) {
      validTokens.delete(token);
    }
  }
}

// Generate a secure token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash password for comparison (simple approach)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

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

    // Generate token with 24-hour expiry
    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    validTokens.set(token, { expiresAt });

    // Cleanup old tokens
    cleanupExpiredTokens();

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
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const tokenData = validTokens.get(token);

  if (!tokenData) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  if (tokenData.expiresAt < Date.now()) {
    validTokens.delete(token);
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    validTokens.delete(token);
  }

  return NextResponse.json({ success: true });
}

// Export for use in other API routes
export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;

  const tokenData = validTokens.get(token);
  if (!tokenData) return false;

  if (tokenData.expiresAt < Date.now()) {
    validTokens.delete(token);
    return false;
  }

  return true;
}

// Export the token store for use in delete API
export { validTokens };
