import { CompletePasswordReset } from "@/components/complete-password-reset";

export default async function CompleteResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <CompletePasswordReset token={token ?? ""} />;
}
