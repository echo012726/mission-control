export default function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome to Mission Control</h2>
      <p className="mt-4 text-muted-foreground">Overview of your OpenClaw's activity and quick links to tools.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 border rounded-md">Tasks Board<br/>Quick status</div>
        <div className="p-4 border rounded-md">Content Pipeline<br/>Recent items</div>
        <div className="p-4 border rounded-md">Calendar<br/>Upcoming</div>
      </div>
    </div>
  )
}
