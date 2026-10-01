// src/lib/highlightLead.jsx
//
// Bolds the lead clause (up to the first comma/period) of a sentence so
// CMS-authored copy reads with a scannable, condensed feel.
// Shared by the Membership section and the benefits carousel.
export function highlightLead(text = '') {
  const match = String(text).match(/^([^,.:]+)([,.:]?.*)$/s)
  if (!match) return text
  return (
    <>
      <strong>{match[1]}</strong>
      {match[2]}
    </>
  )
}

export default highlightLead
