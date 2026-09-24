import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SUPPORTED_PROVIDERS, getProviderAdapter } from '@/lib/providers/registry';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { providerId } = body;

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

  const config = {
    providerId,
    apiKey: saved?.apiKey || undefined,
    baseUrl: saved?.baseUrl || adapter.defaultBaseUrl,
    defaultModel: saved?.defaultModel || adapter.defaultModel,
    customHeaders: saved?.customHeaders ? JSON.parse(saved.customHeaders) : undefined,
  };

  const result = await adapter.testConnection(config);

  return NextResponse.json(result);
}
