import SessionTimeout from "@/components/SessionTimeout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionTimeout />
      {children}
    </>
  );
}
