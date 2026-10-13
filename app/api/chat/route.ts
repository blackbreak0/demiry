import { supabase } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, user_id } = await req.json();
    if (!message) return Response.json({ error: "No message" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;

    // الموديلات الصحيحة لمفاتيح AQ الجديدة
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.8-flash"
    ];

    let replyText = "";
    let lastError = "";

    for (const model of modelsToTry) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey as string,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `انت فيلسوف مصري اسمه الدميري، بترد بالعامية المصرية باسلوب عميق وساخر وحكيم. السؤال: ${message}` }] }],
          }),
        }
      );

      const data = await geminiRes.json();

      if (geminiRes.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        replyText = data.candidates[0].content.parts[0].text;
        break;
      } else {
        lastError = data.error?.message || JSON.stringify(data);
        console.log(`Model ${model} failed: ${lastError}`);
      }
    }

    if (!replyText) {
      replyText = `الدميري مشغول: ${lastError}`;
    }

    await supabase.from("chats").insert({
      question: message,
      answer: replyText,
      user_id: user_id || null,
    });

    return Response.json({ reply: replyText });

  } catch (err: any) {
    console.error(err);
    return Response.json({ reply: "حصل ايرور داخلي" });
  }
}
