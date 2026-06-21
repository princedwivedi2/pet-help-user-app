import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import { createPaymentOrder, verifyPayment, mockConfirmPayment } from '../../services'
import { createSubscriptionOrder, verifySubscription } from '../../services/subscriptions'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '../../theme'
import { WebView } from 'react-native-webview'
import { parseApiError } from '../../utils/apiError'

const PAYMENTS_MOCK = process.env.EXPO_PUBLIC_PAYMENTS_MOCK === 'true'

type PaymentStatus = 'idle' | 'ordering' | 'checkout' | 'verifying' | 'done' | 'failed'

export default function PaymentScreen() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const route = useRoute()
  const {
    appointmentId, amount, appointment, vetName,
    scheduledAt, appointmentType, consultationId, modality,
    subscriptionPlanUuid,
  } = (route.params || {}) as {
    appointmentId?: string; amount?: number; appointment?: any; vetName?: string;
    scheduledAt?: string; appointmentType?: string; consultationId?: string;
    modality?: 'video' | 'audio'; subscriptionPlanUuid?: string
  }

  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [order, setOrder] = useState<any | null>(null)
  const [orderError, setOrderError] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const submittingRef = useRef(false)

  const orderAmount = useMemo(() => Math.round(order?.amount || amount || 0), [amount, order?.amount])

  const createOrder = useCallback(async () => {
    if (!subscriptionPlanUuid && !consultationId && !appointmentId) {
      setOrderError('No payable ID was passed to payment.')
      return
    }
    setStatus('ordering')
    setOrderError('')
    try {
      let res: any
      if (subscriptionPlanUuid) {
        res = await createSubscriptionOrder(subscriptionPlanUuid)
      } else {
        const payableId = consultationId ?? appointmentId!
        res = await createPaymentOrder({
          payable_type: consultationId ? 'consultation' : 'appointment',
          payable_uuid: payableId,
          payment_model: 'platform_fee',
          amount,
        })
      }
      if (res?.data) {
        const orderData = (res.data as any).payment || res.data
        setOrder(orderData)
        if (PAYMENTS_MOCK) {
          // Skip Razorpay entirely — call backend mock-confirm
          setStatus('verifying')
          const paymentUuid = orderData.payment_uuid || orderData.uuid || orderData.id
          const mockRes = await mockConfirmPayment({ payment_uuid: paymentUuid })
          if (mockRes?.success || mockRes?.data) {
            setStatus('done')
            if (subscriptionPlanUuid) {
              nav.replace('Subscriptions')
            } else if (consultationId) {
              nav.replace('ConsultationRoom', { consultationId, modality: modality ?? 'video', vetName })
            } else {
              nav.replace('Confirmation', {
                appointmentUuid: appointmentId,
                vetName,
                scheduledAt: scheduledAt ?? appointment?.scheduled_at,
                appointmentType: appointmentType ?? appointment?.appointment_type,
                amount,
              })
            }
          } else {
            setOrderError(mockRes?.message || 'Mock payment confirmation failed.')
            setStatus('failed')
          }
          return
        }
        setStatus('checkout')
      } else {
        setOrderError(res?.message || 'Unable to start payment. Try again.')
        setStatus('failed')
      }
    } catch (e) {
      setOrderError(parseApiError(e))
      setStatus('failed')
    }
  }, [appointmentId, consultationId, subscriptionPlanUuid, amount])

  useEffect(() => {
    createOrder()
  }, [createOrder])

  const handleVerifyPayment = useCallback(async (razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setStatus('verifying')
    setVerifyError('')
    try {
      let res: any
      if (subscriptionPlanUuid) {
        res = await verifySubscription({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        })
      } else {
        const paymentUuid = order.payment_uuid || order.uuid || order.id
        res = await verifyPayment({
          payment_uuid: paymentUuid,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        })
      }
      if (res?.success) {
        setStatus('done')
        if (subscriptionPlanUuid) {
          nav.replace('Subscriptions')
        } else if (consultationId) {
          nav.replace('ConsultationRoom', {
            consultationId,
            modality: modality ?? 'video',
            vetName,
          })
        } else {
          nav.replace('Confirmation', {
            appointmentUuid: appointmentId,
            vetName,
            scheduledAt: scheduledAt ?? appointment?.scheduled_at,
            appointmentType: appointmentType ?? appointment?.appointment_type,
            amount,
          })
        }
      } else {
        setVerifyError(res?.message || 'Payment verification failed.')
        setStatus('checkout')
        submittingRef.current = false
      }
    } catch (e) {
      setVerifyError(parseApiError(e))
      setStatus('checkout')
      submittingRef.current = false
    }
  }, [order, appointmentId, consultationId, subscriptionPlanUuid, modality, vetName, scheduledAt, appointment, appointmentType, amount, nav])

  const onWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    let payload: any
    try {
      payload = JSON.parse(event.nativeEvent.data)
    } catch {
      return
    }

    if (payload?.dismissed) {
      Alert.alert(
        'Payment cancelled',
        'You closed the checkout without completing payment.',
        [{ text: 'Try again', style: 'cancel' }, { text: 'Go back', onPress: () => nav.goBack() }],
      )
      return
    }

    if (payload?.error_code) {
      setVerifyError(`Payment failed: ${payload.error_description || payload.error_code}`)
      setStatus('checkout')
      return
    }

    if (payload?.payment_id && payload?.signature) {
      handleVerifyPayment(payload.payment_id, payload.order_id, payload.signature)
    }
  }, [handleVerifyPayment, nav])

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
            .btn { width: 100%; border: 0; border-radius: 14px; padding: 14px 16px; background: #ff6b2c; color: #fff7f1; font-size: 16px; font-weight: 700; cursor: pointer; }
            .btn:disabled { opacity: 0.5; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <h2 style="margin-top:0;">Confirm payment</h2>
              <p style="margin-bottom:18px;">${vetName || 'Veterinarian'} • Appointment</p>
              <p><strong>Amount:</strong> ₹${amountInRupees}</p>
              <button id="pay" class="btn">Pay ₹${amountInRupees}</button>
            </div>
          </div>
          <script>
            var paying = false;
            document.getElementById('pay').addEventListener('click', function () {
              if (paying) return;
              paying = true;
              this.disabled = true;
              var options = {
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
                    paying = false;
                    document.getElementById('pay').disabled = false;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ dismissed: true }));
                  }
                },
                theme: { color: '#ff6b2c' }
              };
              var checkout = new Razorpay(options);
              checkout.on('payment.failed', function (response) {
                paying = false;
                document.getElementById('pay').disabled = false;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  error_code: response.error.code,
                  error_description: response.error.description,
                }));
              });
              checkout.open();
            });
          </script>
        </body>
      </html>
    `
  }, [appointment?.reason, order, orderAmount, vetName])

  const isLoading = status === 'ordering' || status === 'verifying'

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingLabel}>
          {status === 'ordering' ? 'Creating order…' : PAYMENTS_MOCK ? 'Processing payment (test mode)…' : 'Verifying payment…'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Payment</Text>
      </View>

      {orderError ? (
        <View style={styles.errorWrap}>
          <ErrorCard message={orderError} onRetry={createOrder} />
        </View>
      ) : null}

      {verifyError ? (
        <View style={styles.errorWrap}>
          <ErrorCard message={verifyError} onRetry={() => setVerifyError('')} />
        </View>
      ) : null}

      {order && checkoutHtml ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: checkoutHtml }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onWebViewMessage}
          style={styles.webview}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: spacing.md },
  loadingLabel: { color: colors.muted, marginTop: spacing.sm },
  webview: { flex: 1 },
  errorWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
})
