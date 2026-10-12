"use client";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<{q:string, a:string}[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({data})=> {
      setUser(data.session?.user?? null);
      if(data.session?.user) loadHistory(data.session.user.id);
    });
  }, []);

  async function loadHistory(userId?: string) {
    const id = userId || user?.id;
    if(!id) return;
    const { data } = await supabase.from("chats").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20);
    if(data) setHistory(data);
  }

  async function handleAuth(type: 'login' | 'signup') {
    if(type === 'signup'){
      const { error } = await supabase.auth.signUp({ email, password });
      if(!error) alert("تم! اعمل دخول دلوقتي");
      else alert(error.message);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if(error) alert(error.message);
      else { setUser(data.user); loadHistory(data.user?.id); }
    }
  }

    async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if(error) alert(error.message);
  }

  async function send() {
    if(!msg.trim()) return;
    setLoading(true);
    const currentMsg = msg;
    setMsg("");
    setChat(prev => [...prev, {q: currentMsg, a: "الدميري بيفكر..."}]);
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: currentMsg, user_id: user.id }) });
    const data = await res.json();
    setChat(prev => {
      const newChat = [...prev];
      newChat[newChat.length - 1] = {q: currentMsg, a: data.reply};
      return newChat;
    });
    setLoading(false);
    loadHistory();
  }

  if(!user){
    return (
      <main dir="rtl" className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <img src="/demiry.jpg" alt="demiry" className="w-28 h-28 rounded-full border-2 border-yellow-600 mb-4" />
        <h1 className="text-3xl font-bold mb-6">شات الدميرى</h1>
        <div className="w-full max-w-sm bg-zinc-900 p-6 rounded-2xl space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الايميل" className="w-full p-3 rounded-xl bg-black border border-zinc-800 text-right outline-none" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="الباسورد" className="w-full p-3 rounded-xl bg-black border border-zinc-800 text-right outline-none" />
          <button onClick={()=>handleAuth('login')} className="w-full bg-white text-black p-3 rounded-xl font-bold">دخول</button>
          <button onClick={()=>handleAuth('signup')} className="w-full bg-zinc-800 p-3 rounded-xl">حساب جديد</button>

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-[1px] bg-zinc-800"></div>
            <span className="text-zinc-500 text-sm">او</span>
            <div className="flex-1 h-[1px] bg-zinc-800"></div>
          </div>

          <button onClick={signInWithGoogle} className="w-full bg-white text-black p-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google" />
            التسجيل بجوجل
          </button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black text-white flex text-right">
      <div className="w-[280px] bg-zinc-950 border-r border-zinc-900 p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <img src="/demiry.jpg" alt="demiry" className="w-10 h-10 rounded-full" />
          <h2 className="font-bold">سجل المحادثات</h2>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1">
          {history.map((h:any)=>(
            <div key={h.id} onClick={()=> setChat([{q: h.question, a: h.answer}])} className="p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800 text-sm truncate">{h.question}</div>
          ))}
        </div>
        <button onClick={()=> supabase.auth.signOut().then(()=> setUser(null))} className="mt-4 text-sm text-zinc-400">خروج - {user.email}</button>
      </div>
      <div className="flex-1 flex flex-col items-center p-6 pb-24">
        <div className="flex flex-col items-center mb-6">
          <img src="/demiry.jpg" alt="demiry" className="w-20 h-20 rounded-full border-2 border-yellow-600 mb-2" />
          <h1 className="text-2xl font-bold">شات الدميرى</h1>
        </div>
        <div className="w-full max-w-2xl space-y-4">
          {chat.map((c,i)=>(
            <div key={i} className="bg-zinc-900 p-4 rounded-xl"><p className="text-zinc-400 text-sm">انت: {c.q}</p><p className="mt-2 whitespace-pre-wrap leading-8">{c.a}</p></div>
          ))}
        </div>
        <div className="fixed bottom-6 w-full max-w-2xl flex gap-2 px-6">
          <input dir="rtl" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=> e.key === 'Enter' && send()} placeholder="اسأل الدميري..." className="flex-1 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-right outline-none" />
          <button onClick={send} className="bg-white text-black px-6 rounded-xl font-bold">{loading?"...":"اسأل"}</button>
        </div>
      </div>
    </main>
  );
}