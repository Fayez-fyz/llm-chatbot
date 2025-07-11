"use server";

import { generateEmbeddingsInPineconeVectorStore } from "@/lib/embedding";
import { createClient } from "@/lib/supabase/server";

export async function generateEmbedding(docId: string) {
  const supabase = await createClient();

  // check user auth
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // turn pdf into embeddings

  await generateEmbeddingsInPineconeVectorStore(docId);

  return { success: true, message: "Embeddings generated successfully" };
}
