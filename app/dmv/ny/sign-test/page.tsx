'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import questionsData from '@/data/openaa-ny-dmv-questions-v1.json'

interface Question {
  id: string | number
  category: string
  question: string
  image: string | null
  options: string[]
  answerIndex: number
  answerText: string
  explanation: string
  reference: string
  difficulty: string
  tags: string[]
}

type QuestionBank = {
  _meta?: {
    totalQuestions?: number
  }
  questions: Question[]
}

const questionBank = questionsData as QuestionBank
const allQuestions = questionBank.questions

const WRONG_QUESTIONS_KEY = 'openaa_dmv_wrong_question_ids'

function saveWrongQuestion(id: string) {
  try {
    const stored = localStorage.getItem(WRONG_QUESTIONS_KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    if (!ids.includes(id)) {
      ids.push(id)
      localStorage.setItem(WRONG_QUESTIONS_KEY, JSON.stringify(ids))
    }
  } catch {}
}

function removeWrongQuestion(id: string) {
  try {
    const stored = localStorage.getItem(WRONG_QUESTIONS_KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    const updated = ids.filter((x) => x !== id)
    localStorage.setItem(WRONG_QUESTIONS_KEY, JSON.stringify(updated))
  } catch {}
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SIGN_CATEGORIES = new Set(['交通标志', 'traffic-signs', 'road-signs-general'])
const signQuestions = allQuestions.filter((q) => SIGN_CATEGORIES.has(q.category))

export default function SignTestPage() {
  const [questions, setQuestions] = useState<Question[]>(() => shuffle(signQuestions))
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })

  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100

  const handleSelect = useCallback(
    (i: number) => {
      if (answered) return
      setSelected(i)
      setAnswered(true)
      if (i === q.answerIndex) {
        setScore((s) => ({ ...s, correct: s.correct + 1 }))
        removeWrongQuestion(String(q.id))
      } else {
        setScore((s) => ({ ...s, wrong: s.wrong + 1 }))
        saveWrongQuestion(String(q.id))
      }
    },
    [answered, q],
  )

  const handleNext = useCallback(() => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }, [current, questions.length])

  const handleRestart = useCallback(() => {
    setQuestions(shuffle(signQuestions))
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setScore({ correct: 0, wrong: 0 })
  }, [])

  const isCorrect = answered && selected === q.answerIndex

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Progress */}
      <div className="sticky top-14 z-40 bg-white shadow-sm">
        <div className="flex h-1.5 w-full bg-zinc-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <Link
            href="/dmv"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-sm font-semibold text-zinc-700">
            {current + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600 font-medium">✓ {score.correct}</span>
            <span className="text-red-400 font-medium">✗ {score.wrong}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-3 text-center">
          <h1 className="text-base font-bold text-zinc-900">交通标志专项练习</h1>
          <p className="text-xs text-zinc-500 mt-0.5">纽约州常见交通标志 · 随机排列</p>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 font-medium">
              第 {current + 1} 题
            </span>
            <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">
              交通标志
            </span>
          </div>

          <p className="mt-2 text-base font-semibold leading-relaxed text-zinc-900">
            {q.question}
          </p>

          {q.image && (
            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <img
                  src={q.image}
                  alt="交通标志"
                  className="h-48 w-48 object-contain"
                />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2.5">
            {q.options.map((opt, i) => {
              let cls =
                'w-full rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-colors active:scale-[0.98]'
              if (answered) {
                if (i === q.answerIndex) {
                  cls += ' border-green-200 bg-green-50 text-green-800'
                } else if (i === selected) {
                  cls += ' border-red-200 bg-red-50 text-red-700'
                } else {
                  cls += ' border-zinc-100 bg-zinc-50 text-zinc-400'
                }
              } else {
                cls +=
                  ' border-zinc-200 bg-white text-zinc-800 active:bg-blue-50 active:border-blue-200'
              }
              return (
                <button key={i} type="button" className={cls} onClick={() => handleSelect(i)}>
                  {opt}
                </button>
              )
            })}
          </div>

          {answered && (
            <div
              className={`mt-3 rounded-xl border px-3 py-2 ${isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}
            >
              {isCorrect ? (
                <>
                  <p className="text-xs font-semibold text-green-700">✓ 回答正确！</p>
                  {q.explanation && (
                    <p className="mt-1 text-xs text-green-700 leading-relaxed">{q.explanation}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-red-600">✗ 回答错误</p>
                  <p className="mt-0.5 text-xs text-red-700">正确答案：{q.answerText}</p>
                  {q.explanation && (
                    <p className="mt-1 text-xs text-red-700 leading-relaxed">{q.explanation}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-4 flex gap-3">
          {answered && current < questions.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
            >
              下一题
              <ArrowRight size={16} />
            </button>
          )}
          {answered && current >= questions.length - 1 && (
            <div className="flex-1 space-y-3">
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
                <p className="text-lg font-black text-green-800">🎉 已完成全部标志题！</p>
                <p className="mt-1 text-sm text-green-700">
                  正确 {score.correct} / {questions.length}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestart}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white"
              >
                <RotateCcw size={16} />
                重新练习（随机排列）
              </button>
              <Link
                href="/dmv/ny/mock-test"
                className="block rounded-2xl border border-blue-200 py-3.5 text-center text-sm font-bold text-blue-700"
              >
                去模拟考试
              </Link>
            </div>
          )}
          {!answered && (
            <button
              type="button"
              onClick={handleRestart}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
