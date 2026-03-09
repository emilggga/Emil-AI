import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  role: "user" | "model";
  content: string;
  attachments?: {
    mimeType: string;
    data: string;
    name: string;
    type: 'image' | 'audio' | 'video' | 'file';
  }[];
}

export async function* chatWithEmilStream(messages: Message[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "Tu esi Emil AI, izpalīdzīgs, draudzīgs un gudrs AI asistents no Latvijas. Tava misija ir sniegt skaidru, kodolīgu un precīzu informāciju lietotājam. Tu vari palīdzēt ar programmēšanu, rakstīšanu, analīzi un vispārīgiem jautājumiem. Vienmēr saglabā profesionālu, bet pieejamu toni. Vienmēr atbildi tajā pašā valodā, kurā lietotājs uzrunā tevi.",
    },
  });

  const lastMessage = messages[messages.length - 1];
  
  const parts: MessagePart[] = [];
  
  // Add text
  parts.push({ text: lastMessage.content });
  
  // Add attachments
  if (lastMessage.attachments) {
    for (const attachment of lastMessage.attachments) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
        }
      });
    }
  }
  
  const response = await chat.sendMessageStream({
    message: parts,
  });

  for await (const chunk of response) {
    const c = chunk as GenerateContentResponse;
    yield c.text;
  }
}
