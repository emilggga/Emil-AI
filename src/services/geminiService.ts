import OpenAI from "openai";

export interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: {
    mimeType: string;
    data: string;
    name: string;
    type: 'image' | 'audio' | 'video' | 'file';
  }[];
}

export async function* chatWithEmilStream(messages: any[], customApiKey?: string) {
  const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "MY_OPENROUTER_API_KEY" || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      "HTTP-Referer": window.location.origin,
      "X-Title": "Emil AI",
    }
  });

  const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(msg => {
    const content: any[] = [{ type: "text", text: msg.content || " " }];
    
    if (msg.attachments) {
      msg.attachments.forEach((att: any) => {
        if (att.mimeType.startsWith('image/')) {
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${att.mimeType};base64,${att.data}`
            }
          });
        }
      });
    }

    const role = (msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user') as "assistant" | "user";

    return {
      role,
      content: content.length === 1 && typeof content[0].text === 'string' ? content[0].text : content
    } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
  });

  const stream = await openai.chat.completions.create({
    model: "google/gemini-2.0-flash-001", // Default model via OpenRouter
    messages: [
      { 
        role: "system", 
        content: "Tu esi Emil AI, izpalīdzīgs, draudzīgs un gudrs AI asistents no Latvijas. Tava misija ir sniegt skaidru, kodolīgu un precīzu informāciju lietotājam. Tu vari palīdzēt ar programmēšanu, rakstīšanu, analīzi un vispārīgiem jautājumiem. Vienmēr saglabā profesionālu, bet pieejamu toni. Vienmēr atbildi tajā pašā valodā, kurā lietotājs uzrunā tevi." 
      },
      ...formattedMessages
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield content;
    }
  }
}
