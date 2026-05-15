import { XMLParser } from "fast-xml-parser";
import type { DamtomoRecord, DamtomoPageResponse } from "@/types/damtomo";

const BASE_URL =
  "https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: true,
  parseTagValue: true,
  isArray: (name) =>
    name === "scoringData" || name === "list" || name === "item",
});

function toNumber(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function parsePerformedAt(record: Record<string, unknown>): Date {
  // Try combined datetime fields: scoringDateTime, or ymd + time separate fields
  const dt = record["scoringDateTime"] as string | undefined;
  if (dt) {
    // Possible formats: "2024/03/15 21:30:00" or "20240315213000"
    const normalized = dt.replace(
      /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
      "$1-$2-$3T$4:$5:$6"
    ).replace(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}:\d{2}:\d{2})$/, "$1-$2-$3T$4");
    return new Date(normalized + "+09:00");
  }
  // Fallback: try separate ymd / hms fields
  const ymd = (record["scoringYmd"] ?? record["entryYmd"] ?? "") as string;
  const hms = (record["scoringTime"] ?? record["entryTime"] ?? "00:00:00") as string;
  if (ymd) {
    const normalizedYmd = ymd.replace(/\//g, "-");
    return new Date(`${normalizedYmd}T${hms}+09:00`);
  }
  return new Date();
}

function normalizeRecord(raw: Record<string, unknown>): DamtomoRecord {
  return {
    scoringAiId: String(raw["scoringAiId"] ?? raw["@_scoringAiId"] ?? ""),
    requestNo: String(raw["requestNo"] ?? ""),
    contentsName: String(raw["contentsName"] ?? ""),
    artistName: String(raw["artistName"] ?? ""),
    dContentsName: String(raw["dContentsName"] ?? raw["contentsName"] ?? ""),
    dArtistName: String(raw["dArtistName"] ?? raw["artistName"] ?? ""),
    damserial: String(raw["damserial"] ?? ""),
    dataKind: String(raw["dataKind"] ?? ""),
    clubDamCardNo: String(raw["clubDamCardNo"] ?? ""),
    entryCount: toNumber(raw["entryCount"]),
    analysisReportCommentNo: raw["analysisReportCommentNo"]
      ? String(raw["analysisReportCommentNo"])
      : undefined,
    radarChartPitch: toNumber(raw["radarChartPitch"]),
    radarChartStability: toNumber(raw["radarChartStability"]),
    radarChartExpressive: toNumber(raw["radarChartExpressive"]),
    radarChartVibratoLongtone: toNumber(raw["radarChartVibratoLongtone"]),
    radarChartRhythm: toNumber(raw["radarChartRhythm"]),
    singingRangeHighest: raw["singingRangeHighest"]
      ? String(raw["singingRangeHighest"])
      : undefined,
    singingRangeLowest: raw["singingRangeLowest"]
      ? String(raw["singingRangeLowest"])
      : undefined,
    vocalRangeHighest: raw["vocalRangeHighest"]
      ? String(raw["vocalRangeHighest"])
      : undefined,
    vocalRangeLowest: raw["vocalRangeLowest"]
      ? String(raw["vocalRangeLowest"])
      : undefined,
    performedAt: parsePerformedAt(raw),
  };
}

export async function fetchPage(
  cdmCardNo: string,
  pageNo: number
): Promise<DamtomoPageResponse> {
  const url = `${BASE_URL}?cdmCardNo=${encodeURIComponent(cdmCardNo)}&pageNo=${pageNo}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/xml, text/xml, */*",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`DAMとも API error: ${res.status} ${res.statusText}`);
  }

  const xmlText = await res.text();
  const parsed = parser.parse(xmlText);

  // Navigate to the root element (namespace-prefixed or not)
  const root =
    parsed["ns2:scoring"] ??
    parsed["scoring"] ??
    parsed[Object.keys(parsed)[0]] ??
    {};

  const result = root["result"] ?? {};
  const statusCode = String(result["statusCode"] ?? result["@_statusCode"] ?? "0");
  if (statusCode !== "0" && statusCode !== "") {
    const message = result["message"] ?? "Unknown error";
    throw new Error(`DAMとも API returned error: ${message} (code: ${statusCode})`);
  }

  const data = root["data"] ?? {};
  const pageData = data["page"] ?? {};
  const dataCount = toNumber(pageData["dataCount"] ?? pageData["@_dataCount"]) ?? 0;
  const pageCount = toNumber(pageData["pageCount"] ?? pageData["@_pageCount"]) ?? 1;
  const hasNextRaw = pageData["hasNext"] ?? pageData["@_hasNext"];
  const hasNext = hasNextRaw === true || hasNextRaw === "1" || hasNextRaw === 1;

  // Records may be in data.list, data.scoringData, etc.
  const listContainer =
    data["list"] ?? data["scoringData"] ?? data["scoringAiData"] ?? [];
  const rawList: unknown[] = Array.isArray(listContainer)
    ? listContainer
    : listContainer
    ? [listContainer]
    : [];

  const records = rawList
    .filter((r) => r && typeof r === "object")
    .map((r) => normalizeRecord(r as Record<string, unknown>))
    .filter((r) => r.scoringAiId);

  return {
    records,
    meta: { dataCount, pageCount, hasNext },
  };
}
