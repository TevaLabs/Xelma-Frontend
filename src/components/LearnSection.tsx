"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"

interface Lesson {
  id: string
  title: string
  description: string
}

const lessons: Lesson[] = [
  {
    id: "lesson-1",
    title: "Lesson 1",
    description:
      "Welcome to your crypto journey! In this lesson, you'll learn the basics of blockchain technology.",
  },
  {
    id: "lesson-2",
    title: "Lesson 2",
    description:
      "Did you know that the first real-world transaction using Bitcoin was for two pizzas? In May 2010, a programmer named Laszlo Hanyecz paid 10,000 Bitcoins for two pizzas, which would be worth millions today!",
  },
  {
    id: "lesson-3",
    title: "Lesson 3",
    description:
      "Did you know that the first real-world transaction using Bitcoin was for two pizzas? In May 2010, a programmer named Laszlo Hanyecz paid 10,000 Bitcoins for two pizzas, which would be worth millions today!",
  },
  {
    id: "lesson-4",
    title: "Lesson 4",
    description:
      "Did you know that the first real-world transaction using Bitcoin was for two pizzas?",
  },
]

export function LearnSection() {
  const [openLesson, setOpenLesson] = useState<string | null>(null)

  return (
    <div className="flex flex-col w-full bg-white">
     
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563eb]">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h2
          className="text-gray-900"
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: "24px",
            lineHeight: "32px",
            letterSpacing: "-0.015em",
          }}
        >
          Learn
        </h2>
      </div>

      {/* Lessons Container */}
      <div
        className="bg-[#F9FAFB] border-t border-gray-100 overflow-y-auto"
        style={{
          width: "400px",
          height: "300px",
          borderRadius: "11px",
          padding: "21px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {lessons.map((lesson) => (
          <div key={lesson.id} className="flex flex-col">
            <button
              onClick={() =>
                setOpenLesson(openLesson === lesson.id ? null : lesson.id)
              }
              className="text-left text-gray-900 focus:outline-none hover:text-blue-600"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600,
                fontSize: "20px",
                background: "transparent",
                padding: 0,
                border: "none",
              }}
            >
              {lesson.title}
            </button>

            {openLesson === lesson.id && (
              <p className="mt-2 text-gray-600 text-[14px] leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
