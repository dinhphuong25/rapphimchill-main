import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || "notification.hiphim@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "";

export interface SendOtpResult {
  success: boolean;
  devMode?: boolean;
  devCode?: string;
  error?: string;
}

/**
 * Sends a 6-digit activation OTP email from notification.hiphim@gmail.com
 * Includes a sleek cinematic HTML template with brand colors.
 */
export async function sendOtpEmail(toEmail: string, otp: string, userName?: string): Promise<SendOtpResult> {
  const gmailUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "notification.hiphim@gmail.com").trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "").trim();

  const isDevMode = !gmailPass;

  if (isDevMode) {
    console.log("\n=======================================================");
    console.log(`🎬 [HI PHIM EMAIL OTP DEV MODE]`);
    console.log(`To: ${toEmail}`);
    console.log(`From: ${gmailUser}`);
    console.log(`OTP Code: >>> ${otp} <<<`);
    console.log(`Note: To send real emails via Google, please set GMAIL_APP_PASSWORD in .env.local`);
    console.log("=======================================================\n");

    return {
      success: true,
      devMode: true,
      devCode: otp,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã Xác Thực Kích Hoạt Tài Khoản Hi Phim</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080b09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #080b09; padding: 35px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #121714; border-radius: 20px; border: 1px solid rgba(32, 214, 107, 0.35); overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
          
          <!-- Top Neon Accent Glow Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #121714 0%, #20D66B 50%, #121714 100%);"></td>
          </tr>

          <!-- Header Section: Logo & Brand -->
          <tr>
            <td style="padding: 38px 30px 20px; text-align: center; background: radial-gradient(circle at center, rgba(32, 214, 107, 0.16) 0%, rgba(18, 23, 20, 0) 70%);">
              <div style="display: inline-block; margin-bottom: 8px;">
                <span style="font-size: 34px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">Hi</span>
                <span style="font-size: 34px; font-weight: 900; letter-spacing: -0.5px; color: #20D66B; margin-left: 2px;">Phim</span>
                <span style="font-size: 14px; font-weight: 900; color: #20D66B; vertical-align: top; margin-left: 1px;">®</span>
              </div>
              <p style="margin: 0; font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.5); letter-spacing: 2px; text-transform: uppercase;">
                Nền Tảng Xem Phim Điện Ảnh Đỉnh Cao
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 36px 36px;">
              
              <!-- Luxury OTP Box -->
              <div style="background: #080c0a; border: 2px solid #20D66B; border-radius: 16px; padding: 24px 20px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 0 30px rgba(32, 214, 107, 0.08), 0 8px 24px rgba(0, 0, 0, 0.5);">
                <div style="font-family: 'Courier New', Courier, Consolas, monospace; font-size: 42px; font-weight: 900; letter-spacing: 14px; color: #20D66B; text-indent: 14px; text-shadow: 0 0 25px rgba(32, 214, 107, 0.5); line-height: 1;">
                  ${otp}
                </div>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.5); text-align: center;">
                Nếu bạn không yêu cầu tạo tài khoản tại Hi Phim, vui lòng bỏ qua email này.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #0b0f0d; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.5;">
                Email tự động được gửi từ hệ thống Hi Phim (${gmailUser}). Vui lòng không trả lời thư này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"Hi Phim" <${gmailUser}>`,
      replyTo: gmailUser,
      to: toEmail,
      subject: "Mã xác nhận kích hoạt tài khoản Hi Phim của bạn",
      text: `Mã xác thực kích hoạt tài khoản Hi Phim của bạn là: ${otp}\n\nTuyệt đối không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ Hi Phim`,
      html: htmlContent,
      headers: {
        "X-Priority": "1 (Highest)",
        "X-MSMail-Priority": "High",
        "Importance": "High",
      },
    });

    console.log(`[SMTP SUCCESS] OTP email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, devMode: false };
  } catch (err: any) {
    console.error("[SMTP ERROR] Failed to send OTP email:", err);
    return {
      success: false,
      error: err?.message || "Không thể gửi email xác thực. Vui lòng kiểm tra lại cấu hình SMTP.",
    };
  }
}
