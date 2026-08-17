import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InstallationDoc() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Installation</h1>
        <p className="text-lg text-muted-foreground">How to deploy Capsulex Auth and structure your application.</p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 mb-12">
        <p className="text-sm text-primary font-medium">
          Recommended for new projects: Use the CLI or our drop-in Next.js starter template for the fastest integration.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">Deploying the Backend</h2>
          <p className="text-muted-foreground mb-6">
            Capsulex Auth is built on a blazing fast FastAPI backend. You can self-host it using Docker or run it locally using `uv`.
          </p>
          <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] mb-6">
            <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/[0.02]">
              <span className="text-xs font-mono text-white/40">Terminal</span>
            </div>
            <div className="p-4">
              <pre className="text-sm font-mono text-white/80">
                <code>
<span className="text-gray-500"># Clone the repository</span>{"\n"}
git clone https://github.com/tanmayvaij/capsulex-auth.git{"\n"}
cd capsulex-auth/backend{"\n\n"}
<span className="text-gray-500"># Install dependencies using uv</span>{"\n"}
uv venv{"\n"}
source .venv/bin/activate{"\n"}
uv pip install -r pyproject.toml{"\n\n"}
<span className="text-gray-500"># Run the server</span>{"\n"}
uv run uvicorn main:app --reload
                </code>
              </pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">Client Integration</h2>
          <p className="text-muted-foreground mb-6">
            Once your server is running, you can connect your frontend application using the React SDK.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-border/50 hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">React SDK</h3>
              <p className="text-muted-foreground text-sm mb-6">Learn how to use the useCapsulexAuth hook for seamless React integration.</p>
              <a href="/docs/react-sdk" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
                View React Docs
              </a>
            </Card>
            <Card className="p-6 bg-card border-border/50 hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">REST API</h3>
              <p className="text-muted-foreground text-sm mb-6">Integrate Capsulex directly using our REST endpoints and Bearer tokens.</p>
              <a href="/docs/api" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
                View API Docs
              </a>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
