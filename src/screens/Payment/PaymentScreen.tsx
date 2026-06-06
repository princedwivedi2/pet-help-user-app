import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet, TextInput, ScrollView } from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import { createPaymentOrder, verifyPayment } from '../../services'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { WebView } from 'react-native-webview'

export default function PaymentScreen() {
  const nav = useNavigation<any>()
  const route = useRoute()
  const { appointmentId, amount, appointment, vetName, scheduledAt, appointmentType, consultationId } = (route.params || {}) as {
    appointmentId?: string; amount?: number; appointment?: any; vetName?: string;
    scheduledAt?: string; appointmentType?: string; consultationId?: string
  }
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any | null>(null)
  const [orderError, setOrderError] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [signature, setSignature] = useState('')
  const [checkoutLoaded, setCheckoutLoaded] = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)

  const orderAmount = useMemo(() => Math.round(order?.amount || amount || 0), [amount, order?.amount])

  async function createOrder() {
    if (!appointmentId) {
      setOrderError('No appointment id was passed to payment.')
      return
    }
    setLoading(true)
    setOrderError('')
    try {
      const res = await createPaymentOrder({ payable_type: 'appointment', payable_uuid: appointmentId, payment_model: 'platform_fee', amount })
      if (res?.data) setOrder((res.data as any).payment || res.data)
      else setOrderError(res?.message || 'Unable to start payment. Try again.')
    } catch (e) {
      setOrderError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    createOrder()
  }, [appointmentId, amount])

  async function handleVerifyPayment() {
    if (!order) {
      setVerifyError('Order not created.')
      return
    }
    if (!paymentId.trim() || !signature.trim()) {
      setVerifyError('Enter the payment id and signature from checkout.')
      return
    }

    setLoading(true)
    setVerifyError('')
    try {
      const paymentUuid = order.payment_uuid || order.uuid || order.id
      const orderId = order.razorpay_order_id || order.order_id || order.id
      const res = await verifyPayment({
        payment_uuid: paymentUuid,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId.trim(),
        razorpay_signature: signature.trim(),
      })
      if (res?.success) {
        setCheckoutDone(true)
        nav.replace('Confirmation', {
          appointmentUuid: appointmentId,
          vetName,
          scheduledAt: scheduledAt ?? appointment?.scheduled_at,
          appointmentType: appointmentType ?? appointment?.appointment_type,
          amount,
          consultationId,
        })
      } else {
        setVerifyError(res?.message || 'Payment verification failed.')
      }
    } catch (e) {
      setVerifyError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const checkoutHtml = useMemo(() => {
    if (!order) return ''
    const orderId = order.razorpay_order_id || order.order_id || order.id
    const key = order.razorpay_key || ''
    const amountInRupees = (orderAmount / 100).toFixed(2)

    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #fff7f1; color: #0f172a; }
            .wrap { padding: 24px; }
            .card { background: #fff; border-radius: 20px; padding: 20px; border: 1px solid #f4e3d5; box-shadow: 0 12px 30px rgba(15,23,42,0.06); }
            .btn { width: 100%; border: 0; border-radius: 14px; padding: 14px 16px; background: #ff6b2c; color: #fff7f1; font-size: 16px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <h2 style="margin-top:0;">Confirm payment</h2>
              <p style="margin-bottom:18px;">${vetName || 'Veterinarian'} • Appointment ${appointmentId || ''}</p>
              <p><strong>Amount:</strong> ₹${amountInRupees}</p>
              <button id="pay" class="btn">Pay now</button>
            </div>
          </div>
          <script>
            const button = document.getElementById('pay');
            button.addEventListener('click', function () {
              const options = {
                key: ${JSON.stringify(key)},
                order_id: ${JSON.stringify(orderId)},
                amount: ${JSON.stringify(orderAmount)},
                currency: 'INR',
                name: 'Pet Help',
                description: ${JSON.stringify(appointment?.reason || 'Appointment booking')},
                handler: function (response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    payment_id: response.razorpay_payment_id,
                    order_id: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                  }));
                },
                modal: {
                  ondismiss: function () {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ dismissed: true }));
                  }
                }
              };
              const checkout = new Razorpay(options);
              checkout.open();
            });
          </script>
        </body>
      </html>
    `
  }, [appointment?.reason, appointmentId, order, orderAmount, vetName])

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Complete checkout for the appointment, then verify the returned payment details.</Text>

      {orderError ? <ErrorCard message={orderError} onRetry={createOrder} /> : null}

      {order ? (
        <View style={styles.card}>
          <Text style={styles.label}>Appointment</Text>
          <Text style={styles.value}>{vetName || 'Veterinarian'}</Text>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{order.razorpay_order_id || order.order_id || order.id}</Text>
          <Text style={styles.label}>Payment UUID</Text>
          <Text style={styles.value}>{order.payment_uuid || order.uuid || order.id}</Text>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>₹{orderAmount}</Text>

          <View style={styles.checkoutWrap}>
            {checkoutHtml ? (
              <WebView
                originWhitelist={['*']}
                source={{ html: checkoutHtml }}
                javaScriptEnabled
                domStorageEnabled
                onMessage={event => {
                  try {
                    const payload = JSON.parse(event.nativeEvent.data)
                    if (payload?.dismissed) return
                    setPaymentId(payload.payment_id || '')
                    setSignature(payload.signature || '')
                    setCheckoutLoaded(true)
                  } catch {
                    // ignore malformed messages
                  }
                }}
                style={styles.webview}
              />
            ) : null}
          </View>

          <Text style={styles.label}>Razorpay payment id</Text>
          <TextInput value={paymentId} onChangeText={v => { setPaymentId(v); setVerifyError('') }} placeholder="pay_..." placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
          <Text style={styles.label}>Razorpay signature</Text>
          <TextInput value={signature} onChangeText={v => { setSignature(v); setVerifyError('') }} placeholder="signature" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />

          {verifyError ? <ErrorCard message={verifyError} onRetry={handleVerifyPayment} /> : null}

          <Pressable style={styles.button} onPress={handleVerifyPayment}>
            <Text style={styles.buttonText}>{checkoutDone ? 'Verify again' : 'Verify payment'}</Text>
          </Pressable>
          <Text style={styles.helper}>Use the checkout above or paste the payment callback values and verify them with the server.</Text>
        </View>
      ) : (
        !orderError ? <Text style={styles.empty}>No order created yet.</Text> : null
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: spacing.lg, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  label: { color: colors.muted, marginTop: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { color: colors.text, fontWeight: '700', marginTop: 4 },
  amount: { color: colors.primary, fontWeight: '900', fontSize: 28, marginTop: 4 },
  button: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.onPrimary, fontWeight: '800' },
  empty: { color: colors.muted, marginTop: 20 },
  helper: { color: colors.muted, marginTop: 10, lineHeight: 18 },
  checkoutWrap: { height: 280, marginTop: spacing.md, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  webview: { flex: 1, backgroundColor: 'transparent' },
  input: { marginTop: 6, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text },
})
