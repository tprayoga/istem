import { ThingsBoardRequest } from "@/lib/thingsboard";
import { NextResponse } from "next/server";

async function fetchTelemetry(url: string, bearerToken: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Authorization": `Bearer ${bearerToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const bodyContent = contentType.includes("application/json") ? await response.json() : await response.text();
  return { response, bodyContent };
}

function buildTelemetryUrl(baseUrl: string, args: {
  entityType: string;
  entityId: string;
  keys: string;
  startTs: number;
  endTs: number;
  limit: number;
  agg: string;
  interval: number;
}) {
  const url = new URL(`${baseUrl}/api/plugins/telemetry/${args.entityType}/${args.entityId}/values/timeseries`);
  url.searchParams.set("keys", args.keys);
  url.searchParams.set("startTs", String(args.startTs));
  url.searchParams.set("endTs", String(args.endTs));
  url.searchParams.set("limit", String(args.limit));
  url.searchParams.set("agg", args.agg);
  url.searchParams.set("intervalType", "MILLISECONDS");
  url.searchParams.set("interval", String(args.interval));
  return url;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ThingsBoardRequest;
    const {
      baseUrl,
      accessToken,
      username,
      password,
      deviceId,
      entityType = "DEVICE",
      startTs,
      endTs,
      limit = 5000,
      agg = "AVG",
      interval = 60000,
      keys = "current_r,current_s,current_t",
    } = body;

    if (!baseUrl || !deviceId) {
      return NextResponse.json({ error: "baseUrl dan deviceId wajib diisi." }, { status: 400 });
    }
    if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || startTs >= endTs) {
      return NextResponse.json({ error: "Parameter waktu tidak valid." }, { status: 400 });
    }
    if (!keys.trim()) {
      return NextResponse.json({ error: "Telemetry keys tidak boleh kosong." }, { status: 400 });
    }

    const sanitizedBase = baseUrl.replace(/\/+$/, "");
    let bearerToken = accessToken?.trim() ?? "";
    const inputUsername = username?.trim() ?? "";
    const inputPassword = password?.trim() ?? "";

    const loginAndGetToken = async () => {
      const loginResponse = await fetch(`${sanitizedBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: inputUsername,
          password: inputPassword,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });

      const loginBody = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok || !loginBody?.token) {
        throw new Error(`Gagal login ThingsBoard (${loginResponse.status}): ${JSON.stringify(loginBody)}`);
      }
      return String(loginBody.token);
    };

    // Optional auth mode: exchange username/password to JWT token.
    if (!bearerToken && inputUsername && inputPassword) {
      bearerToken = await loginAndGetToken();
    }

    if (!bearerToken) {
      return NextResponse.json(
        { error: "Isi JWT token atau isi Username & Password untuk auto-login." },
        { status: 400 },
      );
    }

    const rangeMs = endTs - startTs;
    const targetMaxBuckets = 900;
    const minIntervalMs = 60_000;
    const intervalFromRange = Math.ceil(rangeMs / targetMaxBuckets);
    const normalizedInterval = Math.ceil(Math.max(interval, intervalFromRange, minIntervalMs) / minIntervalMs) * minIntervalMs;

    let url = buildTelemetryUrl(sanitizedBase, {
      entityType,
      entityId: deviceId,
      keys,
      startTs,
      endTs,
      limit,
      agg,
      interval: normalizedInterval,
    });

    let { response, bodyContent } = await fetchTelemetry(url.toString(), bearerToken);

    // If token is invalid/expired but credentials are provided, try login then retry telemetry once.
    if (response.status === 401 && inputUsername && inputPassword) {
      try {
        bearerToken = await loginAndGetToken();
        const retry = await fetchTelemetry(url.toString(), bearerToken);
        response = retry.response;
        bodyContent = retry.bodyContent;
      } catch (retryError) {
        return NextResponse.json(
          {
            error: "Token tidak valid dan login ulang gagal.",
            detail: retryError instanceof Error ? retryError.message : "Unknown retry error",
          },
          { status: 401 },
        );
      }
    }

    // Auto-retry with coarser interval when server rejects bucket count.
    let currentInterval = normalizedInterval;
    for (let i = 0; i < 4; i += 1) {
      const detailText = typeof bodyContent === "string" ? bodyContent : JSON.stringify(bodyContent);
      const tooManyIntervals =
        response.status === 400 &&
        detailText.toLowerCase().includes("number of intervals is to high");
      if (!tooManyIntervals) break;

      currentInterval *= 2;
      url = buildTelemetryUrl(sanitizedBase, {
        entityType,
        entityId: deviceId,
        keys,
        startTs,
        endTs,
        limit,
        agg,
        interval: currentInterval,
      });
      const retry = await fetchTelemetry(url.toString(), bearerToken);
      response = retry.response;
      bodyContent = retry.bodyContent;
    }

    if (!response.ok) {
      const detail = typeof bodyContent === "string" ? bodyContent : JSON.stringify(bodyContent);
      return NextResponse.json(
        {
          error: `Gagal mengambil data ThingsBoard (${response.status})`,
          detail,
          hint: "Gunakan JWT user ThingsBoard (bukan device token) atau isi username/password untuk auto-login.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(bodyContent);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Terjadi error saat memproses request ThingsBoard.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
