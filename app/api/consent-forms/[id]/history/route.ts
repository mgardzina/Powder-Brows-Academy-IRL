
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const history = await prisma.treatmentHistory.findMany({
      where: { formId: id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching treatment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch treatment history" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { date, description } = body;

    if (!date || !description) {
      return NextResponse.json(
        { error: "Date and description are required" },
        { status: 400 }
      );
    }

    const newEntry = await prisma.treatmentHistory.create({
      data: {
        formId: id,
        date: new Date(date),
        description,
      },
    });

    return NextResponse.json(newEntry);
  } catch (error) {
    console.error("Error creating treatment history:", error);
    return NextResponse.json(
      { error: "Failed to create treatment history" },
      { status: 500 }
    );
  }
}
