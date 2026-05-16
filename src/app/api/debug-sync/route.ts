export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { getSetting } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let cdmCardNo = searchParams.get("cdmCardNo");
  if (!cdmCardNo) cdmCardNo = await getSetting("cdmCardNo");
  if (!cdmCardNo) cdmCardNo = process.env.DAM_CARD_ID ?? null;
  if (!cdmCardNo) {
    return NextResponse.json({ error: "cdmCardNo not set" }, { status: 400 });
  }

  const url = `https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo=${encodeURIComponent(cdmCardNo)}&pageNo=1`;

  let rawXml = "";
  let httpStatus = 0;
  let fetchError = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "application/xml, text/xml, */*",
        Referer: "https://www.clubdam.com/app/damtomo/scoring/GetScoringAiList.do",
      },
      cache: "no-store",
    });
    httpStatus = res.status;
    rawXml = await res.text();
  } catch (e) {
    fetchError = String(e);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (name) =>
      name === "scoring" || name === "scoringData" || name === "list" || name === "item",
  });

  let parsed: unknown = null;
  let parseError = "";
  try {
    parsed = parser.parse(rawXml);
  } catch (e) {
    parseError = String(e);
  }

  return NextResponse.json({
    cdmCardNo,
    httpStatus,
    fetchError,
    parseError,
    rawXmlPreview: rawXml.slice(0, 2000),
    parsed,
  });
}
