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

    // Calculate week range
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    console.log(`Generating reports for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Get all teachers
    const { data: teachers, error: teachersError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "teacher");

    if (teachersError) {
      console.error("Error fetching teachers:", teachersError);
      throw teachersError;
    }

    console.log(`Found ${teachers?.length || 0} teachers`);

    const reports = [];

    for (const teacher of teachers || []) {
      try {
        // Get teacher's subjects/zones
        const { data: subjects } = await supabase
          .from("teacher_subjects")
          .select("zone_id")
          .eq("teacher_id", teacher.user_id);

        const zoneIds = subjects?.map(s => s.zone_id) || [];

        if (zoneIds.length === 0) {
          console.log(`Teacher ${teacher.user_id} has no zones, skipping`);
          continue;
        }

        // Get students in teacher's zones
        const { data: students } = await supabase
          .from("user_zone_progress")
          .select("user_id")
          .in("zone_id", zoneIds);

        const studentIds = [...new Set(students?.map(s => s.user_id) || [])];

        // Get submissions for the week
        const { data: submissions } = await supabase
          .from("task_submissions")
          .select(`
            id,
            user_id,
            task_id,
            grade,
            status,
            submitted_at,
            tasks!inner(zone_id)
          `)
          .in("tasks.zone_id", zoneIds)
          .gte("submitted_at", weekStart.toISOString())
          .lte("submitted_at", weekEnd.toISOString());

        // Calculate statistics
        const totalSubmissions = submissions?.length || 0;
        const reviewedSubmissions = submissions?.filter(s => s.status === "reviewed").length || 0;
        const pendingSubmissions = submissions?.filter(s => s.status === "pending").length || 0;

        const grades = submissions?.filter(s => s.grade !== null).map(s => s.grade) || [];
        const avgGrade = grades.length > 0
          ? grades.reduce((a, b) => a + b, 0) / grades.length
          : 0;

        const activeStudents = new Set(submissions?.map(s => s.user_id)).size;

        // Find problematic zones (low average grades)
        const zoneStats: Record<string, { total: number; sum: number; name: string }> = {};
        
        for (const sub of submissions || []) {
          if (sub.grade !== null) {
            const zoneId = (sub.tasks as any).zone_id;
            if (!zoneStats[zoneId]) {
              zoneStats[zoneId] = { total: 0, sum: 0, name: '' };
            }
            zoneStats[zoneId].total++;
            zoneStats[zoneId].sum += sub.grade;
          }
        }

        const problematicZones = Object.entries(zoneStats)
          .map(([zoneId, stats]) => ({
            zoneId,
            avgGrade: stats.sum / stats.total,
            submissions: stats.total,
          }))
          .filter(z => z.avgGrade < 70)
          .sort((a, b) => a.avgGrade - b.avgGrade);

        // Inactive students (no submissions this week)
        const inactiveStudents = studentIds.filter(
          sid => !submissions?.some(s => s.user_id === sid)
        );

        const reportData = {
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          summary: {
            totalSubmissions,
            reviewedSubmissions,
            pendingSubmissions,
            avgGrade: Math.round(avgGrade * 10) / 10,
            activeStudents,
            totalStudents: studentIds.length,
            activityRate: Math.round((activeStudents / studentIds.length) * 100) || 0,
          },
          problematicZones: problematicZones.slice(0, 3),
          inactiveStudentsCount: inactiveStudents.length,
          topPerformers: submissions
            ?.filter(s => s.grade && s.grade >= 90)
            .map(s => s.user_id)
            .slice(0, 5) || [],
        };

        // Save report to database
        const { error: insertError } = await supabase
          .from("weekly_reports")
          .upsert({
            teacher_id: teacher.user_id,
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
            report_data: reportData,
          });

        if (insertError) {
          console.error(`Error saving report for teacher ${teacher.user_id}:`, insertError);
        } else {
          console.log(`Report generated for teacher ${teacher.user_id}`);
          reports.push({
            teacherId: teacher.user_id,
            reportData,
          });

          // Send email notification (placeholder)
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(teacher.user_id);
            if (userData?.user?.email) {
              console.log(`[EMAIL PLACEHOLDER] Sending weekly report to ${userData.user.email}`);
              console.log(`Summary: ${reportData.summary.totalSubmissions} submissions, avg grade: ${reportData.summary.avgGrade}, ${reportData.summary.pendingSubmissions} pending`);
              // TODO: Implement actual email sending with Resend
              // await sendEmailNotification(userData.user.email, reportData);
            }
          } catch (emailError) {
            console.error(`Error sending email to teacher ${teacher.user_id}:`, emailError);
          }
        }
      } catch (error) {
        console.error(`Error processing teacher ${teacher.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${reports.length} weekly reports`,
        reports: reports.length,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in generate-weekly-reports function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
