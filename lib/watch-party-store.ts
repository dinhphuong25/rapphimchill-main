import { getD1Database } from "@/lib/d1-db";

export interface WatchPartyMember {
  id: string;
  name: string;
  isHost: boolean;
  lastActive: number;
}

export interface WatchPartyMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface WatchPartyState {
  currentTime: number;
  isPlaying: boolean;
  episodeIndex: number;
  episodeName: string;
  serverIndex: number;
  updatedAt: number;
}

export interface WatchPartyRoom {
  roomId: string;
  movieSlug: string;
  movieName: string;
  hostId: string;
  hostName: string;
  state: WatchPartyState;
  messages: WatchPartyMessage[];
  members: WatchPartyMember[];
  createdAt: number;
  updatedAt: number;
}

// In-memory cache for fast sub-millisecond lookups per Edge node
const memoryRooms = new Map<string, WatchPartyRoom>();

// Clean up stale rooms older than 6 hours from memory
function cleanupStaleRooms() {
  const cutoff = Date.now() - 6 * 3600_000;
  for (const [id, room] of memoryRooms.entries()) {
    if (room.updatedAt < cutoff) {
      memoryRooms.delete(id);
    }
  }
}

export async function getWatchPartyRoom(roomId: string): Promise<WatchPartyRoom | null> {
  const cleanId = roomId.trim().toUpperCase();
  const cached = memoryRooms.get(cleanId);
  if (cached) {
    return cached;
  }

  const db = await getD1Database();
  if (db) {
    try {
      const row = await db
        .prepare("SELECT * FROM hiphim_watch_party_rooms WHERE room_id = ?")
        .bind(cleanId)
        .first<any>();

      if (row) {
        const room: WatchPartyRoom = {
          roomId: row.room_id,
          movieSlug: row.movie_slug,
          movieName: row.movie_name,
          hostId: row.host_id,
          hostName: row.host_name,
          state: JSON.parse(row.state || "{}"),
          messages: JSON.parse(row.messages || "[]"),
          members: JSON.parse(row.members || "[]"),
          createdAt: Number(row.created_at),
          updatedAt: Number(row.updated_at),
        };
        memoryRooms.set(cleanId, room);
        return room;
      }
    } catch (err) {
      console.warn("[WATCH PARTY] D1 get room error:", err);
    }
  }

  return null;
}

export async function saveWatchPartyRoom(room: WatchPartyRoom): Promise<void> {
  memoryRooms.set(room.roomId, room);
  cleanupStaleRooms();

  const db = await getD1Database();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO hiphim_watch_party_rooms 
           (room_id, movie_slug, movie_name, host_id, host_name, state, messages, members, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(room_id) DO UPDATE SET
             state = excluded.state,
             messages = excluded.messages,
             members = excluded.members,
             updated_at = excluded.updated_at`
        )
        .bind(
          room.roomId,
          room.movieSlug,
          room.movieName,
          room.hostId,
          room.hostName,
          JSON.stringify(room.state),
          JSON.stringify(room.messages),
          JSON.stringify(room.members),
          room.createdAt,
          room.updatedAt
        )
        .run();
    } catch (err) {
      console.warn("[WATCH PARTY] D1 save room error:", err);
    }
  }
}

export async function createWatchPartyRoom(params: {
  movieSlug: string;
  movieName: string;
  hostId: string;
  hostName: string;
  episodeIndex?: number;
  episodeName?: string;
  serverIndex?: number;
}): Promise<WatchPartyRoom> {
  // Generate random 6-character room code: HP-XXXX
  const randomChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 4; i++) {
    randomCode += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  const roomId = `HP-${randomCode}`;
  const now = Date.now();

  const hostMember: WatchPartyMember = {
    id: params.hostId,
    name: params.hostName,
    isHost: true,
    lastActive: now,
  };

  const initialRoom: WatchPartyRoom = {
    roomId,
    movieSlug: params.movieSlug,
    movieName: params.movieName,
    hostId: params.hostId,
    hostName: params.hostName,
    state: {
      currentTime: 0,
      isPlaying: true,
      episodeIndex: params.episodeIndex ?? 0,
      episodeName: params.episodeName ?? "Tập 1",
      serverIndex: params.serverIndex ?? 0,
      updatedAt: now,
    },
    messages: [
      {
        id: `msg_${now}`,
        senderId: "system",
        senderName: "Hệ thống",
        text: `Chào mừng bạn đến phòng xem chung "${params.movieName}". Hãy gửi link phòng cho bạn bè cùng thưởng thức!`,
        timestamp: now,
      },
    ],
    members: [hostMember],
    createdAt: now,
    updatedAt: now,
  };

  await saveWatchPartyRoom(initialRoom);
  return initialRoom;
}

export async function joinWatchPartyRoom(
  roomId: string,
  member: { id: string; name: string }
): Promise<WatchPartyRoom | null> {
  const room = await getWatchPartyRoom(roomId);
  if (!room) return null;

  const now = Date.now();
  const existingIdx = room.members.findIndex((m) => m.id === member.id);

  if (existingIdx >= 0) {
    room.members[existingIdx].lastActive = now;
    if (member.name) room.members[existingIdx].name = member.name;
  } else {
    room.members.push({
      id: member.id,
      name: member.name || "Khán giả",
      isHost: member.id === room.hostId,
      lastActive: now,
    });
    // System join announcement
    room.messages.push({
      id: `msg_join_${now}`,
      senderId: "system",
      senderName: "Hệ thống",
      text: `${member.name || "Một khán giả"} vừa tham gia phòng.`,
      timestamp: now,
    });
    // Keep max 60 messages
    if (room.messages.length > 60) {
      room.messages = room.messages.slice(-60);
    }
  }

  room.updatedAt = now;
  await saveWatchPartyRoom(room);
  return room;
}

export async function syncWatchPartyPlayback(
  roomId: string,
  stateUpdate: Partial<WatchPartyState>,
  senderId?: string
): Promise<WatchPartyRoom | null> {
  const room = await getWatchPartyRoom(roomId);
  if (!room) return null;

  const now = Date.now();
  room.state = {
    ...room.state,
    ...stateUpdate,
    updatedAt: now,
  };
  room.updatedAt = now;

  // Touch active member timestamp
  if (senderId) {
    const mem = room.members.find((m) => m.id === senderId);
    if (mem) mem.lastActive = now;
  }

  await saveWatchPartyRoom(room);
  return room;
}

export async function addWatchPartyChatMessage(
  roomId: string,
  sender: { id: string; name: string },
  text: string
): Promise<WatchPartyMessage | null> {
  const room = await getWatchPartyRoom(roomId);
  if (!room) return null;

  const cleanText = text.trim().slice(0, 300);
  if (!cleanText) return null;

  const now = Date.now();
  const newMsg: WatchPartyMessage = {
    id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: sender.id,
    senderName: sender.name || "Khán giả",
    text: cleanText,
    timestamp: now,
  };

  room.messages.push(newMsg);
  if (room.messages.length > 60) {
    room.messages = room.messages.slice(-60);
  }
  room.updatedAt = now;

  // Touch sender activity
  const mem = room.members.find((m) => m.id === sender.id);
  if (mem) mem.lastActive = now;

  await saveWatchPartyRoom(room);
  return newMsg;
}
