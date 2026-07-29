import { useEffect, useId, useState } from 'react'

/** A shared autocomplete control for Education Dashboard district filters. */
export default function DistrictCombobox({ districts = [], value = '', onChange, label = 'District', allowAll = true }) {
  const listId = useId()
  const selected = districts.find(district => district.slug === value)
  const emptyLabel = allowAll ? 'All Districts' : ''
  const [text, setText] = useState(selected?.name || emptyLabel)
  useEffect(() => { setText(selected?.name || emptyLabel) }, [selected?.name, value, emptyLabel])
  const update = raw => {
    setText(raw)
    if (allowAll && (!raw || raw.toLowerCase() === 'all districts')) return onChange('')
    const match = districts.find(district => district.name.toLowerCase() === raw.toLowerCase())
    if (match) onChange(match.slug)
  }
  return <label className="district-combobox"><span>{label}</span><div><input list={listId} value={text} onChange={event => update(event.target.value)} placeholder="Search or select a district" aria-label={label}/>{allowAll && <button type="button" onClick={() => update('All Districts')} aria-label="Clear district filter">×</button>}</div><datalist id={listId}>{allowAll && <option value="All Districts"/>}{districts.map(district => <option key={district.slug} value={district.name}/>)}</datalist></label>
}
