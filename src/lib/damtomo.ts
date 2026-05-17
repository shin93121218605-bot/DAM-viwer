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
    name === "scoring" || name === "scoringData" || name === "list" || name === "item",
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
    // Score is the text content of the <scoring> element (fast-xml-parser stores it as #text).
    // DAMとも returns the score as an integer multiplied by 1000 (e.g. 87123 = 87.123 points).
    score: raw["#text"] != null ? Number(raw["#text"]) / 1000 : undefined,
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
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Accept: "application/xml, text/xml, */*",
      Referer: "https://www.clubdam.com/app/damtomo/scoring/GetScoringAiList.do",
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

  // Records are in root["list"]["scoring"] (list is a sibling of data, not a child).
  const listEl = (root["list"] ?? {}) as Record<string, unknown>;
  const listContainer =
    listEl["scoring"] ?? data["scoring"] ?? data["list"] ?? data["scoringAiData"] ?? [];
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
