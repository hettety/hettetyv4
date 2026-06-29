import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, preferences, agreedToTerms } = body ?? {};

    // Validate request
    if (
      !preferences ||
      typeof preferences !== 'object' ||
      typeof agreedToTerms !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Coerce the consent flags to real booleans so a malformed body can't slip
    // arbitrary values into the database.
    const necessary = preferences.necessary !== false; // necessary cookies are always on
    const analytics = preferences.analytics === true;
    const marketing = preferences.marketing === true;

    await prisma.userConsent.create({
      data: {
        userId: typeof userId === 'string' && userId.length > 0 ? userId : null,
        agreedToTerms,
        necessary,
        analytics,
        marketing,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'Consent saved successfully' });
  } catch (error) {
    console.error('Error saving consent:', error);
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
  }
}
