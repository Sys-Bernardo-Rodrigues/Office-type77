import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SUPPORTED_PROVIDERS, getProviderAdapter } from '@/lib/providers/registry';
import { resolveProviderTestConfig } from '@/lib/providers/resolveTestConfig';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { providerId, apiKey, baseUrl, defaultModel, customHeaders } = body;

  if (!providerId || !SUPPORTED_PROVIDERS.includes(providerId)) {
    return NextResponse.json(
      { error: `Unsupported provider: ${providerId}` },
      { status: 400 }
    );
  }

  const saved = await prisma.providerSetting.findUnique({
    where: { providerId },
  });

  const adapter = getProviderAdapter(providerId);

  const config = resolveProviderTestConfig(
    providerId,
    { apiKey, baseUrl, defaultModel, customHeaders },
    saved,
    adapter,
  );

  const result = await adapter.testConnection(config);

  return NextResponse.json(result);
}
