// src/lib/googleSheet.js
//
// The secretariat's Google Sheet, fed by a Google Apps Script web app.
//
// Every submission to it goes through a hidden <iframe> + a hidden <form>.
// That is deliberate and is NOT a workaround we chose for convenience:
//
//   * Google Apps Script's doPost() does not return CORS headers, so a fetch()
//     with mode:'cors' is always blocked. Posting from a real <form> is a
//     plain navigation, which the browser allows cross-origin.
//   * Because the response lands inside the iframe, the page cannot read it.
//     So callers get no success/failure signal and treat "posted" as success —
//     the same approach Contact.jsx and ApplyModal.jsx already use.
//
// ⚠️ The endpoint below is the SAME deployed web app the contact form and the
//    membership modal already post to. It is centralised here so there is one
//    place to change it; Contact.jsx and ApplyModal.jsx still hold their own
//    copies and can be pointed at this module later.
//
// The `type` field is the discriminator the Apps Script switches on. Known
// values, all handled by google-apps-script/Code.gs:
//   'contact'   — the public contact form
//   'membership'— the apply-for-membership modal
//   'signup'    — the member sign-up form (added with the portfolio fields)

export const SHEET_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbxK5Da_gByb4xFNntM-MDVu46EpQg0zX8U7CHiJ12BE3t8SV4cVR19kJo5KxE9flOoeFg/exec'

/**
 * POST a row to the sheet. Resolves as soon as the request is dispatched —
 * there is no readable response to wait for, so this is fire-and-forget by
 * design. Never rejects; a submission is never allowed to fail a signup.
 *
 * @param {Record<string, string|number>} payload  Must include a `type`.
 * @returns {Promise<void>}
 */
export function submitToSheet(payload) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }

    // A unique name per call so two submissions in the same millisecond (a
    // double-click, say) cannot land in one another.
    const frameName = `sheet_iframe_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`

    const frame = document.createElement('iframe')
    frame.name = frameName
    frame.style.display = 'none'
    document.body.appendChild(frame)

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = SHEET_ENDPOINT
    form.target = frameName
    form.style.display = 'none'

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      // A null/undefined field would otherwise arrive as the literal text
      // "null" / "undefined" in the sheet cell.
      input.value = value === null || value === undefined ? '' : String(value)
      form.appendChild(input)
    })

    document.body.appendChild(form)

    try {
      form.submit()
    } catch (error) {
      console.warn('submitToSheet could not dispatch', error)
    }

    // The iframe gives no readable response, so the form is torn down on a
    // fixed timer rather than on completion.
    setTimeout(() => {
      form.remove()
      frame.remove()
      resolve()
    }, 1500)
  })
}