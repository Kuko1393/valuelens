import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const conviction = sp.get('conviction') // Élevée | Moyenne | Faible

  const ideas = await prisma.investmentIdea.findMany({
    where: conviction ? { convictionLevel: conviction } : undefined,
    orderBy: { totalScore: 'desc' },
  })

  return NextResponse.json({ ideas })
}
