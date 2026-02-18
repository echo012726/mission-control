export default function MemoryPage(){
  return (
    <div>
      <h2 className="text-xl font-bold">Memory Browser</h2>
      <p className="mt-2 text-sm text-muted-foreground">Search and browse saved memories</p>

      <div className="mt-6 grid gap-4">
        <div className="p-4 border rounded">Memory: PolyMarket Bot Setup</div>
        <div className="p-4 border rounded">Memory: Marcus Preferences</div>
      </div>
    </div>
  )
}
