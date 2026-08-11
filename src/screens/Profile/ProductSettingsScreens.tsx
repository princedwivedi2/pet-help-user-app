import React, { useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { colors, radius, shadows, spacing, typography } from '../../theme'

const defaultPreferences = {
  appointments: true,
  care: true,
  payments: true,
  tips: false,
  offers: false,
}

export function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const items: Array<[keyof typeof preferences, string, string, React.ComponentProps<typeof Ionicons>['name']]> = [
    ['appointments', 'Appointments', 'Confirmations, changes, and reminders', 'calendar-outline'],
    ['care', 'Medications & care', 'Dose, vaccination, and routine reminders', 'medical-outline'],
    ['payments', 'Payments', 'Receipts and refund updates', 'receipt-outline'],
    ['tips', 'Pet care tips', 'Helpful educational content', 'book-outline'],
    ['offers', 'Offers', 'Respaw plans and clinic offers', 'pricetag-outline'],
  ]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader title="Notification preferences" subtitle="Choose the updates that are useful to you" />
      <View style={styles.groupCard}>
        {items.map(([key, title, note, icon], index) => (
          <View key={key} style={[styles.settingRow, index < items.length - 1 && styles.divider]}>
            <View style={styles.rowIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View>
            <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowNote}>{note}</Text></View>
            <Switch value={preferences[key]} onValueChange={value => setPreferences(previous => ({ ...previous, [key]: value }))} trackColor={{ false: colors.borderStrong, true: colors.primarySoft }} thumbColor={preferences[key] ? colors.primary : colors.subtle} />
          </View>
        ))}
      </View>
      <View style={styles.infoCard}><Ionicons name="phone-portrait-outline" size={21} color={colors.primary} /><Text style={styles.infoText}>Your device notification permission can still override these choices. Preference syncing will activate when its backend endpoint is available.</Text></View>
      <PrimaryButton title="Save preferences" onPress={() => Alert.alert('Saved on this device', 'Your choices are applied for this app session.')} />
    </ScrollView>
  )
}

const faqs = [
  ['How do I reschedule an appointment?', 'Open Appointments, choose an upcoming booking, then use the reschedule action if the clinic allows changes.'],
  ['When will my refund arrive?', 'Approved refunds usually return to the original payment method in 5–7 business days.'],
  ['How do online consultations work?', 'Choose Online consult, book a slot, complete payment, then test your camera and microphone before joining.'],
]

export function HelpSupportScreen() {
  const navigation = useNavigation<any>()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<number | null>(0)
  const filtered = faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(query.toLowerCase()))

  async function emailSupport() {
    const url = 'mailto:support@respaw.app?subject=Respaw%20support%20request'
    try { await Linking.openURL(url) } catch { Alert.alert('Email support', 'Write to support@respaw.app') }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeader title="Help & support" subtitle="Answers and assistance for your Respaw account" />
      <View style={styles.searchBox}><Ionicons name="search-outline" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search help topics" placeholderTextColor={colors.subtle} style={styles.searchInput} /></View>
      <Text style={styles.sectionLabel}>COMMON QUESTIONS</Text>
      <View style={styles.groupCard}>
        {filtered.map(([question, answer], index) => {
          const expanded = open === index
          return <Pressable key={question} style={[styles.faqRow, index < filtered.length - 1 && styles.divider]} onPress={() => setOpen(expanded ? null : index)}>
            <View style={styles.faqHeading}><Text style={styles.faqTitle}>{question}</Text><Ionicons name={expanded ? 'remove' : 'add'} size={20} color={colors.primary} /></View>
            {expanded ? <Text style={styles.faqAnswer}>{answer}</Text> : null}
          </Pressable>
        })}
        {!filtered.length ? <Text style={styles.noResults}>No help topics match “{query}”.</Text> : null}
      </View>
      <Text style={styles.sectionLabel}>CONTACT US</Text>
      <Pressable style={styles.contactCard} onPress={emailSupport}><View style={styles.contactIcon}><Ionicons name="mail-outline" size={21} color={colors.onPrimary} /></View><View style={{ flex: 1 }}><Text style={styles.contactTitle}>Email support</Text><Text style={styles.contactNote}>support@respaw.app</Text></View><Ionicons name="open-outline" size={18} color={colors.primary} /></Pressable>
      <Pressable style={styles.emergencyCard} onPress={() => navigation.navigate('Emergency')}><Ionicons name="medical" size={22} color={colors.danger} /><View style={{ flex: 1 }}><Text style={styles.emergencyTitle}>Need urgent veterinary care?</Text><Text style={styles.emergencyNote}>Support cannot provide emergency medical help.</Text></View><Text style={styles.emergencyLink}>Open</Text></Pressable>
    </ScrollView>
  )
}

const legalCopy = {
  Privacy: [['Your information', 'Respaw uses account, pet, appointment, location, and payment-status information to provide the services you request.'], ['Medical information', 'Pet health records should be treated as sensitive product data and shown only to authorized users and care providers.'], ['Your choices', 'You can update your profile, notification preferences, and account settings from the app.']],
  Terms: [['Using Respaw', 'You are responsible for accurate account and pet information and for following clinic instructions.'], ['Care providers', 'Veterinary services are provided by independent care providers shown in the app.']],
  Refunds: [['Refund timing', 'Eligible refunds are returned to the original payment method after provider approval. Bank processing time may vary.'], ['Status updates', 'Open Payment history to view the latest status available from the payment service.']],
  Medical: [['Not emergency advice', 'App content and AI assistance are educational and do not replace diagnosis by a licensed veterinarian.'], ['Urgent symptoms', 'For severe or rapidly worsening symptoms, contact an emergency veterinary clinic immediately.']],
}

export function LegalAboutScreen() {
  const [tab, setTab] = useState<keyof typeof legalCopy>('Privacy')
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader title="Legal & about" subtitle="Respaw user app · Version 1.0" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {(Object.keys(legalCopy) as Array<keyof typeof legalCopy>).map(item => <Pressable key={item} style={[styles.tab, tab === item && styles.tabActive]} onPress={() => setTab(item)}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.legalTitle}>{tab === 'Privacy' ? 'Privacy policy' : tab}</Text>
      <Text style={styles.effective}>Effective 20 July 2026</Text>
      {legalCopy[tab].map(([title, body]) => <View key={title} style={styles.legalSection}><Text style={styles.legalHeading}>{title}</Text><Text style={styles.legalBody}>{body}</Text></View>)}
      <View style={styles.infoCard}><Ionicons name="information-circle-outline" size={21} color={colors.primary} /><Text style={styles.infoText}>This in-app summary should link to the approved, hosted legal documents before production release.</Text></View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 52 },
  groupCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, ...shadows.card },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: '900' },
  rowNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  infoCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, marginVertical: spacing.lg },
  infoText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18 },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: spacing.xxl, marginBottom: spacing.sm },
  faqRow: { paddingVertical: spacing.md },
  faqHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  faqTitle: { flex: 1, color: colors.text, fontWeight: '900', lineHeight: 20 },
  faqAnswer: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, paddingRight: spacing.xl },
  noResults: { color: colors.muted, paddingVertical: spacing.xl, textAlign: 'center' },
  contactCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  contactIcon: { width: 43, height: 43, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { color: colors.text, fontWeight: '900' },
  contactNote: { color: colors.muted, fontSize: 12, marginTop: 2 },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerSoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.dangerBorder },
  emergencyTitle: { color: colors.danger, fontWeight: '900' },
  emergencyNote: { color: colors.text, fontSize: 11, marginTop: 2 },
  emergencyLink: { color: colors.danger, fontWeight: '900' },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.xl },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: colors.onPrimary },
  legalTitle: { ...typography.h1, color: colors.text, marginTop: spacing.xxl },
  effective: { color: colors.muted, fontSize: 12, marginTop: 4 },
  legalSection: { marginTop: spacing.xxl },
  legalHeading: { ...typography.h2, color: colors.text },
  legalBody: { ...typography.body, color: colors.muted, marginTop: spacing.sm },
})
