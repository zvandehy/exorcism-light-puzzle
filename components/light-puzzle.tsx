"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCw, Lightbulb, RefreshCw, ChevronRight, ChevronLeft, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [state, setState] = useState<PuzzleState>(PuzzleState.newRandomState())
  const [solution, setSolution] = useState<number[] | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [currentSolutionStep, setCurrentSolutionStep] = useState(-1)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [moveCount, setMoveCount] = useState(0)

  // Calculate solution when state changes
  useEffect(() => {
    const newSolution = bfsSolve(state)
    setSolution(newSolution)
    setCurrentSolutionStep(-1)
  }, [state])

  // Auto-play solution
  useEffect(() => {
    if (!isAutoPlaying || !solution || currentSolutionStep >= solution.length - 1) {
      return
    }

    const timer = setTimeout(() => {
      const nextStep = currentSolutionStep + 1
      handleRotate(solution[nextStep])
      setCurrentSolutionStep(nextStep)

      if (nextStep >= solution.length - 1) {
        setIsAutoPlaying(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [isAutoPlaying, currentSolutionStep, solution])

  // Handle rotation
  const handleRotate = (chainIndex: number) => {
    setState(state.rotate(chainIndex))
    setMoveCount(moveCount + 1)
  }

  // Reset the puzzle
  const handleReset = () => {
    setState(PuzzleState.newRandomState())
    setShowSolution(false)
    setCurrentSolutionStep(-1)
    setIsAutoPlaying(false)
    setMoveCount(0)
  }

  // Toggle solution visibility
  const toggleSolution = () => {
    setShowSolution(!showSolution)
    setCurrentSolutionStep(-1)
    setIsAutoPlaying(false)
  }

  // Start auto-playing the solution
  const startAutoPlay = () => {
    if (solution && solution.length > 0) {
      setShowSolution(true)
      setCurrentSolutionStep(-1)
      setIsAutoPlaying(true)
    }
  }

  // Step through solution manually
  const stepSolution = (direction: "next" | "prev") => {
    if (!solution || solution.length === 0) return

    if (direction === "next" && currentSolutionStep < solution.length - 1) {
      const nextStep = currentSolutionStep + 1
      handleRotate(solution[nextStep])
      setCurrentSolutionStep(nextStep)
    } else if (direction === "prev" && currentSolutionStep > -1) {
      // This is a bit tricky since we need to reconstruct the state
      // We'll reset and replay up to the previous step
      const targetStep = currentSolutionStep - 1

      // Create a new state from the initial state
      let newState = new PuzzleState([...state.data])
      for (let i = 0; i <= targetStep; i++) {
        newState = newState.rotate(solution[i])
      }

      setState(newState)
      setCurrentSolutionStep(targetStep)
    }
  }

  // Get the chain name for display
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

  // Render the lights in the specified pattern
  const renderLights = () => {
    // Positions of lights in rows of length 2, 3, 4, 3
    const lightPositions = [
      [2, 4], // Row 1 (2 lights)
      [1, 3, 5], // Row 2 (3 lights)
      [0, 2, 4, 6], // Row 3 (4 lights)
      [1, 3, 5], // Row 4 (3 lights)
    ]

    let lightIndex = 0

    return (
      <div className="flex flex-col items-center gap-x-3 gap-y-6 mb-6">
      <div className="flex gap-x-3 gap-y-6 my-4">
        <div className="w-12 h-12" />
        <div className="w-12 h-12" />
        <div className="w-12 h-12" />
        <Button onClick={() => handleRotate(0)} className="bg-white border border-gray-100 shadow-md shadow-gray-500 hover:bg-gray-100 text-black w-12 h-12 rounded-full">
          </Button>
        <div className="w-12 h-12" />
        <div className="w-12 h-12" />
        <div className="w-12 h-12" />
      </div>
        {lightPositions.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-x-3 gap-y-6 my-4">
          {rowIndex === lightPositions.length-1 && <Button onClick={() => handleRotate(1)} className="bg-white border border-gray-100 shadow-md shadow-gray-500 hover:bg-gray-100 text-black w-12 h-12 rounded-full">
          </Button>}
            {Array.from({ length: 7 }).map((_, colIndex) => {
              if (row.includes(colIndex)) {
                const currentLightIndex = lightIndex
                lightIndex++

                // Check if this light is part of any chain
                const chainIndices = []
                for (let i = 0; i < PuzzleState.chains.length; i++) {
                  if (PuzzleState.chains[i].includes(currentLightIndex)) {
                    chainIndices.push(i)
                  }
                }

                return (
                  <div
                    key={colIndex}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      state.data[currentLightIndex] === 1
                        ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                        : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]",
                    )}
                  >
                    <Lightbulb
                      className={cn(
                        "w-6 h-6 transition-colors",
                        state.data[currentLightIndex] === 1 ? "text-white" : "text-white",
                      )}
                    />
                  </div>
                )
              } else {
                return <div key={colIndex} className="w-12 h-12" />
              }
            })}
            {rowIndex === lightPositions.length-1 && 
            <Button onClick={() => handleRotate(2)} className="bg-white border border-gray-100 shadow-md shadow-gray-500 hover:bg-gray-100 text-black w-12 h-12 rounded-full">
          </Button>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-xl max-w-xl shadow-lg w-full bg-gray-50 relative">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            New Puzzle
          </Button>
        </div>
        <div className="text-sm font-medium">Moves: {moveCount}</div>
      </div>

      {state.isSolved() && (
          <div className="w-full"><div className="p-4 bg-green-200/80 text-green-800 rounded-md text-center">🎉 Puzzle Solved! 🎉</div></div>
        )}
      {renderLights()}

      <div className="w-full border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={toggleSolution} className="flex items-center gap-1">
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>

          {showSolution && solution && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => stepSolution("prev")}
                disabled={currentSolutionStep <= -1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isAutoPlaying) {
                    setIsAutoPlaying(false)
                  } else {
                    startAutoPlay()
                  }
                }}
              >
                {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => stepSolution("next")}
                disabled={currentSolutionStep >= solution.length - 1}
              >
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
                    "text-xs px-2 py-1 rounded-md border",
                    currentSolutionStep === index ? "bg-gray-200 border-gray-400" : "bg-white border-gray-200",
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