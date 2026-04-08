import { Request, Response } from "express";
import { DEFAULT_ROOM, listRecentMessages, listRooms } from "../services/communityStore";

export async function getCommunityBootstrap(req: Request, res: Response): Promise<void> {
  try {
    const rooms = await listRooms();
    const messages = await listRecentMessages(DEFAULT_ROOM);
    res.json({
      success: true,
      rooms,
      messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load community data" });
  }
}
