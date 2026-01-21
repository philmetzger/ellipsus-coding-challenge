"use client";

import { Editor } from "./components/Editor";
import { motion } from "framer-motion";
import { SpellCheckerExtension } from "./components/Editor/extensions/SpellChecker";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] font-sans py-16">
      <main className="w-full max-w-5xl px-8">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-light tracking-tight text-[rgba(25,25,25,0.6)]">
            Ellipsus Coding Challenge - Tiptap Spellchecker
          </h1>
        </header>
        <div className="tiptap-container rounded-3xl border border-[rgba(0,0,0,0.04)] bg-white">
          <Editor extensions={[SpellCheckerExtension.configure()]} />
        </div>
      </main>
    </div>
  );
}
