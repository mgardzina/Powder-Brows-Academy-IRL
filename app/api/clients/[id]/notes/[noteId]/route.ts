import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE - Usunięcie notatki
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { noteId } = await params;

    await prisma.clientNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania notatki:", error);
    return NextResponse.json(
      { success: false, error: "Błąd usuwania notatki" },
      { status: 500 }
    );
  }
}
