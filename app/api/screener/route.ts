import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'ValueLens API - En construction',
    status: 'ok'
  });
}
