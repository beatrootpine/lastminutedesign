import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, data } = req.body;
  if (!action) return res.status(400).json({ error: "Missing action" });

  try {
    switch (action) {

      case "customer_login": {
        const { email, name } = data;
        let { data: customer } = await supabase.from("customers").select("*").eq("email", email).single();
        if (!customer) {
          const { data: c, error } = await supabase.from("customers").insert({ email, name }).select().single();
          if (error) throw error;
          customer = c;
        }
        return res.json({ success: true, customer });
      }

      case "designer_register": {
        const { email, name, city, bio, skills } = data;
        const initials = name.split(" ").map(w => w[0]).join("").toUpperCase();
        const { data: designer, error } = await supabase
          .from("designers")
          .insert({ email, name, city, bio, skills, avatar_initials: initials, is_online: true, is_approved: true })
          .select().single();
        if (error) {
          if (error.code === "23505") {
            const { data: existing } = await supabase.from("designers").select("*").eq("email", email).single();
            return res.json({ success: true, designer: existing });
          }
          throw error;
        }
        return res.json({ success: true, designer });
      }

      case "designer_login": {
        const { email } = data;
        const { data: designer, error } = await supabase.from("designers").select("*").eq("email", email).single();
        if (error || !designer) return res.status(404).json({ error: "Designer not found. Register first." });
        await supabase.from("designers").update({ is_online: true }).eq("id", designer.id);
        return res.json({ success: true, designer: { ...designer, is_online: true } });
      }

      case "create_gig": {
        const { customer_id, service, category, brief, turnaround, price } = data;
        const deadline = new Date(Date.now() + turnaround * 3600000).toISOString();
        const { data: designers } = await supabase.from("designers").select("*").eq("is_online", true).eq("is_approved", true).contains("skills", [service]);
        let designer = designers?.length > 0 ? designers[Math.floor(Math.random() * designers.length)] : null;
        if (!designer) {
          const { data: any } = await supabase.from("designers").select("*").eq("is_online", true).limit(1);
          designer = any?.[0] || null;
        }
        const { data: gig, error } = await supabase.from("gigs").insert({
          customer_id, designer_id: designer?.id || null, service, category, brief, turnaround, price,
          status: designer ? "in_progress" : "pending", deadline,
        }).select().single();
        if (error) throw error;
        return res.json({ success: true, gig, designer });
      }

      case "get_customer_gigs": {
        const { data: gigs, error } = await supabase.from("gigs").select("*").eq("customer_id", data.customer_id).order("created_at", { ascending: false });
        if (error) throw error;
        return res.json({ success: true, gigs });
      }

      case "get_available_gigs": {
        const { data: gigs, error } = await supabase.from("gigs").select("*").eq("status", "pending").order("created_at", { ascending: false });
        if (error) throw error;
        return res.json({ success: true, gigs });
      }

      case "get_designer_gigs": {
        const { data: gigs, error } = await supabase.from("gigs").select("*").eq("designer_id", data.designer_id).order("created_at", { ascending: false });
        if (error) throw error;
        return res.json({ success: true, gigs });
      }

      case "accept_gig": {
        const { gig_id, designer_id } = data;
        const { data: g } = await supabase.from("gigs").select("turnaround").eq("id", gig_id).single();
        const deadline = new Date(Date.now() + (g?.turnaround || 24) * 3600000).toISOString();
        const { data: gig, error } = await supabase.from("gigs").update({ designer_id, status: "in_progress", deadline }).eq("id", gig_id).select().single();
        if (error) throw error;
        return res.json({ success: true, gig });
      }

      case "deliver_gig": {
        const { data: gig, error } = await supabase.from("gigs").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", data.gig_id).select().single();
        if (error) throw error;
        return res.json({ success: true, gig });
      }

      case "complete_gig": {
        const { gig_id, customer_id, designer_id, score, feedback } = data;
        await supabase.from("gigs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", gig_id);
        const { data: rating, error } = await supabase.from("ratings").insert({ gig_id, customer_id, designer_id, score, feedback }).select().single();
        if (error) throw error;
        return res.json({ success: true, rating });
      }

      case "get_designers": {
        const { data: designers, error } = await supabase.from("designers").select("*").order("rating", { ascending: false });
        if (error) throw error;
        return res.json({ success: true, designers });
      }

      case "get_designer": {
        const { data: designer, error } = await supabase.from("designers").select("*").eq("id", data.designer_id).single();
        if (error) throw error;
        return res.json({ success: true, designer });
      }

      case "get_gig_files": {
        const { data: files, error } = await supabase.from("files").select("*").eq("gig_id", data.gig_id).order("created_at", { ascending: false });
        if (error) throw error;
        return res.json({ success: true, files });
      }

      case "register_file": {
        const { gig_id, uploaded_by_role, uploaded_by_id, file_name, file_path, file_size, file_type } = data;
        const { data: file, error } = await supabase.from("files").insert({ gig_id, uploaded_by_role, uploaded_by_id, file_name, file_path, file_size, file_type }).select().single();
        if (error) throw error;
        return res.json({ success: true, file });
      }

      case "upload_file": {
        const { gig_id, file_name, file_base64, content_type } = data;
        const buffer = Buffer.from(file_base64, "base64");
        const path = `${gig_id}/${Date.now()}_${file_name}`;
        const { error } = await supabase.storage.from("deliverables").upload(path, buffer, { contentType: content_type });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("deliverables").getPublicUrl(path);
        return res.json({ success: true, path, url: urlData.publicUrl });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
