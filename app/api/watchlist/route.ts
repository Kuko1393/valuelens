import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try { return NextResponse.json(await prisma.watchlist.findMany({ orderBy: { createdAt: 'desc' } })) }
  catch { return NextResponse.json([]) }
}
export async function POST(req: NextRequest) {
  const { name, tickers } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  try { return NextResponse.json(await prisma.watchlist.create({ data: { name, tickers: tickers || [] } })) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  const { id, name, tickers } = await req.json()
  try { return NextResponse.json(await prisma.watchlist.update({ where: { id }, data: { name, tickers } })) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  try { await prisma.watchlist.delete({ where: { id } }); return NextResponse.json({ success: true }) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
