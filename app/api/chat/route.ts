import { supabase } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, user_id } = await req.json();
    if (!message) return Response.json({ error: "No message" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    const modelsToTry = [
      "gemini-3-flash-preview",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    let replyText = "";
    let lastError = "";

    for (const model of modelsToTry) {
      try {
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
          console.log(`Success with model: ${model}`);
          break; // نجح، اطلع من اللوب
        } else {
          lastError = data.error?.message || "No candidate";
          console.log(`Model ${model} failed: ${lastError}`);
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!replyText) {
      replyText = `الدميري مشغول دلوقتي، الموديلات كلها عليها ضغط: ${lastError}`;
    }

    await supabase.from("chats").insert({
      question: message,
      answer: replyText,
      user_id: user_id || null,
    });

    return Response.json({ reply: replyText });

  } catch (err: any) {
    console.error(err);
    return Response.json({ reply: "حصل ايرور داخلي، حاول تاني" });
  }
}
