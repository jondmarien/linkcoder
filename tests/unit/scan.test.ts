import { describe, expect, it } from "vitest";
import { scanDestinationUrl } from "../../src/links/scan";

const scannerEnv = {
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  URL_SCANNER_API_TOKEN: "token",
};

describe("URL scanner", () => {
  it("returns malicious when the scan verdict is malicious", async () => {
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/urlscanner/v2/scan")) {
        return Response.json({ uuid: "scan-id" });
      }

      return Response.json({
        verdicts: { overall: { malicious: true, categories: ["phishing"] } },
      });
    };

    const result = await scanDestinationUrl({
      env: scannerEnv,
      fetcher,
      url: "https://evil.example",
    });

    expect(result.status).toBe("malicious");
    expect(result.verdict.malicious).toBe(true);
  });

  it("marks pending scanner results as suspicious for review", async () => {
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/urlscanner/v2/scan")) {
        return Response.json({ uuid: "scan-id" });
      }

      return new Response("not ready", { status: 404 });
    };

    const result = await scanDestinationUrl({
      env: scannerEnv,
      fetcher,
      url: "https://pending.example",
    });

    expect(result.status).toBe("suspicious");
    expect(result.verdict.reason).toBe("scan_pending");
  });

  it("marks links suspicious when scanner credentials are missing", async () => {
    const result = await scanDestinationUrl({
      env: {},
      fetcher: fetch,
      url: "https://unknown.example",
    });

    expect(result.status).toBe("suspicious");
    expect(result.verdict.reason).toBe("scanner_not_configured");
  });
});
