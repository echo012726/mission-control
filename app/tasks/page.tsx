export default function TasksPage(){
  return (
    <div>
      <h2 className="text-xl font-bold">Tasks Board</h2>
      <p className="mt-2 text-sm text-muted-foreground">Kanban-style board for tasks (MVP: columns with items)</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="p-2 border rounded">
          <h3 className="font-semibold">To Do</h3>
          <div className="mt-2 p-2 bg-white rounded">Example task: Write spec</div>
        </div>
        <div className="p-2 border rounded">
          <h3 className="font-semibold">In Progress</h3>
        </div>
        <div className="p-2 border rounded">
          <h3 className="font-semibold">Done</h3>
        </div>
        <div className="p-2 border rounded">
          <h3 className="font-semibold">Blocked</h3>
        </div>
      </div>
    </div>
  )
}
