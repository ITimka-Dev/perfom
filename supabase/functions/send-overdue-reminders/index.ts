import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all submissions waiting for review more than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: submissions, error } = await supabase
      .from("task_submissions")
      .select(`
        id,
        submitted_at,
        task:tasks (
          id,
          title,
          teacher:users (
            id,
            email,
            profile:profiles (full_name)
          )
        )
      `)
      .is("grade", null)
      .lt("submitted_at", threeDaysAgo.toISOString());

    if (error) {
      console.error("Error fetching submissions:", error);
      throw error;
    }

    console.log(`Found ${submissions?.length || 0} overdue submissions`);

    // ЗАГЛУШКА: вместо реальной отправки email просто логируем
    for (const submission of submissions || []) {
      const task = submission.task as any;
      const teacher = task?.teacher;
      if (teacher?.email) {
        console.log(`[MOCK EMAIL] Would send reminder to ${teacher.email} about submission #${submission.id}`);
        console.log(`Task: ${task?.title}`);
        console.log(`Submitted: ${submission.submitted_at}`);
        console.log(`Days waiting: ${Math.floor((Date.now() - new Date(submission.submitted_at).getTime()) / (1000 * 60 * 60 * 24))}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${submissions?.length || 0} overdue submissions (mock mode)`,
        note: "Email sending is disabled. Set up RESEND_API_KEY to enable real emails."
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-overdue-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
