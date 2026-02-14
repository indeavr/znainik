import type { NextApiRequest, NextApiResponse } from 'next';

interface RequestBody {
  theme: string;
  notes: string;
  day: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, notes, day } = req.body as RequestBody;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    // For now, we'll use a mock response since Gemini API requires setup
    // In production, you would integrate with Google's Gemini API here
    const mockResponse = generateMockContent(theme, notes, day);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return res.status(200).json({ content: mockResponse });
  } catch (err) {
    console.error('Error generating content:', err);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
}

function generateMockContent(theme: string, notes: string | undefined, day: number): string {
  const templates = [
    `🌟 AI генерирано съдържание за "${theme}" (Ден ${day})\n\nВъз основа на вашите бележки: "${notes ?? 'Няма бележки'}"\n\nПредложение за пост:\n• Започнете с въпрос, който привлича вниманието\n• Споделете лична история или опит\n• Дайте практични съвети\n• Завършете с призив за действие\n\nХаштагове: #${(theme ?? '').replace(/\s+/g, '')} #МанифестиращиГенератор #Развитие`,

    `✨ Креативна идея за "${theme}" (Ден ${day})\n\nИнспирирано от: "${notes ?? 'Вашата енергия'}"\n\nСъдържание:\n🎯 Заглавие: "Как ${theme} променя живота ви"\n📝 Структура:\n   - Въведение с емоция\n   - 3 ключови точки\n   - Практически съвет\n   - Въпрос към аудиторията\n\n💡 Съвет: Използвайте визуални елементи за по-голямо въздействие`,

    `🚀 Стратегия за "${theme}" (Ден ${day})\n\nБазирано на: "${notes ?? 'Интуитивни прозрения'}"\n\nПлан за съдържание:\n1. Споделете предизвикателство\n2. Обяснете как ${theme} помага\n3. Дайте конкретни стъпки\n4. Поканете за взаимодействие\n\nФормат: Карусел от 5-7 слайда\nТон: Вдъхновяващ и практичен\nЦел: Образование + Ангажираност`
  ];

  const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
  if (!selectedTemplate) {
    return ''; // Return empty string as fallback to ensure string type
  }
  return selectedTemplate;
}