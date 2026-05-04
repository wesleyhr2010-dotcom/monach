import { NextRequest, NextResponse } from "next/server";
import { submitLead } from "@/app/admin/actions-leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await submitLead(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, id: result.data.id },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
