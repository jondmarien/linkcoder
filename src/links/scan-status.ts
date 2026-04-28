import type { LinkRecord } from "./repository";

type ScanDisplayLink = Pick<
  LinkRecord,
  "lastScannedAt" | "scanStatus" | "scanVerdictJson"
>;

type ScanVerdict = {
  reason?: string;
};

const parseScanVerdict = (value: string | null): ScanVerdict => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as ScanVerdict;
  } catch {
    return {};
  }
};

const SCAN_FAILURE_REASONS = new Set([
  "scan_missing_id",
  "scan_result_failed",
  "scan_submit_failed",
]);

export type ScanDisplay = {
  detail: string;
  estimate: string | null;
  label: string;
  tone: "default" | "warning" | "danger" | "muted";
};

export const scanDisplay = (link: ScanDisplayLink): ScanDisplay => {
  const verdict = parseScanVerdict(link.scanVerdictJson);

  if (link.scanStatus === "malicious") {
    return {
      detail: "Cloudflare URL Scanner reported this destination as malicious.",
      estimate: null,
      label: "Malicious",
      tone: "danger",
    };
  }

  if (
    link.scanStatus === "suspicious" ||
    SCAN_FAILURE_REASONS.has(verdict.reason ?? "")
  ) {
    return {
      detail:
        "The scanner could not complete a clean verdict. Review before sharing broadly.",
      estimate: null,
      label: "Suspicious",
      tone: "warning",
    };
  }

  if (
    link.scanStatus === "pending" ||
    verdict.reason === "scan_pending" ||
    verdict.reason === "scanner_not_configured"
  ) {
    return {
      detail:
        verdict.reason === "scanner_not_configured"
          ? "The scanner is not configured for this environment yet."
          : "Cloudflare URL Scanner is processing this destination.",
      estimate:
        verdict.reason === "scanner_not_configured"
          ? "Estimated finish: scanner setup required"
          : "Estimated finish: usually under 1 minute",
      label: "Reviewing",
      tone: "muted",
    };
  }

  return {
    detail: "Cloudflare URL Scanner found no malicious verdict.",
    estimate: null,
    label: "Ready",
    tone: "default",
  };
};
