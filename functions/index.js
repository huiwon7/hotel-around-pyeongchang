const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// CORS headers
const ALLOWED_ORIGINS = [
  "https://hotel-around-pyeongchang.web.app",
  "https://hotel-around-pyeongchang.firebaseapp.com",
  "https://aroundpartners.co.kr",
  "https://www.aroundpartners.co.kr",
];

function getCorsHeaders(req) {
  const origin = req.headers.origin || "";
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

// 여행 유형 (index.html #stayType 옵션과 동일하게 유지)
const STAY_TYPES = {
  basecamp: "강원도 베이스캠프 여행",
  burnout: "번아웃 리셋",
  workation: "워케이션",
  family: "가족 힐링 여행",
  business: "기업 행사/세미나",
  other: "기타",
};
const GUEST_OPTIONS = ["1", "2", "3-5", "6-10", "10+"];

// Input validation: field -> { max length, format check }
const FIELD_RULES = {
  name: { max: 50, required: true },
  company: { max: 100 },
  email: { max: 254, required: true, test: (v) => /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v) },
  phone: { max: 20, required: true, test: (v) => /^[0-9-]{9,13}$/.test(v) },
  stayType: { max: 30, test: (v) => Object.prototype.hasOwnProperty.call(STAY_TYPES, v) },
  checkin: { max: 10, test: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) },
  guests: { max: 10, test: (v) => GUEST_OPTIONS.includes(v) },
  message: { max: 2000 },
};

/**
 * Submit inquiry with Turnstile verification
 * POST /submitInquiry { ...formData, turnstileToken: "xxx" }
 */
exports.submitInquiry = onRequest(
  { region: "asia-northeast3", secrets: ["TURNSTILE_SECRET_KEY"] },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.set(getCorsHeaders(req)).status(204).send("");
      return;
    }
    res.set(getCorsHeaders(req));

    if (req.method !== "POST") {
      res.status(405).json({ success: false, message: "Method not allowed" });
      return;
    }

    const { turnstileToken, ...rawData } = req.body || {};

    // Whitelist fields, enforce length and format
    const formData = {};
    for (const [key, rule] of Object.entries(FIELD_RULES)) {
      const raw = rawData[key];
      const value = raw === undefined || raw === null ? "" : String(raw).trim();
      if (!value) {
        if (rule.required) {
          res.status(400).json({ success: false, message: "필수 항목을 입력해주세요." });
          return;
        }
        continue;
      }
      if (value.length > rule.max || (rule.test && !rule.test(value))) {
        res.status(400).json({ success: false, message: "입력값을 확인해주세요." });
        return;
      }
      formData[key] = value;
    }

    // Verify Turnstile token
    if (!turnstileToken || typeof turnstileToken !== "string") {
      res.status(400).json({ success: false, message: "보안 인증이 필요합니다." });
      return;
    }

    try {
      const verifyRes = await axios.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: req.ip,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (!verifyRes.data.success) {
        res.status(403).json({ success: false, message: "보안 인증에 실패했습니다. 다시 시도해주세요." });
        return;
      }
    } catch (err) {
      console.error("Turnstile 검증 에러:", err.message);
      res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
      return;
    }

    // Store inquiry
    formData.timestamp = new Date().toISOString();
    formData.status = "pending";

    try {
      await db.collection("inquiries").add(formData);
      res.json({ success: true, message: "문의가 접수되었습니다." });
    } catch (err) {
      console.error("문의 저장 실패:", err.message);
      res.status(500).json({ success: false, message: "문의 저장에 실패했습니다." });
    }
  }
);

/**
 * Send Telegram notification when new inquiry is created
 * Triggered by Firestore onCreate
 */
exports.onNewInquiry = onDocumentCreated(
  { document: "inquiries/{docId}", region: "asia-northeast3", secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_IDS"] },
  async (event) => {
    const data = event.data.data();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = process.env.TELEGRAM_CHAT_IDS;

    if (!botToken || !chatIds) {
      console.warn("Telegram 환경변수 미설정");
      return;
    }

    const text =
      `🔔 새 예약문의\n\n` +
      `이름: ${data.name || "-"}\n` +
      `회사: ${data.company || "-"}\n` +
      `여행 유형: ${STAY_TYPES[data.stayType] || "-"}\n` +
      `체크인: ${data.checkin || "-"}\n` +
      `인원: ${data.guests || "-"}명\n` +
      `연락처: ${data.phone || "-"}\n` +
      `이메일: ${data.email || "-"}\n` +
      (data.message ? `메시지: ${data.message}\n` : "") +
      `\n📋 관리자 페이지에서 확인하세요.`;

    const ids = chatIds.split(",");
    for (const chatId of ids) {
      try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: chatId.trim(),
          text: text,
        });
      } catch (err) {
        console.error(`Telegram 발송 실패 (${chatId}):`, err.message);
      }
    }
  }
);
