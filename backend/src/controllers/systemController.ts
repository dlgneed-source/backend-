import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { buildPlanEconomicsSnapshot } from "../utils/planEconomics";

const prisma = new PrismaClient();

export async function getPlanEconomics(req: Request, res: Response): Promise<void> {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    res.json({
      success: true,
      economics: buildPlanEconomicsSnapshot(plans),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch plan economics snapshot" });
  }
}
