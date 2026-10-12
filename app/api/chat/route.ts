import { supabase } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, user_id } = await req.json();

    if (!message) {
      return Response.json({ error: "No message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `انت فيلسوف مصري اسمه الدميري، بترد بالعامية المصرية باسلوب عميق وساخر وحكيم. السؤال: ${message}` }] }],
        }),
      }
    );

    const data = await geminiRes.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "مفيش رد من جيميناي";

    // حفظ مع الـ user_id
    if (user_id) {
      await supabase.from("chats").insert({
        question: message,
        answer: replyText,
        user_id: user_id,
      });
    } else {
      await supabase.from("chats").insert({
        question: message,
        answer: replyText,
      });
    }

    return Response.json({ reply: replyText });

  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}