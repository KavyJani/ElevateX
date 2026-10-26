import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
export default async function JoinPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (role !== "investor" && role !== "founder") notFound();
  return <AuthForm mode="register" role={role} />;
}
