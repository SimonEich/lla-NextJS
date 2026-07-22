// Swap this in for `localProgressRepository` in `repositories/index.ts` once
// you've created the table below in your Supabase project:
//
//   create table word_progress (
//     user_id        text not null,
//     word_id        text not null,
//     level          int not null default 1,
//     correct_count  int not null default 0,
//     sentence_index int not null default 0,
//     difficult      boolean not null default false,
//     state          text not null default 'inactive',
//     updated_at     timestamptz not null default now(),
//     primary key (user_id, word_id)
//   );
//   alter table word_progress enable row level security;
//   -- for now rows are keyed by an anonymous device id (see lib/deviceId.ts),
//   -- so this policy just allows anyone with the anon key to read/write.
//   -- Tighten this once real auth (e.g. Supabase Auth) is wired up.
//   create policy "device can read/write its own rows" on word_progress
//     for all using (true) with check (true);
//
import { getDeviceId } from "@/lib/deviceId";
import { supabase } from "@/lib/supabase";
import { WordProgress } from "@/services/progressService";
import { IProgressRepository } from "./types";

type Row = {
  user_id: string;
  word_id: string;
  level: number;
  correct_count: number;
  sentence_index: number;
  difficult: boolean;
  state: WordProgress["state"];
};

function toWordProgress(row: Row): WordProgress {
  return {
    wordId: row.word_id,
    level: row.level,
    correctCount: row.correct_count,
    sentenceIndex: row.sentence_index,
    difficult: row.difficult,
    state: row.state,
  };
}

function toRow(userId: string, wp: WordProgress): Row {
  return {
    user_id: userId,
    word_id: wp.wordId,
    level: wp.level,
    correct_count: wp.correctCount,
    sentence_index: wp.sentenceIndex,
    difficult: wp.difficult,
    state: wp.state,
  };
}

export const supabaseProgressRepository: IProgressRepository = {
  async load() {
    if (!supabase) throw new Error("Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    const userId = getDeviceId();
    const { data, error } = await supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return Object.fromEntries((data as Row[]).map((row) => [row.word_id, toWordProgress(row)]));
  },

  async save(progress) {
    if (!supabase) throw new Error("Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    const userId = getDeviceId();
    const rows = Object.values(progress).map((wp) => toRow(userId, wp));
    if (rows.length === 0) return;
    const { error } = await supabase.from("word_progress").upsert(rows);
    if (error) throw error;
  },

  async saveOne(wp) {
    if (!supabase) throw new Error("Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    const userId = getDeviceId();
    const { error } = await supabase.from("word_progress").upsert(toRow(userId, wp));
    if (error) throw error;
  },
};
