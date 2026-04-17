"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { CategoryStep } from "@/components/onboarding/category-step"
import { ScheduleStep } from "@/components/onboarding/schedule-step"
import { ChannelStep } from "@/components/onboarding/channel-step"
import { ProgressIndicator } from "@/components/onboarding/progress-indicator"
import { CompletionStep } from "@/components/onboarding/completion-step"

export type OnboardingData = {
  name: string
  email: string
  categories: string[]
  schedule: string
  customTime: string
  channels: string[]
  slackWebhook: string
}

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    name: "",
    email: "",
    categories: [],
    schedule: "",
    customTime: "08:00",
    channels: ["web"],
    slackWebhook: "",
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS + 1) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
          />
        )
      case 2:
        return (
          <CategoryStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 3:
        return (
          <ScheduleStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 4:
        return (
          <ChannelStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 5:
        return <CompletionStep data={data} />
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {currentStep <= TOTAL_STEPS && (
          <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        )}
        
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
