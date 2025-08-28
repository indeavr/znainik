import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RequestBody {
  verse: string;
  verseNumber: string | number;
}

export async function POST(request: Request) {
  try {
    const { verse, verseNumber } = await request.json() as RequestBody;
    
    if (!verse) {
      return NextResponse.json(
        { error: 'Verse text is required' },
        { status: 400 }
      );
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a wise Taoist sage who provides thoughtful reflections on verses from the Tao Te Ching. 
          Your reflections should be insightful, contemplative, and help the seeker apply the wisdom to their life.
          Keep your response between 150-200 words. Use a calm, wise tone that invites reflection.`
        },
        {
          role: "user",
          content: `Please provide a reflection on verse ${verseNumber} of the Tao Te Ching: "${verse}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });
    
    const reflection = response.choices[0]?.message?.content || 
      "The way that can be spoken of is not the constant way. Reflect on the silence between these words.";
    
    return NextResponse.json({ reflection });
  } catch (err) {
    console.error('Error generating reflection:', err);
    return NextResponse.json(
      { error: 'Failed to generate reflection' },
      { status: 500 }
    );
  }
}