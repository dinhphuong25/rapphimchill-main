import nodemailer from "nodemailer";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const DEFAULT_SENDER = "noreply@hiphim.biz";

type EmailBinding = {
  send: (message: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<{ messageId: string }>;
};

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
  const textContent = `Mã xác thực kích hoạt tài khoản Hi Phim của bạn là: ${otp}\n\nTuyệt đối không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ Hi Phim`;
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<body style="margin:0;padding:35px 12px;background:#080b09;color:#fff;font-family:Arial,sans-serif">
  <div style="max-width:540px;margin:auto;padding:36px;background:#121714;border:1px solid #20d66b;border-radius:20px;text-align:center">
    <h1><span style="color:#fff">Hi</span> <span style="color:#20d66b">Phim</span></h1>
    <p>Mã xác thực kích hoạt tài khoản của bạn:</p>
    <div style="padding:24px;border:2px solid #20d66b;border-radius:16px;color:#20d66b;font:900 42px monospace;letter-spacing:14px">${otp}</div>
    <p style="color:#aaa">Nếu bạn không yêu cầu tạo tài khoản tại Hi Phim, vui lòng bỏ qua email này.</p>
  </div>
</body>
</html>`;

  try {
    const context = await getCloudflareContext({ async: true });
    const emailBinding = (context.env as Record<string, unknown>).EMAIL as EmailBinding | undefined;
    if (emailBinding) {
      await emailBinding.send({
        to: toEmail,
        from: DEFAULT_SENDER,
        subject: "Mã xác nhận kích hoạt tài khoản Hi Phim của bạn",
        html: htmlContent,
        text: textContent,
      });
      return { success: true, devMode: false };
    }
  } catch (err: any) {
    console.error("[EMAIL SERVICE ERROR] Cloudflare Email Sending failed:", err);
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Không thể gửi email OTP. Vui lòng thử lại sau." };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Hệ thống email chưa được cấu hình trên Cloudflare." };
  }

  if (!gmailPass) {
    console.log(`[HI PHIM EMAIL OTP DEV MODE] To: ${toEmail}; OTP: ${otp}`);
    return { success: true, devMode: true, devCode: otp };
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

    const info = await transporter.sendMail({
      from: `"Hi Phim" <${gmailUser}>`,
      replyTo: gmailUser,
      to: toEmail,
      subject: "Mã xác nhận kích hoạt tài khoản Hi Phim của bạn",
      text: textContent,
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
