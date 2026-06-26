import { redirect } from "next/navigation";

// The eval root redirects into the first step of the wizard.
export default async function EvaluationIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/evaluations/${id}/admin`);
}
