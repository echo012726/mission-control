export default function TeamPage(){
  return (
    <div>
      <h2 className="text-xl font-bold">Team</h2>
      <p className="mt-2 text-sm text-muted-foreground">View subagents and roles</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">Marcus (You)</div>
        <div className="p-4 border rounded">Echo (Main)</div>
        <div className="p-4 border rounded">PolyBot (Trading)</div>
      </div>
    </div>
  )
}
