import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ContentDetail } from "@/components/admin/ContentDetail";

export const dynamic = "force-dynamic";

export default async function FilaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: item } = await supabaseAdmin.from("alude_content_items").select("*").eq("id", id).single();
  if (!item) notFound();

  return <ContentDetail item={item} />;
}
