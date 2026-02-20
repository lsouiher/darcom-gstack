# Booking Request Flow

This document explains the complete booking flow in DaryWin, from property selection to payment confirmation and notifications.

---

## Table of Contents

1. [Flow Overview](#flow-overview)
2. [Step 1: User Initiates Checkout](#step-1-user-initiates-checkout)
3. [Step 2: User Submits Checkout Form](#step-2-user-submits-checkout-form)
4. [Step 3: Payment Gateway Integration](#step-3-payment-gateway-integration)
5. [Step 4: Create Temporary Booking](#step-4-create-temporary-booking)
6. [Step 5: User Completes Payment](#step-5-user-completes-payment)
7. [Step 6: Verify Payment & Finalize Booking](#step-6-verify-payment--finalize-booking)
8. [Step 7: Notifications](#step-7-notifications)
9. [Booking States & TTL](#booking-states--ttl)
10. [Data Models Involved](#data-models-involved)
11. [Key Files Reference](#key-files-reference)

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BOOKING FLOW DIAGRAM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PROPERTY SELECTION          2. CHECKOUT PAGE           3. PAYMENT       │
│  ┌─────────────────┐           ┌─────────────────┐       ┌──────────────┐  │
│  │ User browses    │           │ User fills form │       │ Stripe or    │  │
│  │ properties and  │──────────>│ (dates, details │──────>│ PayPal       │  │
│  │ clicks "Book"   │           │  payment option)│       │ processes    │  │
│  └─────────────────┘           └─────────────────┘       └──────┬───────┘  │
│                                                                  │          │
│  6. NOTIFICATIONS              5. BOOKING SAVED          4. VERIFICATION   │
│  ┌─────────────────┐           ┌─────────────────┐       ┌──────┴───────┐  │
│  │ Email to renter │           │ MongoDB saves   │       │ Backend      │  │
│  │ Email to agency │<──────────│ booking with    │<──────│ verifies     │  │
│  │ Push to mobile  │           │ status "Paid"   │       │ payment      │  │
│  └─────────────────┘           └─────────────────┘       └──────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sequence Diagram

```
┌────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐     ┌─────────┐
│ User   │     │ Frontend │     │ Backend │     │ Stripe │     │ MongoDB │
└───┬────┘     └────┬─────┘     └────┬────┘     └───┬────┘     └────┬────┘
    │               │                │              │               │
    │ Click "Book"  │                │              │               │
    │──────────────>│                │              │               │
    │               │                │              │               │
    │               │ Navigate to /checkout         │               │
    │               │ with property, dates          │               │
    │               │                │              │               │
    │ Fill form     │                │              │               │
    │──────────────>│                │              │               │
    │               │                │              │               │
    │               │ createCheckoutSession         │               │
    │               │───────────────>│              │               │
    │               │                │              │               │
    │               │                │ Create session               │
    │               │                │─────────────>│               │
    │               │                │              │               │
    │               │                │ sessionId, clientSecret      │
    │               │                │<─────────────│               │
    │               │                │              │               │
    │               │ clientSecret   │              │               │
    │               │<───────────────│              │               │
    │               │                │              │               │
    │               │ POST /api/checkout            │               │
    │               │───────────────>│              │               │
    │               │                │              │               │
    │               │                │ Save temp booking            │
    │               │                │─────────────────────────────>│
    │               │                │              │               │
    │               │ bookingId      │              │               │
    │               │<───────────────│              │               │
    │               │                │              │               │
    │ Show Stripe   │                │              │               │
    │ payment form  │                │              │               │
    │<──────────────│                │              │               │
    │               │                │              │               │
    │ Enter card    │                │              │               │
    │──────────────>│                │              │               │
    │               │                │              │               │
    │               │ Process payment               │               │
    │               │─────────────────────────────>│               │
    │               │                │              │               │
    │               │ Redirect to /checkout-session/{id}           │
    │               │<─────────────────────────────│               │
    │               │                │              │               │
    │               │ checkCheckoutSession          │               │
    │               │───────────────>│              │               │
    │               │                │              │               │
    │               │                │ Verify payment               │
    │               │                │─────────────>│               │
    │               │                │              │               │
    │               │                │ payment_status: paid         │
    │               │                │<─────────────│               │
    │               │                │              │               │
    │               │                │ Update booking status        │
    │               │                │─────────────────────────────>│
    │               │                │              │               │
    │               │                │ Send emails (renter, agency) │
    │               │                │              │               │
    │               │ 200 OK         │              │               │
    │               │<───────────────│              │               │
    │               │                │              │               │
    │ Show success  │                │              │               │
    │<──────────────│                │              │               │
    │               │                │              │               │
```

---

## Step 1: User Initiates Checkout

When a user selects a property and clicks "Book", they are navigated to the checkout page with the booking details passed via React Router state.

### Frontend: `frontend/src/pages/Checkout.tsx` (lines 353-404)

```typescript
const onLoad = async (_user?: movininTypes.User) => {
  // Get data from navigation state
  const { state } = reactLocation
  const { propertyId, locationId, from: _from, to: _to } = state

  // Fetch property details
  const _property = await PropertyService.getProperty(propertyId)

  // Fetch location details
  const _location = await LocationService.getLocation(locationId)

  // Calculate total price based on rental term
  const _price = await PaymentService.convertPrice(
    movininHelper.calculateTotalPrice(_property, _from, _to)
  )

  setProperty(_property)
  setPrice(_price)
  setLocation(_location)
  setFrom(_from)
  setTo(_to)
}
```

### Price Calculation: `packages/darywin-helper/index.ts`

The price is calculated based on the property's rental term:

```typescript
export const calculateTotalPrice = (
  property: Property,
  from: Date,
  to: Date
): number => {
  const days = daysBetween(from, to)

  switch (property.rentalTerm) {
    case RentalTerm.Daily:
      return property.price * days
    case RentalTerm.Weekly:
      return property.price * Math.ceil(days / 7)
    case RentalTerm.Monthly:
      return property.price * Math.ceil(days / 30)
    case RentalTerm.Yearly:
      return property.price * Math.ceil(days / 365)
  }
}
```

---

## Step 2: User Submits Checkout Form

The checkout form collects renter details (for guest users) and payment preferences.

### Frontend: `frontend/src/pages/Checkout.tsx` (lines 218-351)

```typescript
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  // 1. Validate reCAPTCHA (if enabled)
  let recaptchaToken = ''
  if (reCaptchaLoaded) {
    recaptchaToken = await generateReCaptchaToken()
    if (!(await helper.verifyReCaptcha(recaptchaToken))) {
      recaptchaToken = ''
    }
  }

  if (env.RECAPTCHA_ENABLED && !recaptchaToken) {
    setRecaptchaError(true)
    return
  }

  // 2. Validate user input (for non-authenticated users)
  if (!authenticated) {
    const _emailValid = await validateEmail(email)
    if (!_emailValid) return

    const _phoneValid = validatePhone(phone)
    if (!_phoneValid) return

    const _birthDateValid = validateBirthDate(birthDate)
    if (!_birthDateValid) return

    if (!tosChecked) {
      setTosError(true)
      return
    }
  }

  // 3. Prepare renter data (for guest checkout)
  let renter: movininTypes.User | undefined
  if (!authenticated) {
    renter = {
      email,
      phone,
      fullName,
      birthDate,
      language: UserService.getLanguage(),
    }
  }

  // 4. Convert price to base currency
  const basePrice = await movininHelper.convertPrice(
    price,
    PaymentService.getCurrency(),
    env.BASE_CURRENCY
  )

  // 5. Create booking object
  const booking: movininTypes.Booking = {
    agency: property.agency._id as string,
    property: property._id,
    renter: authenticated ? user?._id : undefined,
    location: location._id,
    from,
    to,
    status: movininTypes.BookingStatus.Pending,
    cancellation,
    price: basePrice,
  }

  // Continue to payment...
}
```

---

## Step 3: Payment Gateway Integration

The system supports three payment paths:

### Path A: Stripe Payment

**Frontend creates Stripe checkout session:**

```typescript
// Checkout.tsx (lines 300-318)
if (env.PAYMENT_GATEWAY === movininTypes.PaymentGateway.Stripe) {
  const payload: movininTypes.CreatePaymentPayload = {
    amount: price,
    currency: PaymentService.getCurrency(),
    locale: language,
    receiptEmail: (!authenticated ? renter?.email : user?.email) as string,
    name: movininHelper.truncateString(
      `${env.WEBSITE_NAME} - ${property.name}`,
      StripeService.ORDER_NAME_MAX_LENGTH
    ),
    description: `${env.WEBSITE_NAME} - ${property.name} - ${daysLabel} - ${location.name}`,
    customerName: (!authenticated ? renter?.fullName : user?.fullName) as string,
  }

  // Call backend to create Stripe session
  const res = await StripeService.createCheckoutSession(payload)
  setClientSecret(res.clientSecret)  // For embedded checkout
  _sessionId = res.sessionId
  _customerId = res.customerId
}
```

**Backend: `backend/src/controllers/stripeController.ts`** (lines 21-88)

```typescript
export const createCheckoutSession = async (req: Request, res: Response) => {
  const stripeAPI = (await import('../payment/stripe.js')).default
  const {
    amount,
    currency,
    locale,
    receiptEmail,
    name,
    description,
    customerName,
  }: movininTypes.CreatePaymentPayload = req.body

  // 1. Find or create Stripe customer
  const customers = await stripeAPI.customers.list({ email: receiptEmail })

  let customer: Stripe.Customer
  if (customers.data.length === 0) {
    customer = await stripeAPI.customers.create({
      email: receiptEmail,
      name: customerName,
    })
  } else {
    [customer] = customers.data
  }

  // 2. Create Stripe checkout session
  const expireAt = Math.floor((Date.now() / 1000) + env.STRIPE_SESSION_EXPIRE_AT)

  const session = await stripeAPI.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        price_data: {
          product_data: { name },
          unit_amount: Math.floor(amount * 100),  // Stripe uses cents
          currency: currency.toLowerCase(),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: `${helper.trimEnd(env.FRONTEND_HOST, '/')}/checkout-session/{CHECKOUT_SESSION_ID}`,
    customer: customer.id,
    locale: helper.getStripeLocale(locale),
    payment_intent_data: { description },
    expires_at: expireAt,
  })

  // 3. Return session details to frontend
  const result: movininTypes.PaymentResult = {
    sessionId: session.id,
    customerId: customer.id,
    clientSecret: session.client_secret,
  }
  res.json(result)
}
```

### Path B: PayPal Payment

```typescript
// Checkout.tsx (lines 632-669)
<PayPalButtons
  createOrder={async () => {
    const name = movininHelper.truncateString(
      property.name,
      PayPalService.ORDER_NAME_MAX_LENGTH
    )
    const _description = `${property.name} - ${daysLabel} - ${location.name}`
    const description = movininHelper.truncateString(
      _description,
      PayPalService.ORDER_DESCRIPTION_MAX_LENGTH
    )

    // Create PayPal order via backend
    const orderId = await PayPalService.createOrder(
      bookingId!,
      price,
      PaymentService.getCurrency(),
      name,
      description
    )
    return orderId
  }}
  onApprove={async (data, actions) => {
    setPayPalProcessing(true)

    // Capture payment
    await actions.order?.capture()
    const { orderID } = data

    // Verify with backend
    const status = await PayPalService.checkOrder(bookingId!, orderID)

    if (status === 200) {
      setVisible(false)
      setSuccess(true)
    } else {
      setPaymentFailed(true)
    }
  }}
/>
```

### Path C: Pay Later (No immediate payment)

If the agency allows "Pay Later" option:

```typescript
// Checkout.tsx (lines 571-613)
{property.agency.payLater && (
  <RadioGroup
    defaultValue="payOnline"
    onChange={(event) => {
      setPayLater(event.target.value === 'payLater')
    }}
  >
    <FormControlLabel
      value="payLater"
      control={<Radio />}
      label="Pay Later"
    />
    <FormControlLabel
      value="payOnline"
      control={<Radio />}
      label="Pay Online"
    />
  </RadioGroup>
)}
```

---

## Step 4: Create Temporary Booking

After initiating payment, a temporary booking is created in the database.

### Frontend: `frontend/src/pages/Checkout.tsx` (lines 324-345)

```typescript
const payload: movininTypes.CheckoutPayload = {
  renter,           // New user data (if not authenticated)
  booking,          // Booking details
  payLater,         // Boolean: skip payment
  sessionId: _sessionId,        // Stripe session ID
  customerId: _customerId,      // Stripe customer ID
  payPal: env.PAYMENT_GATEWAY === movininTypes.PaymentGateway.PayPal,
}

const { status, bookingId: _bookingId } = await BookingService.checkout(payload)

if (status === 200) {
  if (payLater) {
    setVisible(false)
    setSuccess(true)
  }
  setBookingId(_bookingId)
  setSessionId(_sessionId)
}
```

### Backend: `backend/src/controllers/bookingController.ts` (lines 162-304)

```typescript
export const checkout = async (req: Request, res: Response) => {
  let user: env.User | null
  const { body }: { body: movininTypes.CheckoutPayload } = req
  const { renter } = body

  if (!body.booking) {
    throw new Error('Booking missing')
  }

  // 1. Create new user if guest checkout
  if (renter) {
    renter.verified = false
    renter.blacklisted = false

    user = new User(renter)
    await user.save()

    // Create verification token
    const token = new Token({ user: user._id, token: helper.generateToken() })
    await token.save()

    i18n.locale = user.language

    // Send account activation email
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: user.email,
      subject: i18n.t('ACCOUNT_ACTIVATION_SUBJECT'),
      html: `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${i18n.t('ACCOUNT_ACTIVATION_LINK')}<br><br>
        ${helper.joinURL(env.FRONTEND_HOST, 'activate')}/?u=${encodeURIComponent(user._id.toString())}&e=${encodeURIComponent(user.email)}&t=${encodeURIComponent(token.token)}<br><br>
        ${i18n.t('REGARDS')}<br>
      </p>`,
    }
    await mailHelper.sendMail(mailOptions)

    body.booking.renter = user._id.toString()
  } else {
    user = await User.findById(body.booking.renter)
  }

  if (!user) {
    logger.info('Renter not found', body)
    res.sendStatus(204)
    return
  }

  // 2. Handle payment status
  if (!body.payLater) {
    const { payPal, paymentIntentId, sessionId } = body

    if (!payPal && !paymentIntentId && !sessionId) {
      throw new Error('paymentIntentId and sessionId not found')
    }

    if (!payPal) {
      body.booking.customerId = body.customerId
    }

    if (paymentIntentId) {
      // Payment already completed (mobile app flow)
      const paymentIntent = await stripeAPI.paymentIntents.retrieve(paymentIntentId)
      if (paymentIntent.status !== 'succeeded') {
        const message = `Payment failed: ${paymentIntent.status}`
        logger.error(message, body)
        res.status(400).send(message)
        return
      }

      body.booking.paymentIntentId = paymentIntentId
      body.booking.status = movininTypes.BookingStatus.Paid
    } else {
      // Booking is TEMPORARY until payment verified
      let expireAt = new Date()
      expireAt.setSeconds(expireAt.getSeconds() + env.BOOKING_EXPIRE_AT)

      body.booking.sessionId = !payPal ? body.sessionId : undefined
      body.booking.status = movininTypes.BookingStatus.Void  // Temporary status
      body.booking.expireAt = expireAt  // TTL index - auto-deletes if unpaid

      // Temporary user also expires if not verified
      if (!user.verified) {
        expireAt = new Date()
        expireAt.setSeconds(expireAt.getSeconds() + env.USER_EXPIRE_AT)

        user.expireAt = expireAt
        await user.save()
      }
    }
  }

  // 3. Save Stripe customer ID to user
  const { customerId } = body
  if (customerId) {
    user.customerId = customerId
    await user?.save()
  }

  // 4. Save booking to MongoDB
  const { language } = user
  i18n.locale = language

  const booking = new Booking(body.booking)
  await booking.save()

  // 5. For pay later or immediate payment: send notifications
  if (body.payLater || (booking.status === movininTypes.BookingStatus.Paid && body.paymentIntentId && body.customerId)) {
    // Send confirmation email
    if (!(await confirm(user, booking, body.payLater!))) {
      res.sendStatus(400)
      return
    }

    // Notify agency
    const agency = await User.findById(booking.agency)
    if (!agency) {
      logger.info(`Agency ${booking.agency} not found`)
      res.sendStatus(204)
      return
    }
    i18n.locale = agency.language
    let message = body.payLater
      ? i18n.t('BOOKING_PAY_LATER_NOTIFICATION')
      : i18n.t('BOOKING_PAID_NOTIFICATION')
    await notify(user, booking._id.toString(), agency, message)

    // Notify admin
    const admin = !!env.ADMIN_EMAIL && (
      await User.findOne({ email: env.ADMIN_EMAIL, type: movininTypes.UserType.Admin })
    )
    if (admin) {
      i18n.locale = admin.language
      message = body.payLater
        ? i18n.t('BOOKING_PAY_LATER_NOTIFICATION')
        : i18n.t('BOOKING_PAID_NOTIFICATION')
      await notify(user, booking._id.toString(), admin, message)
    }
  }

  res.status(200).send({ bookingId: booking._id })
}
```

---

## Step 5: User Completes Payment

For Stripe payments, the embedded checkout form is displayed:

### Frontend: `frontend/src/pages/Checkout.tsx` (lines 617-628)

```typescript
{clientSecret && (
  <div className="payment-options-container">
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      <EmbeddedCheckout />  {/* Stripe's payment form */}
    </EmbeddedCheckoutProvider>
  </div>
)}
```

After successful payment, Stripe redirects the user to:
```
/checkout-session/{CHECKOUT_SESSION_ID}
```

---

## Step 6: Verify Payment & Finalize Booking

The checkout session page verifies the payment and finalizes the booking.

### Frontend: `frontend/src/pages/CheckoutSession.tsx` (lines 25-46)

```typescript
useEffect(() => {
  if (sessionId) {
    const checkSession = async () => {
      try {
        setLoading(true)

        // Verify payment with backend
        const status = await StripeService.checkCheckoutSession(sessionId)

        // Get booking ID from session
        const _bookingId = await BookingService.getBookingId(sessionId)
        setBookingId(_bookingId)

        setNoMatch(status === 204)
        setSuccess(status === 200)
      } catch {
        setSuccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }
}, [sessionId])
```

### Backend: `backend/src/controllers/stripeController.ts` (lines 98-188)

```typescript
export const checkCheckoutSession = async (req: Request, res: Response) => {
  const stripeAPI = (await import('../payment/stripe.js')).default
  const { sessionId } = req.params

  // 1. Retrieve Stripe Checkout Session
  let session: Stripe.Checkout.Session | undefined
  try {
    session = await stripeAPI.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    logger.error(`[stripe.checkCheckoutSession] retrieve session error: ${sessionId}`, err)
  }

  if (!session) {
    const msg = `Session ${sessionId} not found`
    logger.info(`[stripe.checkCheckoutSession] ${msg}`)
    res.status(204).send(msg)
    return
  }

  // 2. Find temporary booking by sessionId
  const booking = await Booking.findOne({
    sessionId,
    expireAt: { $ne: null }  // Only find temporary bookings
  })

  if (!booking) {
    const msg = `Booking with sessionId ${sessionId} not found`
    logger.info(`[stripe.checkCheckoutSession] ${msg}`)
    res.status(204).send(msg)
    return
  }

  // 3. If payment succeeded, finalize booking
  if (session.payment_status === 'paid') {
    // Remove TTL expiration (make booking permanent)
    booking.expireAt = undefined
    booking.status = movininTypes.BookingStatus.Paid
    await booking.save()

    const property = await Property.findById(booking.property)
    if (!property) {
      throw new Error(`Property ${booking.property} not found`)
    }

    const agency = await User.findById(booking.agency)
    if (!agency) {
      throw new Error(`Supplier ${booking.agency} not found`)
    }

    // Remove user expiration too
    const user = await User.findById(booking.renter)
    if (!user) {
      throw new Error(`Driver ${booking.renter} not found`)
    }

    user.expireAt = undefined
    await user.save()

    // Send confirmation email to renter
    if (!(await bookingController.confirm(user, booking, false))) {
      res.sendStatus(400)
      return
    }

    // Notify agency
    i18n.locale = agency.language
    let message = i18n.t('BOOKING_PAID_NOTIFICATION')
    await bookingController.notify(user, booking._id.toString(), agency, message)

    // Notify admin (if configured)
    const admin = !!env.ADMIN_EMAIL && (
      await User.findOne({ email: env.ADMIN_EMAIL, type: movininTypes.UserType.Admin })
    )
    if (admin) {
      i18n.locale = admin.language
      message = i18n.t('BOOKING_PAID_NOTIFICATION')
      await bookingController.notify(user, booking._id.toString(), admin, message)
    }

    res.sendStatus(200)
    return
  }

  // 4. If payment failed, delete temporary booking
  await booking.deleteOne()
  res.status(400).send(session.payment_status)
}
```

---

## Step 7: Notifications

The system sends multiple notifications when a booking is confirmed.

### In-App Notification + Email: `backend/src/controllers/bookingController.ts` (lines 54-91)

```typescript
export const notify = async (
  renter: env.User,
  bookingId: string,
  user: env.User,
  notificationMessage: string
) => {
  i18n.locale = user.language

  // 1. Create in-app notification
  const message = `${renter.fullName} ${notificationMessage} ${bookingId}.`
  const notification = new Notification({
    user: user._id,
    message,
    booking: bookingId,
  })
  await notification.save()

  // 2. Update notification counter (for UI badge)
  let counter = await NotificationCounter.findOne({ user: user._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: user._id, count: 1 })
    await counter.save()
  }

  // 3. Send email notification (if enabled)
  if (user.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: user.email,
      subject: message,
      html: `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${message}<br><br>
        ${helper.joinURL(env.ADMIN_HOST, `update-booking?b=${bookingId}`)}<br><br>
        ${i18n.t('REGARDS')}<br>
      </p>`,
    }
    await mailHelper.sendMail(mailOptions)
  }
}
```

### Confirmation Email to Renter: `backend/src/controllers/bookingController.ts` (lines 102-151)

```typescript
export const confirm = async (
  user: env.User,
  booking: env.Booking,
  payLater: boolean
) => {
  const { language } = user
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: env.TIMEZONE,
  }

  const from = booking.from.toLocaleString(locale, options)
  const to = booking.to.toLocaleString(locale, options)

  const property = await Property.findById(booking.property)
    .populate<{ agency: env.User }>('agency')

  const location = await Location.findById(booking.location)
    .populate<{ values: env.LocationValue[] }>('values')

  const mailOptions: nodemailer.SendMailOptions = {
    from: env.SMTP_FROM,
    to: user.email,
    subject: `Booking ${booking._id} confirmed`,
    html: `<p>
      ${i18n.t('HELLO')}${user.fullName},<br><br>
      ${!payLater ? `Your booking ${booking._id} has been confirmed.` : ''}
      <br><br>
      Your booking with ${property.agency.fullName}:<br>
      Check-in: ${from}<br>
      Property: ${property.name}<br>
      ${property.address ? `Address: ${property.address}<br>` : ''}
      ${property.latitude && property.longitude
        ? `<a href='https://maps.google.com/?q=${property.latitude},${property.longitude}'>View on Map</a><br>`
        : ''}
      <br>
      Check-out: ${to}<br>
      <br>
      ${i18n.t('REGARDS')}<br>
    </p>`,
  }

  await mailHelper.sendMail(mailOptions)
  return true
}
```

### Push Notification (Mobile): `backend/src/controllers/bookingController.ts` (lines 354-412)

```typescript
// When booking status changes, notify renter via push notification
const pushToken = await PushToken.findOne({ user: renter._id })

if (pushToken) {
  const { token } = pushToken
  const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN, useFcmV1: true })

  if (!Expo.isExpoPushToken(token)) {
    logger.info(`Push token ${token} is not a valid Expo push token.`)
    return
  }

  const messages: ExpoPushMessage[] = [
    {
      to: token,
      sound: 'default',
      body: message,
      data: {
        user: renter._id,
        notification: notification._id,
        booking: booking._id,
      },
    },
  ]

  const chunks = expo.chunkPushNotifications(messages)

  for (const chunk of chunks) {
    const ticketChunks = await expo.sendPushNotificationsAsync(chunk)
    // Handle ticket responses...
  }
}
```

---

## Booking States & TTL

### Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BOOKING STATUS FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐      Payment       ┌──────────┐                      │
│  │   VOID   │ ──────────────────>│   PAID   │                      │
│  │(temporary)│    successful     │          │                      │
│  └────┬─────┘                    └────┬─────┘                      │
│       │                               │                             │
│       │ Session                       │ Agency/Admin                │
│       │ expires                       │ action                      │
│       ▼                               ▼                             │
│  ┌──────────┐                    ┌──────────┐                      │
│  │ DELETED  │                    │ RESERVED │                      │
│  │(auto TTL)│                    │CANCELLED │                      │
│  └──────────┘                    │ DEPOSIT  │                      │
│                                  │ PENDING  │                      │
│                                  └──────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Booking Statuses

| Status | Description |
|--------|-------------|
| `VOID` | Temporary booking awaiting payment |
| `PENDING` | Pay Later booking awaiting confirmation |
| `DEPOSIT` | Partial payment received |
| `PAID` | Full payment received |
| `RESERVED` | Booking confirmed and reserved |
| `CANCELLED` | Booking cancelled |

### TTL Indexes (Auto-cleanup)

MongoDB TTL indexes automatically delete expired documents:

| Collection | Field | Purpose | Default TTL |
|------------|-------|---------|-------------|
| **Booking** | `expireAt` | Delete unpaid temporary bookings | ~1 hour |
| **User** | `expireAt` | Delete unverified guest users | ~1 hour |
| **Token** | `expireAt` | Delete verification tokens | ~24 hours |

```typescript
// Booking model TTL index
expireAt: {
  type: Date,
  index: { expires: 0 }  // TTL index
}
```

---

## Data Models Involved

### Booking Model

```typescript
// backend/src/models/Booking.ts
{
  _id: ObjectId,
  agency: ObjectId (ref: User),      // Agency managing the property
  property: ObjectId (ref: Property), // Booked property
  renter: ObjectId (ref: User),       // Customer
  location: ObjectId (ref: Location), // Property location
  from: Date,                         // Check-in date
  to: Date,                           // Check-out date
  status: BookingStatus,              // Current status
  cancellation: Boolean,              // Cancellation option selected
  price: Number,                      // Total price
  sessionId: String,                  // Stripe session ID
  paymentIntentId: String,            // Stripe payment intent
  paypalOrderId: String,              // PayPal order ID
  customerId: String,                 // Stripe customer ID
  cancelRequest: Boolean,             // Cancellation requested
  expireAt: Date,                     // TTL for temporary bookings
  createdAt: Date,
  updatedAt: Date
}
```

### Related Models

| Model | Role |
|-------|------|
| **User** | Renter (customer), Agency, Admin |
| **Property** | The rental property being booked |
| **Location** | Geographic location with multilingual names |
| **Notification** | In-app notification record |
| **NotificationCounter** | Badge count per user |
| **Token** | Email verification token |
| **PushToken** | Mobile push notification token |

---

## Key Files Reference

### Frontend

| File | Purpose |
|------|---------|
| `pages/Checkout.tsx` | Main checkout form, payment initiation |
| `pages/CheckoutSession.tsx` | Payment verification after Stripe redirect |
| `services/BookingService.ts` | API calls for booking operations |
| `services/StripeService.ts` | Stripe API calls |
| `services/PayPalService.ts` | PayPal API calls |
| `components/CheckoutStatus.tsx` | Success/error status display |
| `components/CheckoutOptions.tsx` | Cancellation and pricing options |

### Backend

| File | Purpose |
|------|---------|
| `controllers/bookingController.ts` | Checkout, notifications, CRUD |
| `controllers/stripeController.ts` | Stripe session creation & verification |
| `controllers/paypalController.ts` | PayPal order creation & verification |
| `models/Booking.ts` | Booking schema & indexes |
| `routes/bookingRoutes.ts` | API endpoint definitions |
| `routes/stripeRoutes.ts` | Stripe endpoint definitions |
| `utils/mailHelper.ts` | Email sending utilities |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/checkout` | Create booking (with/without payment) |
| POST | `/api/create-checkout-session` | Create Stripe session |
| GET | `/api/check-checkout-session/:sessionId` | Verify Stripe payment |
| GET | `/api/booking-id/:sessionId` | Get booking ID from session |
| GET | `/api/booking/:id/:language` | Get booking details |
| POST | `/api/cancel-booking/:id` | Request booking cancellation |
| DELETE | `/api/delete-temp-booking/:bookingId/:sessionId` | Delete unpaid booking |

---

## Cancel Booking Flow

When a user requests to cancel a booking:

### Frontend

```typescript
// BookingService.ts
export const cancel = (id: string): Promise<number> =>
  axiosInstance
    .post(`/api/cancel-booking/${encodeURIComponent(id)}`, null, { withCredentials: true })
    .then((res) => res.status)
```

### Backend: `bookingController.ts` (lines 887-928)

```typescript
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  const booking = await Booking.findOne({ _id: new mongoose.Types.ObjectId(id) })
    .populate<{ agency: env.User }>('agency')
    .populate<{ renter: env.User }>('renter')

  if (booking && booking.cancellation && !booking.cancelRequest) {
    // Mark as cancellation requested
    booking.cancelRequest = true
    await booking.save()

    // Notify agency
    const agency = await User.findById(booking.agency)
    i18n.locale = agency.language
    await notify(booking.renter, booking._id.toString(), agency, i18n.t('CANCEL_BOOKING_NOTIFICATION'))

    // Notify admin
    const admin = await User.findOne({
      email: env.ADMIN_EMAIL,
      type: movininTypes.UserType.Admin
    })
    if (admin) {
      i18n.locale = admin.language
      await notify(booking.renter, booking._id.toString(), admin, i18n.t('CANCEL_BOOKING_NOTIFICATION'))
    }

    res.sendStatus(200)
    return
  }

  res.sendStatus(204)
}
```

---

*Document generated for DaryWin v6.7.0*
