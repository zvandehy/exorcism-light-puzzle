import { LightPuzzle } from "@/components/light-puzzle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Light Rotation Puzzle</h1>
      <LightPuzzle />
    </main>
  )
}