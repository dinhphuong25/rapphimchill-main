import { NextRequest, NextResponse } from "next/server";
import {
  getWatchPartyRoom,
  createWatchPartyRoom,
  joinWatchPartyRoom,
  syncWatchPartyPlayback,
  addWatchPartyChatMessage,
} from "@/lib/watch-party-store";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId")?.trim();
  if (!roomId) {
    return NextResponse.json({ success: false, error: "Missing roomId" }, { status: 400 });
  }

  const room = await getWatchPartyRoom(roomId);
  if (!room) {
    return NextResponse.json({ success: false, error: "Phòng xem chung không tồn tại hoặc đã hết hạn" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    room,
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === "create") {
      const { movieSlug, movieName, hostId, hostName, episodeIndex, episodeName, serverIndex } = body;
      if (!movieSlug || !movieName) {
        return NextResponse.json({ success: false, error: "Thiếu thông tin phim" }, { status: 400 });
      }

      const room = await createWatchPartyRoom({
        movieSlug,
        movieName,
        hostId: hostId || `usr_${Math.random().toString(36).substring(2, 8)}`,
        hostName: hostName || "Chủ phòng",
        episodeIndex: typeof episodeIndex === "number" ? episodeIndex : 0,
        episodeName: episodeName || "Tập 1",
        serverIndex: typeof serverIndex === "number" ? serverIndex : 0,
      });

      return NextResponse.json({ success: true, room });
    }

    if (action === "join") {
      const { roomId, memberId, memberName } = body;
      if (!roomId) {
        return NextResponse.json({ success: false, error: "Thiếu mã phòng" }, { status: 400 });
      }

      const room = await joinWatchPartyRoom(roomId, {
        id: memberId || `usr_${Math.random().toString(36).substring(2, 8)}`,
        name: memberName || "Khán giả",
      });

      if (!room) {
        return NextResponse.json({ success: false, error: "Không tìm thấy phòng hoặc phòng đã kết thúc" }, { status: 404 });
      }

      return NextResponse.json({ success: true, room });
    }

    if (action === "sync") {
      const { roomId, senderId, currentTime, isPlaying, episodeIndex, episodeName, serverIndex } = body;
      if (!roomId) {
        return NextResponse.json({ success: false, error: "Thiếu mã phòng" }, { status: 400 });
      }

      const room = await syncWatchPartyPlayback(
        roomId,
        {
          ...(typeof currentTime === "number" ? { currentTime } : {}),
          ...(typeof isPlaying === "boolean" ? { isPlaying } : {}),
          ...(typeof episodeIndex === "number" ? { episodeIndex } : {}),
          ...(episodeName ? { episodeName } : {}),
          ...(typeof serverIndex === "number" ? { serverIndex } : {}),
        },
        senderId
      );

      if (!room) {
        return NextResponse.json({ success: false, error: "Không tìm thấy phòng" }, { status: 404 });
      }

      return NextResponse.json({ success: true, room });
    }

    if (action === "chat") {
      const { roomId, senderId, senderName, text } = body;
      if (!roomId || !text) {
        return NextResponse.json({ success: false, error: "Thiếu nội dung tin nhắn hoặc mã phòng" }, { status: 400 });
      }

      const message = await addWatchPartyChatMessage(
        roomId,
        {
          id: senderId || "anon",
          name: senderName || "Khán giả",
        },
        text
      );

      if (!message) {
        return NextResponse.json({ success: false, error: "Không thể gửi tin nhắn" }, { status: 400 });
      }

      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
