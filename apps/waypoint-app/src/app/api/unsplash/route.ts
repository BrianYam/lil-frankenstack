import { NextResponse } from 'next/server';
import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  fetch: fetch,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'travel';
  
  try {
    const result = await unsplash.photos.getRandom({
      query: query,
      orientation: 'landscape',
      count: 1,
    });

    if (result.errors) {
      return NextResponse.json(
        { error: 'Failed to fetch image from Unsplash' },
        { status: 500 }
      );
    }

    const response = Array.isArray(result.response) ? result.response[0] : result.response;
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}
