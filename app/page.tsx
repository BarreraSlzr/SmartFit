"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initDB, saveWorkoutData, getWorkoutData, saveFeedback, getFeedback } from "@/lib/db"
import { Download, Upload, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function ExerciseTracker() {
  const [workoutData, setWorkoutData] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>({})
  const [activeDay, setActiveDay] = useState<string>("Day 1")
  const { toast } = useToast()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 100
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrolled])

  useEffect(() => {
    const initialize = async () => {
      await initDB()
      const storedWorkout = await getWorkoutData()
      if (storedWorkout) {
        setWorkoutData(storedWorkout)
      }

      const storedFeedback = await getFeedback()
      if (storedFeedback) {
        setFeedback(storedFeedback)
      }
    }

    initialize()
  }, [])

  const handleImport = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const jsonData = JSON.parse(event.target?.result as string)
            await saveWorkoutData(jsonData)
            setWorkoutData(jsonData)
            toast({
              title: "Data imported successfully",
              description: "Your workout routine has been loaded",
            })
          } catch (error) {
            toast({
              title: "Error importing data",
              description: "Please check your JSON file format",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
    }

    input.click()
  }

  const handleExport = () => {
    const exportData = {
      workout_routine: workoutData?.workout_routine,
      feedback: feedback,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `workout-feedback-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleFeedbackChange = (day: string, exerciseIndex: number, field: string, value: any) => {
    const feedbackKey = `${day}-${exerciseIndex}`

    setFeedback((prev: any) => {
      const exerciseFeedback = prev[feedbackKey] || {}

      return {
        ...prev,
        [feedbackKey]: {
          ...exerciseFeedback,
          [field]: value,
          timestamp: new Date().toISOString(),
        },
      }
    })
  }

  const saveFeedbackToDb = async () => {
    await saveFeedback(feedback)
    toast({
      title: "Feedback saved",
      description: "Your exercise feedback has been saved successfully",
    })
  }

  if (!workoutData) {
    return (
      <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Exercise Tracker</CardTitle>
            <CardDescription>Import your workout routine to get started</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button onClick={handleImport} className="w-full max-w-xs">
              <Upload className="mr-2 h-4 w-4" /> Import Workout Data
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              No data found. Please import your workout routine JSON file to begin.
            </p>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    )
  }

  const days = Object.keys(workoutData.workout_routine.weekly_split).filter((day) => day !== "Day 7 (optional)")

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exercise Tracker</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{workoutData.workout_routine.goal}</CardTitle>
          <CardDescription>
            {workoutData.workout_routine.frequency} · {workoutData.workout_routine.session_duration_minutes} minutes per
            session
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue={activeDay} onValueChange={setActiveDay}>
        <TabsList className="mb-4 tabs-list-container">
          {days.map((day) => (
            <TabsTrigger key={day} value={day} className="flex-grow">
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day} value={day}>
            <Card>
              <CardHeader>
                <CardTitle>{workoutData.workout_routine.weekly_split[day].focus}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workoutData.workout_routine.weekly_split[day].exercises.map((exercise: any, index: number) => {
                    const feedbackKey = `${day}-${index}`
                    const exerciseFeedback = feedback[feedbackKey] || {}

                    return (
                      <Card key={index} className="border border-muted">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{exercise.name}</CardTitle>
                          <CardDescription>
                            {exercise.sets} sets ×{" "}
                            {exercise.reps || exercise.duration_minutes || exercise.duration_seconds}
                            {exercise.reps ? " reps" : exercise.duration_minutes ? " minutes" : " seconds"}
                            {exercise.rest_seconds ? ` · ${exercise.rest_seconds}s rest` : ""}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm mb-4">{exercise.notes}</div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor={`weight-${day}-${index}`}>Weight (kg/lbs)</Label>
                              <Input
                                id={`weight-${day}-${index}`}
                                type="number"
                                placeholder="Enter weight"
                                value={exerciseFeedback.weight || ""}
                                onChange={(e) => handleFeedbackChange(day, index, "weight", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label htmlFor={`intensity-${day}-${index}`}>Intensity Level</Label>
                                <span className="text-sm">{exerciseFeedback.intensity || 5}</span>
                              </div>
                              <Slider
                                id={`intensity-${day}-${index}`}
                                min={1}
                                max={10}
                                step={1}
                                defaultValue={[exerciseFeedback.intensity || 5]}
                                onValueChange={(value) => handleFeedbackChange(day, index, "intensity", value[0])}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label htmlFor={`control-${day}-${index}`}>Control Level</Label>
                                <span className="text-sm">{exerciseFeedback.control || 5}</span>
                              </div>
                              <Slider
                                id={`control-${day}-${index}`}
                                min={1}
                                max={10}
                                step={1}
                                defaultValue={[exerciseFeedback.control || 5]}
                                onValueChange={(value) => handleFeedbackChange(day, index, "control", value[0])}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`notes-${day}-${index}`}>Your Notes</Label>
                              <Input
                                id={`notes-${day}-${index}`}
                                placeholder="Add your notes"
                                value={exerciseFeedback.notes || ""}
                                onChange={(e) => handleFeedbackChange(day, index, "notes", e.target.value)}
                              />
                            </div>
                          </div>

                          {exerciseFeedback.timestamp && (
                            <div className="mt-4 text-xs text-muted-foreground">
                              Last updated: {new Date(exerciseFeedback.timestamp).toLocaleString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={saveFeedbackToDb}
          size={scrolled ? "icon" : "default"}
          className="shadow-lg transition-all duration-300 sticky-button"
        >
          <Save className={`h-4 w-4 ${scrolled ? "" : "mr-2"}`} />
          {!scrolled && "Save Feedback"}
        </Button>
      </div>
      <Toaster />
    </div>
  )
}
