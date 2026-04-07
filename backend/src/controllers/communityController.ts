import { Request, Response } from "express";
import { listRecentMessages, listRooms } from "../services/communityStore";

export async function getCommunityBootstrap(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    rooms: listRooms(),
    messages: listRecentMessages(),
  });
}
