"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import PublisherLayout from "@/components/publisher/publisher-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react"

export default function PublisherSettings() {
  const { user } = useAuth()
  const supabase = createClient()

  const [paypalEmail, setPaypalEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('paypal_email')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (data?.paypal_email) {
        setPaypalEmail(data.paypal_email)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setMessage({ type: "error", text: "Failed to load profile" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!paypalEmail.trim()) {
      setMessage({ type: "error", text: "Please enter your PayPal email" })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(paypalEmail)) {
      setMessage({ type: "error", text: "Please enter a valid email address" })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from('profiles')
        .update({ paypal_email: paypalEmail.trim() })
        .eq('id', user?.id)

      if (error) throw error

      setMessage({ type: "success", text: "PayPal email saved successfully!" })
    } catch (err) {
      console.error('Error saving PayPal email:', err)
      setMessage({ type: "error", text: "Failed to save PayPal email" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PublisherLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </PublisherLayout>
    )
  }

  return (
    <PublisherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account settings and payout preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              Payment Settings
            </CardTitle>
            <CardDescription>
              Set your PayPal email to receive payouts when orders are completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Important:</strong> Make sure this email is associated with a verified PayPal account. 
                Payouts will be sent to this email address when advertisers approve your completed work.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="paypal-email">PayPal Email Address</Label>
              <Input
                id="paypal-email"
                type="email"
                placeholder="your-paypal@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                disabled={saving}
                className="max-w-md"
              />
              <p className="text-sm text-slate-500">
                This email must match your PayPal account email
              </p>
            </div>

            {message && (
              <Alert className={message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                {message.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-900" : "text-red-900"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save PayPal Email"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your registered account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-slate-500">Email</Label>
              <p className="text-slate-900">{user?.email}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-500">Role</Label>
              <p className="text-slate-900">Publisher</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublisherLayout>
  )
}

