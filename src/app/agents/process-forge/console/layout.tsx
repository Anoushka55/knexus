import { SimpleConsoleShell } from "@/lib/simple-console/Shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SimpleConsoleShell agentId="process-forge">{children}</SimpleConsoleShell>;
}
