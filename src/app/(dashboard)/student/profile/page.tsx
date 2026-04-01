import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { EditProfileButton } from "@/components/student/edit-profile-button";
import { Mail, Phone, Building, BookOpen, Hash, User } from "lucide-react";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2 text-[13px] text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <span className="text-[13px] font-medium text-zinc-800 text-right truncate max-w-[55%]">{value}</span>
    </div>
  );
}

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({
    where: { userId: session!.user.id },
    include: {
      user: { select: { userId: true, createdAt: true } },
      mentor: { select: { name: true, email: true, phone: true, specialization: true, department: true, bio: true } },
      editRequests: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!student) return null;
  const lastRequest = student.editRequests[0] ?? null;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="My Profile">
        <EditProfileButton
          student={{ name: student.name, phone: student.phone ?? "", course: student.course ?? "", batch: student.batch ?? "" }}
          hasPendingRequest={lastRequest?.status === "PENDING"}
        />
      </PageHeader>

      {/* Edit request banner */}
      {lastRequest?.status === "PENDING" && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800">
          <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <strong>Profile edit pending admin approval.</strong>
        </div>
      )}
      {lastRequest && lastRequest.status === "APPROVED" && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-[13px] text-emerald-800">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <strong>Profile edit approved.</strong>
          {lastRequest.adminNote && <span className="text-emerald-600">{lastRequest.adminNote}</span>}
        </div>
      )}
      {lastRequest && lastRequest.status === "REJECTED" && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-800">
          <div className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
          <strong>Profile edit rejected.</strong>
          {lastRequest.adminNote && <span className="text-red-600">{lastRequest.adminNote}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Info */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[16px]">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-zinc-900 text-[15px]">{student.name}</p>
              <span className="font-mono text-[12px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">{student.user.userId}</span>
            </div>
          </div>
          <div>
            <InfoRow icon={Mail}     label="Email"  value={student.email} />
            {student.phone  && <InfoRow icon={Phone}    label="Phone"  value={student.phone} />}
            {student.course && <InfoRow icon={BookOpen} label="Course" value={student.course} />}
            {student.batch  && <InfoRow icon={Hash}     label="Batch"  value={student.batch} />}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-zinc-500 flex items-center gap-2"><User className="h-3.5 w-3.5" />Status</span>
              <Badge variant={student.status === "ACTIVE" ? "success" : student.status === "PASSED_OUT" ? "secondary" : "destructive"} className="text-[11px] px-2 py-0.5">
                {student.status === "ACTIVE" ? "Active" : student.status === "PASSED_OUT" ? "Passed Out" : "Dropped Out"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mentor Info */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5">
          <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-4">My Mentor</p>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-[16px]">
              {student.mentor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-zinc-900 text-[15px]">{student.mentor.name}</p>
              {student.mentor.specialization && (
                <p className="text-[12px] text-zinc-400 mt-0.5">{student.mentor.specialization}</p>
              )}
            </div>
          </div>
          <div>
            <InfoRow icon={Mail} label="Email" value={student.mentor.email} />
            {student.mentor.phone      && <InfoRow icon={Phone}    label="Phone"  value={student.mentor.phone} />}
            {student.mentor.department && <InfoRow icon={Building} label="Dept."  value={student.mentor.department} />}
          </div>
          {student.mentor.bio && (
            <p className="text-[12px] text-zinc-500 mt-4 leading-relaxed border-t border-zinc-100 pt-4">{student.mentor.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}
