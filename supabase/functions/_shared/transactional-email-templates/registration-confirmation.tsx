import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Piedmont District Convention"

interface RegistrationConfirmationProps {
  attendeeName?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
  numTickets?: number
  totalPrice?: number
  registrationId?: string
}

const RegistrationConfirmationEmail = ({
  attendeeName = 'Guest',
  eventTitle = 'Event',
  eventDate = '',
  eventLocation = '',
  numTickets = 1,
  totalPrice,
  registrationId = '',
}: RegistrationConfirmationProps) => {
  const priceText = totalPrice && totalPrice > 0
    ? `$${totalPrice.toFixed(2)}`
    : 'Free'
  const confirmationCode = registrationId
    ? registrationId.slice(0, 8).toUpperCase()
    : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Registration Confirmed: {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={headerHeading}>Registration Confirmed! 🎉</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greeting}>Hi <strong>{attendeeName}</strong>,</Text>
            <Text style={text}>
              Thank you for registering! Your spot has been confirmed for the following event:
            </Text>

            <Section style={eventCard}>
              <Heading as="h2" style={eventTitleStyle}>{eventTitle}</Heading>
              <Text style={detailRow}>📅 <strong>Date:</strong> {eventDate}</Text>
              <Text style={detailRow}>📍 <strong>Location:</strong> {eventLocation}</Text>
              <Text style={detailRow}>🎟️ <strong>Tickets:</strong> {numTickets}</Text>
              <Text style={detailRow}>💰 <strong>Price:</strong> {priceText}</Text>
            </Section>

            {confirmationCode && (
              <Section style={confirmationBox}>
                <Text style={confirmationLabel}>
                  <strong>Confirmation ID:</strong> {confirmationCode}
                </Text>
                <Text style={confirmationHint}>Please save this for your records.</Text>
              </Section>
            )}

            <Text style={text}>
              If you have any questions, please don't hesitate to reach out.
            </Text>

            <Text style={signOff}>See you there!</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated confirmation email from {SITE_NAME}. Please do not reply directly to this message.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RegistrationConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Registration Confirmed: ${data.eventTitle || 'Event'}`,
  displayName: 'Registration confirmation',
  previewData: {
    attendeeName: 'Jane Doe',
    eventTitle: 'Annual Convention 2026',
    eventDate: 'Saturday, June 20, 2026 at 10:00 AM',
    eventLocation: 'First Baptist Church, Danville, VA',
    numTickets: 2,
    totalPrice: 0,
    registrationId: 'abc12345-sample',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const headerSection = {
  background: 'linear-gradient(135deg, hsl(220, 65%, 25%) 0%, hsl(195, 65%, 45%) 100%)',
  padding: '30px',
  borderRadius: '10px 10px 0 0',
  textAlign: 'center' as const,
}
const headerHeading = { color: '#ffffff', margin: '0', fontSize: '24px', fontWeight: 'bold' }
const contentSection = {
  backgroundColor: '#f9fafb',
  padding: '30px',
  border: '1px solid #e5e7eb',
  borderTop: 'none',
  borderRadius: '0 0 10px 10px',
}
const greeting = { fontSize: '16px', color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const eventCard = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  margin: '0 0 20px',
}
const eventTitleStyle = { margin: '0 0 15px', color: 'hsl(220, 65%, 25%)', fontSize: '20px' }
const detailRow = { margin: '8px 0', fontSize: '14px', color: '#333333' }
const confirmationBox = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '8px',
  borderLeft: '4px solid hsl(38, 70%, 55%)',
  margin: '0 0 20px',
}
const confirmationLabel = { margin: '0', fontSize: '14px', color: '#333333' }
const confirmationHint = { margin: '5px 0 0', fontSize: '12px', color: '#666666' }
const signOff = { fontSize: '14px', color: '#666666', margin: '30px 0 0' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '0' }
