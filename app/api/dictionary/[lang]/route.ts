import { NextResponse } from "next/server";

/**
 * API route to serve dictionary files
 * Loads dictionaries server-side and returns them as JSON
 * This allows the web worker to load dictionaries without bundling them
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  try {
    // Load dictionary server-side (Node.js environment)
    // This is safe because API routes only run on the server
    let dictionaryData: { aff: Buffer; dic: Buffer };

    switch (lang) {
      case "en": {
        // dictionary-en exports a default: { aff: Buffer, dic: Buffer }
        const dictionaryEnModule = await import("dictionary-en");
        // Access the default export directly
        dictionaryData = dictionaryEnModule.default as {
          aff: Buffer;
          dic: Buffer;
        };
        break;
      }
      case "de": {
        // dictionary-de exports a default: { aff: Buffer, dic: Buffer }
        const dictionaryDeModule = await import("dictionary-de");
        // Access the default export directly
        dictionaryData = dictionaryDeModule.default as {
          aff: Buffer;
          dic: Buffer;
        };
        break;
      }
      default:
        return NextResponse.json(
          { error: `Dictionary not found for language: ${lang}` },
          { status: 404 },
        );
    }

    // Validate that we have the expected structure
    if (!dictionaryData) {
      console.error("Dictionary data is null or undefined");
      return NextResponse.json(
        { error: "Dictionary data is null or undefined" },
        { status: 500 },
      );
    }

    if (!dictionaryData.aff || !Buffer.isBuffer(dictionaryData.aff)) {
      console.error("Invalid aff data:", {
        hasAff: "aff" in dictionaryData,
        affType: typeof dictionaryData.aff,
        affIsBuffer: Buffer.isBuffer(dictionaryData.aff),
        dictionaryDataKeys: Object.keys(dictionaryData),
      });
      return NextResponse.json(
        { error: "Invalid dictionary aff data" },
        { status: 500 },
      );
    }

    if (!dictionaryData.dic || !Buffer.isBuffer(dictionaryData.dic)) {
      console.error("Invalid dic data:", {
        hasDic: "dic" in dictionaryData,
        dicType: typeof dictionaryData.dic,
        dicIsBuffer: Buffer.isBuffer(dictionaryData.dic),
      });
      return NextResponse.json(
        { error: "Invalid dictionary dic data" },
        { status: 500 },
      );
    }

    // Convert Buffer to Array for JSON serialization
    // The worker will convert these back to Uint8Array/Buffer
    const response = NextResponse.json({
      aff: Array.from(dictionaryData.aff),
      dic: Array.from(dictionaryData.dic),
    });

    // Add caching headers for performance
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );

    return response;
  } catch (error) {
    console.error(`Failed to load dictionary for language ${lang}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, lang });
    return NextResponse.json(
      {
        error: `Failed to load dictionary: ${errorMessage}`,
        details:
          process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 },
    );
  }
}
