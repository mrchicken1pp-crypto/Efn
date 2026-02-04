import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get("term")
  const entity = searchParams.get("entity") || "software"
  const limit = searchParams.get("limit") || "25"

  if (!term) {
    return NextResponse.json({ results: [] })
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=${limit}&country=US`
    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("iTunes API error:", error)
    return NextResponse.json({ results: [], error: "Failed to fetch" }, { status: 500 })
  }
}
