import { SimpleConsoleShell } from "@/lib/simple-console/Shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SimpleConsoleShell agentId="customer-intelligence-sentinal">{children}</SimpleConsoleShell>;
}
