"use client"

import { useRouter } from "next/navigation"
import { ProgressProvider } from "./data-entry/page"
import {
  Calendar,
  FileText,
  GraduationCap,
  BarChart3,
  ClipboardList,
  CheckSquare,
  BookOpen,
  Send,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader'

const cards = [
  {
    title: "Graduation Roadmap Check",
    tag: "Data Entry & Audit",
    description: "Enter your full course history, categorize electives, and generate a detailed progress audit report.",
    href: '/student/management/data-entry',
    gradient: "from-orange-400 via-rose-400 to-red-500",
    previewBg: "bg-gradient-to-br from-orange-500/90 to-rose-600/90",
    chipColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    iconColor: "text-orange-500",
    mockIcons: [
      { Icon: ClipboardList, x: "left-4 top-4", size: 28, opacity: "opacity-90", bg: "bg-white/15" },
      { Icon: BarChart3,     x: "right-5 top-7", size: 22, opacity: "opacity-70", bg: "bg-white/10" },
      { Icon: FileText,      x: "left-10 bottom-5", size: 20, opacity: "opacity-60", bg: "bg-white/10" },
    ],
    mockRows: [
      { w: "w-24", c: "bg-white/70" },
      { w: "w-16", c: "bg-white/50" },
      { w: "w-20", c: "bg-white/40" },
    ]
  },
  {
    title: "Semester Courses",
    tag: "Schedule & Planning",
    description: "Browse courses offered this semester, view time slots, and plan your academic schedule with ease.",
    href: '/student/SemesterCourse',
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    previewBg: "bg-gradient-to-br from-violet-500/90 to-indigo-600/90",
    chipColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    iconColor: "text-violet-500",
    mockIcons: [
      { Icon: Calendar,   x: "left-4 top-4",    size: 28, opacity: "opacity-90", bg: "bg-white/15" },
      { Icon: BookOpen,   x: "right-5 top-7",   size: 22, opacity: "opacity-70", bg: "bg-white/10" },
      { Icon: CheckSquare,x: "left-10 bottom-5",size: 20, opacity: "opacity-60", bg: "bg-white/10" },
    ],
    mockRows: [
      { w: "w-20", c: "bg-white/70" },
      { w: "w-28", c: "bg-white/50" },
      { w: "w-14", c: "bg-white/40" },
    ]
  },
  {
    title: "Graduation Portal",
    tag: "Submission & Review",
    description: "Submit your official graduation roadmap to the department chair and track approval status.",
    href: '/student/GraduationPortal',
    gradient: "from-teal-400 via-cyan-500 to-emerald-500",
    previewBg: "bg-gradient-to-br from-teal-500/90 to-emerald-500/90",
    chipColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    iconColor: "text-teal-500",
    mockIcons: [
      { Icon: GraduationCap, x: "left-4 top-4",    size: 28, opacity: "opacity-90", bg: "bg-white/15" },
      { Icon: Send,          x: "right-5 top-7",   size: 22, opacity: "opacity-70", bg: "bg-white/10" },
      { Icon: TrendingUp,    x: "left-10 bottom-5",size: 20, opacity: "opacity-60", bg: "bg-white/10" },
    ],
    mockRows: [
      { w: "w-28", c: "bg-white/70" },
      { w: "w-16", c: "bg-white/50" },
      { w: "w-22", c: "bg-white/40" },
    ]
  },
]

export default function ManagementPage() {
  const router = useRouter()

  return (
    <ProgressProvider>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <PageHeader
          title="Student Course Management"
          description="Manage your academic journey and track your progress"
        />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground/80 tracking-tight">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                className="group text-left rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {/* Visual preview panel */}
                <div className={`relative h-44 ${card.previewBg} overflow-hidden`}>
                  {/* Background gradient shimmer */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-80`} />

                  {/* Decorative dot grid */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  />

                  {/* Floating icon chips */}
                  {card.mockIcons.map(({ Icon, x, size, opacity, bg }, i) => (
                    <div
                      key={i}
                      className={`absolute ${x} ${opacity} ${bg} rounded-xl p-2 backdrop-blur-sm`}
                    >
                      <Icon size={size} className="text-white" />
                    </div>
                  ))}

                  {/* Mock mini-card overlay */}
                  <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 space-y-1.5 min-w-[90px]">
                    {card.mockRows.map((row, i) => (
                      <div key={i} className={`h-2 ${row.w} ${row.c} rounded-full`} />
                    ))}
                  </div>
                </div>

                {/* Text area */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{card.title}</h3>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform mt-0.5"
                    />
                  </div>
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${card.chipColor}`}>
                    {card.tag}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{card.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ProgressProvider>
  )
} 