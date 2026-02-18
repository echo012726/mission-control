export default function ContentPage(){
  return (
    <div>
      <h2 className="text-xl font-bold">Content Pipeline</h2>
      <p className="mt-2 text-sm text-muted-foreground">Stages: Idea → Scripting → Thumbnail → Filming → Editing → Published</p>

      <div className="mt-6 grid grid-cols-6 gap-4">
        <div className="p-2 border rounded">Idea</div>
        <div className="p-2 border rounded">Scripting</div>
        <div className="p-2 border rounded">Thumbnail</div>
        <div className="p-2 border rounded">Filming</div>
        <div className="p-2 border rounded">Editing</div>
        <div className="p-2 border rounded">Published</div>
      </div>
    </div>
  )
}
