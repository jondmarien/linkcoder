import type { AppEnv } from "../env";

type ScanStatus = "pending" | "clean" | "suspicious" | "malicious";

type ScannerEnv = Partial<
  Pick<AppEnv, "CLOUDFLARE_ACCOUNT_ID" | "URL_SCANNER_API_TOKEN">
>;

type ScanDestinationUrlOptions = {
  env: ScannerEnv;
  fetcher: typeof fetch;
  url: string;
};

type ScanSubmission = {
  uuid?: string;
  result?: string;
};

type ScanVerdict = {
  malicious?: boolean;
  categories?: string[];
};

export type UrlScanResult = {
  status: ScanStatus;
  verdict: Record<string, unknown>;
};

const scannerUrl = (accountId: string, path: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/${path}`;

export const scanDestinationUrl = async ({
  env,
  fetcher,
  url,
}: ScanDestinationUrlOptions): Promise<UrlScanResult> => {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.URL_SCANNER_API_TOKEN) {
    return {
      status: "pending",
      verdict: {
        provider: "cloudflare_url_scanner",
        reason: "scanner_not_configured",
      },
    };
  }

  const headers = {
    authorization: `Bearer ${env.URL_SCANNER_API_TOKEN}`,
    "content-type": "application/json",
  };
  const submissionResponse = await fetcher(
    scannerUrl(env.CLOUDFLARE_ACCOUNT_ID, "scan"),
    {
      method: "POST",
      headers,
      body: JSON.stringify({ url, visibility: "Unlisted" }),
    },
  );

  if (!submissionResponse.ok) {
    return {
      status: "suspicious",
      verdict: {
        provider: "cloudflare_url_scanner",
        reason: "scan_submit_failed",
        status: submissionResponse.status,
      },
    };
  }

  const submission = (await submissionResponse.json()) as ScanSubmission;

  if (!submission.uuid) {
    return {
      status: "suspicious",
      verdict: {
        provider: "cloudflare_url_scanner",
        reason: "scan_missing_id",
      },
    };
  }

  const resultResponse = await fetcher(
    scannerUrl(env.CLOUDFLARE_ACCOUNT_ID, `result/${submission.uuid}`),
    { headers },
  );

  if (resultResponse.status === 404) {
    return {
      status: "pending",
      verdict: {
        provider: "cloudflare_url_scanner",
        reason: "scan_pending",
        scan_id: submission.uuid,
        result_url: submission.result,
      },
    };
  }

  if (!resultResponse.ok) {
    return {
      status: "suspicious",
      verdict: {
        provider: "cloudflare_url_scanner",
        reason: "scan_result_failed",
        scan_id: submission.uuid,
        status: resultResponse.status,
      },
    };
  }

  const result = (await resultResponse.json()) as {
    verdicts?: { overall?: ScanVerdict };
  };
  const overall = result.verdicts?.overall;

  if (overall?.malicious) {
    return {
      status: "malicious",
      verdict: {
        provider: "cloudflare_url_scanner",
        scan_id: submission.uuid,
        malicious: true,
        categories: overall.categories ?? [],
      },
    };
  }

  return {
    status: "clean",
    verdict: {
      provider: "cloudflare_url_scanner",
      scan_id: submission.uuid,
      malicious: false,
      categories: overall?.categories ?? [],
    },
  };
};
