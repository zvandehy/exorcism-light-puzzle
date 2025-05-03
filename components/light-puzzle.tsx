"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight, Lightbulb, Pause, Play, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

// Define the State class similar to the Python implementation
class PuzzleState {
  data: number[]

  static chains = [
    [0, 1, 4, 7, 6, 2],
    [5, 2, 3, 7, 10, 9],
    [3, 4, 8, 11, 10, 6],
  ]

  static solved = [0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0]

  constructor(data: number[]) {
    this.data = [...data]
  }

  static newRandomState(): PuzzleState {
    // Create a random state with 6 lights on and 6 lights off
    const data = Array(12).fill(0)
    const indices = Array.from({ length: 12 }, (_, i) => i)

    // Shuffle the indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }

    // Set the first 6 indices to 1
    for (let i = 0; i < 6; i++) {
      data[indices[i]] = 1
    }

    return new PuzzleState(data)
  }

  rotate(chainIndex: number): PuzzleState {
    const chain = PuzzleState.chains[chainIndex]
    const reversed = [...chain].reverse()
    const newData = [...this.data]

    // Rotate the elements in the chain
    for (let i = 0; i < reversed.length - 1; i++) {
      newData[reversed[i]] = this.data[reversed[i + 1]]
    }
    newData[reversed[reversed.length - 1]] = this.data[reversed[0]]

    return new PuzzleState(newData)
  }

  neighbors(): PuzzleState[] {
    // Return all the neighbors of the current state
    const neighbors = []
    for (let i = 0; i < 3; i++) {
      neighbors.push(this.rotate(i))
    }
    return neighbors
  }

  isSolved(): boolean {
    return this.data.every((val, idx) => val === PuzzleState.solved[idx])
  }

  equals(other: PuzzleState): boolean {
    return this.data.every((val, idx) => val === other.data[idx])
  }

  hash(): string {
    return this.data.join("")
  }
}

// BFS algorithm to find the solution
function bfsSolve(startState: PuzzleState): number[] | null {
  const queue: PuzzleState[] = [startState]
  const visited = new Set<string>([startState.hash()])
  const parent = new Map<string, string | null>()
  const move = new Map<string, number | null>()

  parent.set(startState.hash(), null)
  move.set(startState.hash(), null)

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current.isSolved()) {
      // Reconstruct path
      const path: number[] = []
      let node = current.hash()

      while (parent.get(node) !== null) {
        path.push(move.get(node) as number)
        node = parent.get(node) as string
      }

      return path.reverse() // reverse to get moves from start to goal
    }

    const neighbors = current.neighbors()
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i]
      const neighborHash = neighbor.hash()

      if (!visited.has(neighborHash)) {
        visited.add(neighborHash)
        parent.set(neighborHash, current.hash())
        move.set(neighborHash, i)
        queue.push(neighbor)
      }
    }
  }

  return null
}

export function LightPuzzle() {
    const [state, setState] = useState(PuzzleState.newRandomState())
    const [solution, setSolution] = useState<number[] | null>(null)
    const [showSolution, setShowSolution] = useState(false)
    const [step, setStep] = useState(-1)
    const [auto, setAuto] = useState(false)
    const [moves, setMoves] = useState(0)
  
    useEffect(() => {
      setSolution(bfsSolve(state))
      setStep(-1)
    }, [state])
  
    useEffect(() => {
      if (!auto || !solution || step >= solution.length - 1) return
      const t = setTimeout(() => {
        const next = step + 1
        rotate(solution[next])
        setStep(next)
        if (next >= solution.length - 1) setAuto(false)
      }, 800)
      return () => clearTimeout(t)
    }, [auto, step, solution])
  
    const rotate = (i: number) => {
      setState(s => s.rotate(i))
      setMoves(m => m + 1)
    }
    const reset = () => {
      setState(PuzzleState.newRandomState())
      setShowSolution(false)
      setStep(-1)
      setAuto(false)
      setMoves(0)
    }

    const getChainName = (chainIndex: number): string => {
        switch (chainIndex) {
          case 0:
            return "Top"
          case 1:
            return "Bottom Left"
          case 2:
            return "Bottom Right"
          default:
            return "Unknown"
        }
      }

    const vals = state.data as (0 | 1)[]
    console.log(vals)

    const [x, setX] = useState(false)
    useEffect(() => {setX(true)}, [])
    if (!x) return null
  
    return (
      <div className="relative p-6 bg-gray-50 rounded-xl shadow-lg max-w-sm mx-auto">
        {state.isSolved() && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
    <div
      className={cn(
        "bg-green-600 text-white font-bold uppercase text-lg shadow-lg",
        "w-full text-center py-2 transform -rotate-45 origin-center"
      )}
    >
      Puzzle Solved!
    </div>
  </div>
)}
        <div className="flex justify-between items-center mb-4 relative">
          <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> New Puzzle
          </Button>
          <div className="font-medium text-sm">Moves: {moves}</div>
        </div>
  
        <div className="flex flex-col items-center gap-4">
        {/* top chain */}
        <ChainButton chainIndex={0} onRotate={rotate} />

        {/* row of 2 */}
        <div className="flex gap-6 mb-2">
          <Light on={vals[0]} />
          <Light on={vals[1]} />
        </div>

        {/* row of 3 */}
        <div className="flex gap-6 mb-2">
          <Light on={vals[2]} />
          <Light on={vals[3]} />
          <Light on={vals[4]} />
        </div>

        {/* row of 4 */}
        <div className="flex gap-6 mb-2">
          <Light on={vals[5]} />
          <Light on={vals[6]} />
          <Light on={vals[7]} />
          <Light on={vals[8]} />
        </div>

        {/* bottom row of 3 with side chains */}
        <div className="flex items-center gap-6 mb-4">
          <ChainButton chainIndex={1} onRotate={rotate} />
          <div className="flex gap-6">
            <Light on={vals[9]} />
            <Light on={vals[10]} />
            <Light on={vals[11]} />
          </div>
          <ChainButton chainIndex={2} onRotate={rotate} />
        </div>
      </div>

  
        {/* solution controls */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="outline" size="sm" onClick={() => { setShowSolution(s => !s); setAuto(false); setStep(-1) }}>
              {showSolution ? "Hide" : "Show"} Solution
            </Button>
            {showSolution && solution && (
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={() => setAuto(a => !a)}>
                  {auto ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="outline" onClick={() => step < (solution.length - 1) && setStep(s => { const n = s + 1; rotate(solution[n]); return n })} disabled={step >= solution.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {showSolution && solution && (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm font-medium mb-2">Solution: {solution.length} moves</p>
            <div className="flex flex-wrap gap-2">
              {solution.map((move, index) => (
                <div
                  key={index}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md border bg-gray-200 border-gray-400"
                  )}
                >
                  {index + 1}. {getChainName(move)}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    )
  }

// 1) Extract a stable Light component
function Light({ on }: { on: 0 | 1 }) {
    return (
      <div
        className={cn(
          "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300",
          on
            ? "bg-green-500"
            : "bg-red-500"
        )}
      >
        <Lightbulb className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
      </div>
    )
  }
  
  // 2) Extract the chain‐rotate button
  function ChainButton({
    chainIndex,
    onRotate,
  }: {
    chainIndex: number
    onRotate: (i: number) => void
  }) {
    return (
      <Button
        onClick={() => onRotate(chainIndex)}
        className="bg-white border border-gray-100 shadow-md shadow-gray-500 hover:bg-gray-100 text-black w-8 h-8 sm:w-12 sm:h-12 rounded-full"
      />
    )
  }

  