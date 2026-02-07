import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// configuration parameters
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20mb in bytes
const ALLOWED_EXTENSIONS = [".pdb", ".csv", ".fasta", ".fa"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "no file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }

    // validate file extension
    const fileName = file.name.toLowerCase();
    const fileExtension = path.extname(fileName);
    
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { 
          error: "file type not supported. please upload .pdb, .csv, or .fasta files", 
          code: "INVALID_TYPE" 
        },
        { status: 400 }
      );
    }

    // validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: "file size exceeds 20mb limit", 
          code: "FILE_TOO_LARGE" 
        },
        { status: 400 }
      );
    }

    // create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // directory might already exist, ignore error
    }

    // generate unique filename to prevent overwrites
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-z0-9._-]/gi, "_");
    const uniqueFileName = `${timestamp}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // return success response
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: fileExtension.slice(1), // remove the dot
        savedAs: uniqueFileName,
        path: `/uploads/${uniqueFileName}`
      }
    });

  } catch (error) {
    console.error("upload error:", error);
    return NextResponse.json(
      { 
        error: "upload failed. please try again", 
        code: "UPLOAD_ERROR" 
      },
      { status: 500 }
    );
  }
}

// handle options for cors
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
