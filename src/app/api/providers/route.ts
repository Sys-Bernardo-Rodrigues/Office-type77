import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SUPPORTED_PROVIDERS, getProviderAdapter } from '@/lib/providers/registry';

export async function GET() {
  const settings = await prisma.providerSetting.findMany({
    orderBy: { providerId: 'asc' },
  });

  const providers = SUPPORTED_PROVIDERS.map((id) => {
    const adapter = getProviderAdapter(id);
    const saved = settings.find((s) => s.providerId === id);
    return {
      providerId: id,
      name: adapter.name,
      defaultBaseUrl: adapter.defaultBaseUrl,
      defaultModel: adapter.defaultModel,
      apiKey: saved?.apiKey ? '••••' + saved.apiKey.slice(-4) : null,
      baseUrl: saved?.baseUrl || adapter.defaultBaseUrl,
      model: saved?.defaultModel || adapter.defaultModel,
      isActive: saved?.isActive ?? false,
      customHeaders: saved?.customHeaders ? JSON.parse(saved.customHeaders) : null,
    };
  });

  return NextResponse.json({ providers });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { providerId, apiKey, baseUrl, defaultModel, customHeaders, isActive } = body;

  if (!providerId || !SUPPORTED_PROVIDERS.includes(providerId)) {
    return NextResponse.json(
      { error: `Unsupported provider: ${providerId}` },
      { status: 400 }
    );
  }

  const adapter = getProviderAdapter(providerId);

  const updated = await prisma.providerSetting.upsert({
    where: { providerId },
    update: {
      apiKey: apiKey ?? undefined,
      baseUrl: baseUrl ?? undefined,
      defaultModel: defaultModel ?? undefined,
      customHeaders: customHeaders ? JSON.stringify(customHeaders) : undefined,
      isActive: isActive ?? undefined,
    },
    create: {
      providerId,
      name: adapter.name,
      apiKey: apiKey || null,
      baseUrl: baseUrl || adapter.defaultBaseUrl,
      defaultModel: defaultModel || adapter.defaultModel,
      customHeaders: customHeaders ? JSON.stringify(customHeaders) : null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({
    providerId: updated.providerId,
    name: updated.name,
    isActive: updated.isActive,
    baseUrl: updated.baseUrl,
    model: updated.defaultModel,
  });
}
