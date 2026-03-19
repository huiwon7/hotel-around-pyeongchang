const { onRequest } = require("firebase-functions/v2/https");
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
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/**
 * Send OTP via Aligo SMS
 * POST /sendOtp { phone: "01012345678" }
 */
exports.sendOtp = onRequest({ region: "asia-northeast3" }, async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.set(getCorsHeaders(req)).status(204).send("");
    return;
  }

  res.set(getCorsHeaders(req));

  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ success: false, message: "전화번호가 필요합니다." });
    return;
  }

  // Normalize phone: remove dashes
  const cleanPhone = phone.replace(/-/g, "");

  // Validate Korean mobile number format
  if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
    res.status(400).json({ success: false, message: "올바른 휴대폰 번호를 입력해주세요." });
    return;
  }

  // Rate limit: max 5 OTP requests per phone per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentOtps = await db.collection("otps")
    .where("phone", "==", cleanPhone)
    .where("createdAt", ">", oneHourAgo)
    .get();

  if (recentOtps.size >= 5) {
    res.status(429).json({ success: false, message: "인증 요청이 너무 많습니다. 1시간 후 다시 시도해주세요." });
    return;
  }

  // Generate 6-digit OTP
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

  try {
    // Store OTP in Firestore
    await db.collection("otps").add({
      phone: cleanPhone,
      code: otpCode,
      verified: false,
      createdAt: new Date(),
      expiresAt: expiresAt,
    });

    // Send SMS via Aligo
    const aligoResult = await sendAligoSms(cleanPhone, `[호텔어라운드 평창] 인증번호: ${otpCode}\n3분 이내에 입력해주세요.`);

    if (aligoResult.result_code === "1") {
      res.json({ success: true, message: "인증번호가 발송되었습니다." });
    } else {
      console.error("Aligo SMS 발송 실패:", aligoResult);
      res.status(500).json({ success: false, message: "문자 발송에 실패했습니다. 잠시 후 다시 시도해주세요." });
    }
  } catch (err) {
    console.error("OTP 발송 에러:", err);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

/**
 * Verify OTP
 * POST /verifyOtp { phone: "01012345678", code: "123456" }
 */
exports.verifyOtp = onRequest({ region: "asia-northeast3" }, async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.set(getCorsHeaders(req)).status(204).send("");
    return;
  }

  res.set(getCorsHeaders(req));

  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  const { phone, code } = req.body;
  if (!phone || !code) {
    res.status(400).json({ success: false, message: "전화번호와 인증번호가 필요합니다." });
    return;
  }

  const cleanPhone = phone.replace(/-/g, "");

  try {
    const now = new Date();
    const snapshot = await db.collection("otps")
      .where("phone", "==", cleanPhone)
      .where("code", "==", code)
      .where("verified", "==", false)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(400).json({ success: false, message: "인증번호가 올바르지 않습니다." });
      return;
    }

    const otpDoc = snapshot.docs[0];
    const otpData = otpDoc.data();

    // Check expiry
    const expiresAt = otpData.expiresAt.toDate ? otpData.expiresAt.toDate() : new Date(otpData.expiresAt);
    if (now > expiresAt) {
      res.status(400).json({ success: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." });
      return;
    }

    // Mark as verified
    await otpDoc.ref.update({ verified: true, verifiedAt: now });

    // Create a verification token (valid for 10 min)
    const token = generateToken();
    await db.collection("verified_phones").doc(token).set({
      phone: cleanPhone,
      createdAt: now,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({ success: true, message: "인증이 완료되었습니다.", token: token });
  } catch (err) {
    console.error("OTP 검증 에러:", err);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

/**
 * Send SMS via Aligo API
 */
async function sendAligoSms(phone, message) {
  // Aligo API credentials are stored in Firebase environment config
  // Set via: firebase functions:secrets:set ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER
  const apiKey = process.env.ALIGO_API_KEY;
  const userId = process.env.ALIGO_USER_ID;
  const sender = process.env.ALIGO_SENDER;

  const params = new URLSearchParams();
  params.append("key", apiKey);
  params.append("user_id", userId);
  params.append("sender", sender);
  params.append("receiver", phone);
  params.append("msg", message);

  const response = await axios.post("https://apis.aligo.in/send/", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data;
}

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

    const { turnstileToken, ...formData } = req.body;

    // Verify Turnstile token
    if (!turnstileToken) {
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
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

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

    const packageNames = {
      starter: "Starter (7박)",
      professional: "Professional (14박)",
      nomad: "Nomad (30박)",
      paradise: "Paradise (90박)",
      custom: "기업 맞춤",
    };

    const pkgName = packageNames[data.package] || data.package || "-";
    const text =
      `🔔 새 예약문의\n\n` +
      `이름: ${data.name || "-"}\n` +
      `회사: ${data.company || "-"}\n` +
      `패키지: ${pkgName}\n` +
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

/**
 * Generate random token
 */
function generateToken() {
  const crypto = require("crypto");
  return crypto.randomBytes(24).toString("hex");
}
