'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent, AIAgentResponse } from '@/lib/aiAgent'
import { useLyzrAgentEvents } from '@/lib/lyzrAgentEvents'
import { AgentActivityPanel } from '@/components/AgentActivityPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  RiDashboardLine, RiBarChartLine, RiFileTextLine, RiTeamLine, RiSettingsLine,
  RiUserLine, RiMoneyDollarCircleLine, RiFlashlightLine, RiPercentLine,
  RiSearchLine, RiNotification3Line, RiAddLine, RiLineChartLine, RiGroupLine,
  RiArrowUpLine, RiArrowDownLine, RiSendPlane2Fill, RiMenuLine,
  RiCloseLine, RiRobot2Line, RiArrowRightSLine,
  RiErrorWarningLine, RiFeedbackLine, RiCheckLine, RiLoader4Line
} from 'react-icons/ri'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const AGENT_ID = '699421e064ccde78b22a74e4'

interface AgentResponseData {
  response?: string
  text?: string
  message?: string
  insights?: string[]
  recommendation?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  insights?: string[]
  recommendation?: string
}

const CHART_DATA_7D = [
  { name: 'Mon', revenue: 4200 },
  { name: 'Tue', revenue: 5100 },
  { name: 'Wed', revenue: 4800 },
  { name: 'Thu', revenue: 6200 },
  { name: 'Fri', revenue: 5900 },
  { name: 'Sat', revenue: 7100 },
  { name: 'Sun', revenue: 6800 },
]

const CHART_DATA_30D = [
  { name: 'Week 1', revenue: 28400 },
  { name: 'Week 2', revenue: 31200 },
  { name: 'Week 3', revenue: 29800 },
  { name: 'Week 4', revenue: 35600 },
]

const CHART_DATA_90D = [
  { name: 'Jan', revenue: 98000 },
  { name: 'Feb', revenue: 112000 },
  { name: 'Mar', revenue: 125000 },
  { name: 'Apr', revenue: 118000 },
  { name: 'May', revenue: 132000 },
  { name: 'Jun', revenue: 145000 },
  { name: 'Jul', revenue: 148000 },
]

const SAMPLE_ACTIVITIES = [
  { id: 1, text: 'Sarah Johnson updated the quarterly report', time: '2 hours ago', color: 'hsl(40, 30%, 45%)' },
  { id: 2, text: 'New user registration: Alex Chen', time: '4 hours ago', color: 'hsl(200, 15%, 45%)' },
  { id: 3, text: 'Revenue milestone reached: $45,000', time: 'Yesterday', color: 'hsl(30, 20%, 35%)' },
  { id: 4, text: 'Team meeting notes shared', time: 'Yesterday', color: 'hsl(0, 0%, 60%)' },
  { id: 5, text: 'System maintenance completed', time: '2 days ago', color: 'hsl(30, 10%, 70%)' },
]

const SAMPLE_METRICS = {
  users: { value: '24,521', trend: '+12.5%', up: true },
  revenue: { value: '$48,290', trend: '+8.2%', up: true },
  sessions: { value: '1,429', trend: '+5.4%', up: true },
  conversion: { value: '3.24%', trend: '-0.8%', up: false },
}

const NAV_ITEMS = [
  { icon: RiDashboardLine, label: 'Dashboard', active: true },
  { icon: RiBarChartLine, label: 'Analytics', active: false },
  { icon: RiFileTextLine, label: 'Reports', active: false },
  { icon: RiTeamLine, label: 'Team', active: false },
  { icon: RiSettingsLine, label: 'Settings', active: false },
]

const QUICK_ACTIONS = [
  { icon: RiAddLine, label: 'Create Report' },
  { icon: RiLineChartLine, label: 'View Analytics' },
  { icon: RiGroupLine, label: 'Manage Team' },
  { icon: RiSettingsLine, label: 'Settings' },
]

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-medium text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-medium text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-medium text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-medium">{part}</strong> : part
  )
}

function MetricCard({ icon: Icon, label, value, trend, up, showSample }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend: string
  up: boolean
  showSample: boolean
}) {
  return (
    <Card className="rounded-none border border-border shadow-sm transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-xs font-normal tracking-[0.1em] uppercase text-muted-foreground">{label}</p>
            <p className="text-2xl font-light tracking-tight text-foreground">{showSample ? value : '--'}</p>
          </div>
          <div className="p-2 bg-secondary rounded-none">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {showSample && (
          <div className="mt-4 flex items-center gap-1">
            {up ? (
              <RiArrowUpLine className="h-3.5 w-3.5 text-green-700" />
            ) : (
              <RiArrowDownLine className="h-3.5 w-3.5 text-red-700" />
            )}
            <span className={`text-xs font-normal ${up ? 'text-green-700' : 'text-red-700'}`}>{trend}</span>
            <span className="text-xs text-muted-foreground ml-1">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Sidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)
  const isOpen = expanded || hovered

  return (
    <div
      className="fixed left-0 top-0 h-full z-40 bg-card border-r border-border transition-all duration-300 flex flex-col"
      style={{ width: isOpen ? '200px' : '64px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        {isOpen ? (
          <span className="font-serif text-lg font-medium tracking-[0.15em] text-foreground">LUXE</span>
        ) : (
          <span className="font-serif text-lg font-medium text-foreground">L</span>
        )}
      </div>
      <nav className="flex-1 py-6 space-y-1 px-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-3 transition-all duration-200 rounded-none text-sm ${item.active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="font-light tracking-[0.05em] whitespace-nowrap">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

function TopHeader({ onToggleSidebar, onToggleAssistant, showSample, onToggleSample }: {
  onToggleSidebar: () => void
  onToggleAssistant: () => void
  showSample: boolean
  onToggleSample: (v: boolean) => void
}) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-muted-foreground hover:text-foreground transition-colors">
          <RiMenuLine className="h-5 w-5" />
        </button>
        <span className="font-serif text-base font-medium tracking-[0.15em] text-foreground hidden md:inline">DASHBOARD</span>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 h-9 rounded-none bg-secondary border-border text-sm font-light"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle" className="text-xs font-light tracking-[0.05em] text-muted-foreground">Sample Data</Label>
          <Switch id="sample-toggle" checked={showSample} onCheckedChange={onToggleSample} />
        </div>

        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <RiNotification3Line className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-normal flex items-center justify-center rounded-full">3</span>
        </button>

        <div className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center text-xs font-normal rounded-full">
          JD
        </div>

        <button onClick={onToggleAssistant} className="text-muted-foreground hover:text-foreground transition-colors" title="AI Assistant">
          <RiRobot2Line className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

function RevenueChart({ showSample }: { showSample: boolean }) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d')

  const chartDataMap = { '7d': CHART_DATA_7D, '30d': CHART_DATA_30D, '90d': CHART_DATA_90D }
  const currentData = showSample ? chartDataMap[range] : []

  return (
    <Card className="rounded-none border border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base font-medium tracking-[0.08em]">Revenue Trends</CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <Button
                key={r}
                variant={range === r ? 'default' : 'outline'}
                size="sm"
                className="rounded-none text-xs font-light tracking-[0.05em] h-7 px-3"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {showSample ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 10%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(30, 5%, 50%)' }} axisLine={{ stroke: 'hsl(30, 10%, 88%)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(30, 5%, 50%)' }} axisLine={{ stroke: 'hsl(30, 10%, 88%)' }} tickLine={false} tickFormatter={(v) => range === '90d' ? `${(v / 1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip contentStyle={{ border: '1px solid hsl(30, 10%, 88%)', borderRadius: '0px', fontSize: '12px', backgroundColor: 'hsl(0, 0%, 100%)' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(40, 30%, 45%)" strokeWidth={2} dot={{ fill: 'hsl(40, 30%, 45%)', r: 3 }} activeDot={{ r: 5, fill: 'hsl(40, 40%, 50%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-light">
            Enable Sample Data to view chart
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityFeed({ showSample }: { showSample: boolean }) {
  return (
    <Card className="rounded-none border border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base font-medium tracking-[0.08em]">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {showSample ? (
          <ScrollArea className="h-64">
            <div className="space-y-0">
              {SAMPLE_ACTIVITIES.map((activity, idx) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-3 py-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: activity.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light leading-relaxed text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-light">{activity.time}</p>
                    </div>
                  </div>
                  {idx < SAMPLE_ACTIVITIES.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm font-light">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {QUICK_ACTIONS.map((action) => (
        <Card key={action.label} className="rounded-none border border-border shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/50 group">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-none transition-colors group-hover:bg-primary/10">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-light tracking-[0.05em] text-foreground">{action.label}</span>
            <RiArrowRightSLine className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AIAssistantPanel({ open, onClose, sessionId }: { open: boolean; onClose: () => void; sessionId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || loading) return

    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInputValue('')
    setLoading(true)
    setActiveAgentId(AGENT_ID)

    try {
      const result: AIAgentResponse = await callAIAgent(trimmed, AGENT_ID)

      if (result.success && result?.response?.result) {
        const agentData = result.response.result as AgentResponseData
        const responseText = agentData?.response || agentData?.text || agentData?.message || result?.response?.message || 'No response received.'
        const insights = Array.isArray(agentData?.insights) ? agentData.insights : []
        const recommendation = agentData?.recommendation || ''

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: typeof responseText === 'string' ? responseText : JSON.stringify(responseText),
          insights,
          recommendation,
        }])
      } else {
        const fallbackText = result?.response?.message || result?.error || 'Unable to get a response.'
        setMessages(prev => [...prev, { role: 'assistant', content: fallbackText }])
      }
    } catch (err) {
      setError('Failed to reach the assistant. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col shadow-lg">
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <div className="flex items-center gap-2">
          <RiRobot2Line className="h-5 w-5 text-primary" />
          <span className="font-serif text-sm font-medium tracking-[0.1em]">AI ASSISTANT</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <RiCloseLine className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12">
              <RiRobot2Line className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-light text-muted-foreground leading-relaxed">Ask a question about your data, metrics, or get actionable recommendations.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground px-4 py-3' : 'bg-secondary px-4 py-3'} rounded-none`}>
                <div className="text-sm font-light leading-relaxed">
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>

                {msg.role === 'assistant' && Array.isArray(msg.insights) && msg.insights.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-normal tracking-[0.08em] uppercase text-muted-foreground mb-2">Key Insights</p>
                    <ul className="space-y-1.5">
                      {msg.insights.map((insight, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2 text-xs font-light leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.role === 'assistant' && msg.recommendation && (
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/20">
                    <p className="text-xs font-normal tracking-[0.08em] uppercase text-primary mb-1">Recommendation</p>
                    <p className="text-xs font-light leading-relaxed">{msg.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary px-4 py-3 rounded-none">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <span className="text-xs font-light text-muted-foreground ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-none">
              <p className="text-xs font-light text-destructive">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about your data..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
            disabled={loading}
            className="rounded-none text-sm font-light"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !inputValue.trim()}
            className="rounded-none px-4"
            size="default"
          >
            <RiSendPlane2Fill className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-[10px] font-light tracking-[0.05em] text-muted-foreground">
            {activeAgentId ? 'Processing...' : 'Dashboard Assistant Agent'}
          </span>
        </div>
      </div>
    </div>
  )
}

function IssueFeedbackForm() {
  const [issueSummary, setIssueSummary] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [agentResponse, setAgentResponse] = useState<{
    response: string
    insights: string[]
    recommendation: string
  } | null>(null)

  const handleSubmit = async () => {
    if (!issueSummary.trim() && !feedback.trim()) return
    if (loading) return

    setLoading(true)
    setError(null)
    setAgentResponse(null)
    setSubmitted(false)

    const combinedMessage = `Issue Summary: ${issueSummary.trim()}\n\nFeedback: ${feedback.trim()}`

    try {
      const result: AIAgentResponse = await callAIAgent(combinedMessage, AGENT_ID)

      if (result.success && result?.response?.result) {
        const agentData = result.response.result as AgentResponseData
        const responseText = agentData?.response || agentData?.text || agentData?.message || result?.response?.message || 'Your submission has been processed.'
        const insights = Array.isArray(agentData?.insights) ? agentData.insights : []
        const recommendation = agentData?.recommendation || ''

        setAgentResponse({
          response: typeof responseText === 'string' ? responseText : JSON.stringify(responseText),
          insights,
          recommendation,
        })
        setSubmitted(true)
      } else {
        setError(result?.response?.message || result?.error || 'Failed to process submission.')
      }
    } catch (err) {
      setError('Failed to reach the assistant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setIssueSummary('')
    setFeedback('')
    setAgentResponse(null)
    setSubmitted(false)
    setError(null)
  }

  return (
    <Card className="rounded-none border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-none">
            <RiErrorWarningLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-serif text-base font-medium tracking-[0.08em]">
              Issue Summary & Feedback
            </CardTitle>
            <p className="text-xs font-light text-muted-foreground mt-1 tracking-[0.03em]">
              Submit an issue or provide feedback — AI will analyze and respond
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Issue Summary Field */}
        <div className="space-y-2">
          <Label htmlFor="issue-summary" className="text-xs font-normal tracking-[0.08em] uppercase text-muted-foreground">
            Issue Summary
          </Label>
          <Textarea
            id="issue-summary"
            placeholder="Describe the issue briefly..."
            value={issueSummary}
            onChange={(e) => setIssueSummary(e.target.value)}
            disabled={loading}
            className="rounded-none text-sm font-light min-h-[100px] resize-none leading-relaxed border-border focus:ring-primary"
          />
        </div>

        {/* Feedback Field */}
        <div className="space-y-2">
          <Label htmlFor="feedback" className="text-xs font-normal tracking-[0.08em] uppercase text-muted-foreground flex items-center gap-2">
            <RiFeedbackLine className="h-3.5 w-3.5" />
            Feedback
          </Label>
          <Textarea
            id="feedback"
            placeholder="Share your feedback, suggestions, or additional context..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={loading}
            className="rounded-none text-sm font-light min-h-[100px] resize-none leading-relaxed border-border focus:ring-primary"
          />
        </div>

        {/* Submit / Reset Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || (!issueSummary.trim() && !feedback.trim())}
            className="rounded-none text-xs font-light tracking-[0.08em] uppercase px-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RiSendPlane2Fill className="h-3.5 w-3.5" />
                Submit
              </span>
            )}
          </Button>
          {(submitted || issueSummary || feedback) && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="rounded-none text-xs font-light tracking-[0.05em]"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-none">
            <p className="text-xs font-light text-destructive">{error}</p>
          </div>
        )}

        {/* Agent Response Display */}
        {submitted && agentResponse && (
          <div className="space-y-4 pt-2">
            <Separator />
            <div className="flex items-center gap-2 mb-2">
              <RiCheckLine className="h-4 w-4 text-green-700" />
              <span className="text-xs font-normal tracking-[0.08em] uppercase text-green-700">AI Analysis</span>
            </div>

            {/* Main Response */}
            <div className="bg-secondary px-4 py-4 rounded-none">
              <div className="text-sm font-light leading-relaxed text-foreground">
                {renderMarkdown(agentResponse.response)}
              </div>
            </div>

            {/* Insights */}
            {Array.isArray(agentResponse.insights) && agentResponse.insights.length > 0 && (
              <div className="border border-border px-4 py-4 rounded-none">
                <p className="text-xs font-normal tracking-[0.08em] uppercase text-muted-foreground mb-3">
                  Key Insights
                </p>
                <ul className="space-y-2">
                  {agentResponse.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm font-light leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {agentResponse.recommendation && (
              <div className="bg-primary/5 border border-primary/20 px-4 py-4 rounded-none">
                <p className="text-xs font-normal tracking-[0.08em] uppercase text-primary mb-2">
                  Recommendation
                </p>
                <p className="text-sm font-light leading-relaxed">{agentResponse.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AgentInfoBar() {
  return (
    <Card className="rounded-none border border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-secondary rounded-none">
              <RiRobot2Line className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-normal tracking-[0.05em] text-foreground">Dashboard Assistant Agent</p>
              <p className="text-[10px] font-light text-muted-foreground mt-0.5">Conversational AI for metrics, data, and recommendations</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-none text-[10px] font-light tracking-[0.05em] border-primary/30 text-primary">JSON Agent</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showAgentActivity, setShowAgentActivity] = useState(false)

  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
  }, [])

  const agentActivity = useLyzrAgentEvents(sessionId)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(prev => !prev)} />

      <div className="transition-all duration-300" style={{ marginLeft: '64px' }}>
        <TopHeader
          onToggleSidebar={() => setSidebarExpanded(prev => !prev)}
          onToggleAssistant={() => setAssistantOpen(prev => !prev)}
          showSample={showSample}
          onToggleSample={setShowSample}
        />

        <main className="p-6 lg:p-8 space-y-8">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={RiUserLine} label="Total Users" value={SAMPLE_METRICS.users.value} trend={SAMPLE_METRICS.users.trend} up={SAMPLE_METRICS.users.up} showSample={showSample} />
            <MetricCard icon={RiMoneyDollarCircleLine} label="Revenue" value={SAMPLE_METRICS.revenue.value} trend={SAMPLE_METRICS.revenue.trend} up={SAMPLE_METRICS.revenue.up} showSample={showSample} />
            <MetricCard icon={RiFlashlightLine} label="Active Sessions" value={SAMPLE_METRICS.sessions.value} trend={SAMPLE_METRICS.sessions.trend} up={SAMPLE_METRICS.sessions.up} showSample={showSample} />
            <MetricCard icon={RiPercentLine} label="Conversion Rate" value={SAMPLE_METRICS.conversion.value} trend={SAMPLE_METRICS.conversion.trend} up={SAMPLE_METRICS.conversion.up} showSample={showSample} />
          </div>

          {/* Chart and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart showSample={showSample} />
            </div>
            <div>
              <ActivityFeed showSample={showSample} />
            </div>
          </div>

          {/* Issue Summary & Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IssueFeedbackForm />
            </div>
            <div>
              <Card className="rounded-none border border-border shadow-sm h-full">
                <CardContent className="p-6 flex flex-col justify-center h-full">
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-secondary rounded-none inline-block mx-auto">
                      <RiRobot2Line className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-serif text-sm font-medium tracking-[0.08em]">AI-Powered Analysis</h4>
                    <p className="text-xs font-light text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      Submit an issue summary and feedback. The AI assistant will analyze your input and provide structured insights with actionable recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions and Agent Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div>
                <h3 className="font-serif text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground mb-4">Quick Actions</h3>
                <QuickActions />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground">Powered By</h3>
              <AgentInfoBar />
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-xs font-light tracking-[0.05em] w-full"
                onClick={() => setShowAgentActivity(prev => !prev)}
              >
                {showAgentActivity ? 'Hide Agent Activity' : 'Show Agent Activity'}
              </Button>
              {showAgentActivity && (
                <AgentActivityPanel {...agentActivity} className="rounded-none border border-border" />
              )}
            </div>
          </div>

          {/* Empty State CTA */}
          {!showSample && !assistantOpen && (
            <Card className="rounded-none border border-border shadow-sm">
              <CardContent className="py-12 text-center">
                <RiDashboardLine className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-lg font-medium tracking-[0.08em] text-foreground mb-2">Welcome to your Dashboard</h3>
                <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">Toggle "Sample Data" in the header to explore metrics, charts, and activity. Open the AI Assistant to ask questions about your data.</p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" className="rounded-none text-xs font-light tracking-[0.05em]" onClick={() => setShowSample(true)}>
                    View Sample Data
                  </Button>
                  <Button className="rounded-none text-xs font-light tracking-[0.05em]" onClick={() => setAssistantOpen(true)}>
                    Open AI Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <AIAssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} sessionId={sessionId} />
    </div>
  )
}
